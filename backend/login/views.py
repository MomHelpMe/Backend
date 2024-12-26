from django.conf import settings
from django.shortcuts import redirect
from django.core.cache import cache
from django.core.mail import EmailMultiAlternatives
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from users.models import User
from datetime import datetime, timedelta
from requests.exceptions import RequestException, Timeout
import requests
import jwt
import secrets
import logging

logger = logging.getLogger(__name__)


@api_view(["GET"])
def login(request):
    oauth_url = settings.OAUTH_URL
    redirect_uri = settings.OAUTH_REDIRECT_URI
    client_id = settings.OAUTH_CLIENT_ID
    state = settings.OAUTH_STATE  # CSRF 방지용 랜덤 문자열
    return redirect(f"{oauth_url}?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&state={state}")


@api_view(["POST"])
def callback(request):
    code = request.data.get("code")
    if not code:
        return Response(status=status.HTTP_401_UNAUTHORIZED)

    access_token = get_acccess_token(code)
    if not access_token:
        return Response(status=status.HTTP_401_UNAUTHORIZED)

    user_data = get_user_info(access_token)
    if not user_data:
        return Response(status=status.HTTP_401_UNAUTHORIZED)

    user, created = get_or_save_user(user_data)

    if created:
        data = {"is_2FA": False}
    else:
        data = {"is_2FA": user.is_2FA}

    token = generate_jwt(user, data)

    response = Response(data, status=status.HTTP_200_OK)
    response.set_cookie("jwt", token, httponly=False, secure=True, samesite="LAX")
    return response


def get_acccess_token(code):
    token_url = settings.OAUTH_TOKEN_URL
    redirect_uri = settings.OAUTH_REDIRECT_URI
    client_id = settings.OAUTH_CLIENT_ID
    client_secret = settings.OAUTH_CLIENT_SECRET

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
    }
    try:
        response = requests.post(token_url, data=data)
        response.raise_for_status()  # 200 OK를 받지 못하면 에러를 발생시킴
        return response.json().get("access_token")
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to get access token: {e}", exc_info=True)
        logger.error(f"Response content: {e.response.content if e.response else 'No response'}")
        return None


def get_user_info(access_token):
    try:
        user_info_response = requests.get(
            settings.OAUTH_USER_INFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )

        if user_info_response.status_code != status.HTTP_200_OK:
            return None
        return user_info_response.json()

    except Timeout:
        # 요청이 타임아웃된 경우 처리
        logger.error("Request timed out")
        return None

    except RequestException as e:
        # 그 외 요청 실패 시 처리 (네트워크 문제, 잘못된 URL 등)
        logger.error(f"Failed to get user info: {e}", exc_info=True)
        return None


def get_or_save_user(user_data):
    user_uid = user_data.get("id")
    nickname = user_data.get("login")
    email = user_data.get("email")
    img_url = user_data.get("image", {}).get("link")

    user, created = User.objects.get_or_create(
        user_id=user_uid,
        defaults={
            "user_id": user_uid,
            "nickname": nickname,
            "email": email,
            "img_url": img_url,
            "is_2FA": False,
            "is_online": False,
        },
    )
    return user, created


def generate_jwt(user, data):
    if not data.get("is_2FA"):
        is_verified = True
    else:
        is_verified = False

    payload = {
        "id": user.user_id,
        "email": user.email,
        "is_verified": is_verified,
        "exp": datetime.utcnow() + timedelta(hours=5),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def regenerate_jwt(user_id, user_email, is_verified):
    payload = {
        "id": user_id,
        "email": user_email,
        "is_verified": is_verified,
        "exp": datetime.utcnow() + timedelta(hours=5),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_jwt(request):
    token = request.COOKIES.get("jwt")
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        logger.log("JWT EXPIRED")
        request.COOKIES.pop("jwt", None)
        return None
    except jwt.InvalidTokenError:
        logger.log("INVALID JWT")
        request.COOKIES.pop("jwt", None)
        return None


@api_view(["GET"])
def send_2fa_email(request):
    payload = decode_jwt(request)
    if not payload:
        return Response(status=status.status.HTTP_401_UNAUTHORIZED)

    user_id = payload.get("id")
    user_email = payload.get("email")

    subject = "Your OTP Code for 2FA"
    from_email = settings.DEFAULT_FROM_EMAIL
    to = [user_email]
    otp_code = generate_otp()

    cache_key = f"otp_code{user_id}"
    cache.set(cache_key, otp_code, timeout=60)

    html_content = f"""
    <html>
        <body>
            <h1>🎮 여기에 있다 OTP CODE 당신의! 🎉</h1>
            <p>당신의 OTP 코드는 <strong>{otp_code}</strong>입니다.</p>
            <p>이 코드는 1분 동안 유효합니다.</p>
            <p>감사합니다!</p>
        </body>
    </html>
    """

    message = EmailMultiAlternatives(subject, "", from_email, to)
    message.attach_alternative(html_content, "text/html")
    message.send()

    return Response(status=status.HTTP_200_OK)


def generate_otp(length=6):
    otp_code = "".join(secrets.choice("0123456789") for _ in range(length))
    logger.info(f"Generated OTP: {otp_code}")
    return otp_code


@api_view(["POST"])
def verify_otp(request):
    payload = decode_jwt(request)
    if not payload:
        return Response(status=status.HTTP_401_UNAUTHORIZED)

    input_otp = request.data.get("otp_code")
    user_id = payload.get("id")
    user_email = payload.get("email")

    cache_key = f"otp_code{user_id}"
    cached_otp = cache.get(cache_key)

    if cached_otp and str(cached_otp) == str(input_otp):
        data = {"success": True}
        is_verified = True
        token = regenerate_jwt(user_id, user_email, is_verified)
        response = Response(data, status=status.HTTP_200_OK)
        response.set_cookie("jwt", token, httponly=False, secure=True, samesite="LAX")
    else:
        data = {"success": False}
        response = Response(data, status=status.HTTP_200_OK)
    return response


@api_view(["GET"])
def verify_jwt(request):
    payload = decode_jwt(request)
    if not payload:
        return Response(status=status.HTTP_401_UNAUTHORIZED)

    is_verified = payload.get("is_verified")
    if is_verified == True:
        return Response(status=status.HTTP_200_OK)
    else:
        return Response(status=status.HTTP_401_UNAUTHORIZED)
