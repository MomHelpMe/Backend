from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.cache import cache
from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework.decorators import api_view
from users.models import User
from datetime import datetime, timedelta
import requests
import jwt
import secrets
from django.views.decorators.csrf import ensure_csrf_cookie


@ensure_csrf_cookie
@api_view(["GET"])
def login(request):
    oauth_url = settings.OAUTH_URL
    redirect_uri = settings.OAUTH_REDIRECT_URI
    client_id = settings.OAUTH_CLIENT_ID
    state = settings.OAUTH_STATE  # CSRF 방지용 랜덤 문자열
    return redirect(
        f"{oauth_url}?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&state={state}"
    )


@api_view(["POST"])
def callback(request):
    code = request.data.get("code")
    if not code:
        print("No code in request")
        return Response(status=401)

    access_token = get_acccess_token(code)
    if not access_token:
        print("Failed to get access token!!!")
        return Response(status=401)

    user_data = get_user_info(access_token)
    if not user_data:
        print("Failed to get user info")
        return Response(status=401)

    user, created = get_or_save_user(user_data)
    # Test 위해서 True로 설정
    # user.is_2FA = True
    if created:
        data = {"is_2FA": False}
    else:
        data = {"is_2FA": user.is_2FA}

    token = generate_jwt(user, data)

    response = Response(data, status=200)
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
        print(f"Failed to get access token: {e}")
        return None


def get_user_info(access_token):
    user_info_response = requests.get(
        settings.OAUTH_USER_INFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
    )
    if user_info_response.status_code == 200:
        return user_info_response.json()
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
        print("JWT EXPIRED")
        return None
    except jwt.InvalidTokenError:
        print("JWT INVALID")
        return None


@api_view(["GET"])
def send_2fa_email(request):

    if not validate_jwt(request):
        return Response(status=401)

    payload = decode_jwt(request)
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

    return Response(status=200)


def validate_jwt(request):
    try:
        payload = decode_jwt(request)
        if not payload:
            return False
        return True
    except jwt.ExpiredSignatureError:
        print("JWT EXPIRED")
        return False
    except jwt.InvalidTokenError:
        print("JWT INVALID")
        return False


def generate_otp(length=6):
    otp_code = "".join(secrets.choice("0123456789") for _ in range(length))
    print("OTP_CODE : ", otp_code)
    return otp_code


@api_view(["POST"])
def verify_otp(request):
    if not validate_jwt(request):
        return Response(status=401)

    input_otp = request.data.get("otp_code")

    payload = decode_jwt(request)
    user_id = payload.get("id")
    user_email = payload.get("email")

    cache_key = f"otp_code{user_id}"
    cached_otp = cache.get(cache_key)

    if cached_otp and str(cached_otp) == str(input_otp):
        data = {"success": True}
        is_verified = True
        token = regenerate_jwt(user_id, user_email, is_verified)
        response = Response(data, status=200)
        response.set_cookie("jwt", token, httponly=False, secure=True, samesite="LAX")
    else:
        data = {"success": False}
        response = Response(data, status=200)
    return response


@api_view(["GET"])
def verify_jwt(request):
    payload = decode_jwt(request)
    if not payload:
        return Response({"error": "Invalid JWT"}, status=401)

    is_verified = payload.get("is_verified")
    return Response(status=200 if is_verified else 401)
