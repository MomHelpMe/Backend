from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import User, Friend, Game, Tournament
from .serializers import (
    UserSerializer,
    LanguageSerializer,
    FriendSerializer,
    FriendRequestSerializer,
)
from login.views import decode_jwt
from drf_yasg.utils import swagger_auto_schema
from game.onlineConsumers import OnlineConsumer
from django.utils.html import escape


class UserDetailView(APIView):
    def get(self, request):
        payload = decode_jwt(request)
        if not payload:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        user = get_object_or_404(User, pk=payload.get("id"))
        serializer = UserSerializer(user)
        return JsonResponse(serializer.data)

    @swagger_auto_schema(request_body=UserSerializer, responses={200: UserSerializer()})
    def put(self, request):
        payload = decode_jwt(request)
        if not payload:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        user = get_object_or_404(User, pk=payload.get("id"))
        # FIXME: is_online도 변경이 가능함 수정 필요
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.validated_data['nickname'] = escape(serializer.validated_data['nickname'])
            serializer.validated_data['img_url'] = escape(serializer.validated_data['img_url'])
            serializer.save()
            return JsonResponse(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        token = request.COOKIES.get("jwt")
        if not token:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        # Delete the JWT cookie
        response = Response({"message": "Logged out successfully"})
        response.delete_cookie("jwt")

        user_id = decode_jwt(request).get("id")
        try:
            if user_id in OnlineConsumer.online_user_list:
                OnlineConsumer.online_user_list.remove(user_id)
                print(f"User {user_id} removed. Online user list: {OnlineConsumer.online_user_list}")
            else:
                print(f"User {user_id} not found in the online user list.")
        except Exception as e:
            print(f"Error while logging out: {e}")
        return response

    def delete(self, request):
        payload = decode_jwt(request)
        if not payload:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        user = get_object_or_404(User, pk=payload.get("id"))
        user.delete()
        response = Response()
        response.delete_cookie("jwt")
        return response


class LanguageView(APIView):
    def get(self, request):
        payload = decode_jwt(request)
        if not payload:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        user = get_object_or_404(User, pk=payload.get("id"))
        return Response({"language": user.language})

    @swagger_auto_schema(request_body=LanguageSerializer, responses={200: LanguageSerializer()})
    def put(self, request):
        payload = decode_jwt(request)
        if not payload:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        user = get_object_or_404(User, pk=payload.get("id"))
        print(request.data.get("language"))
        serializer = LanguageSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FriendDetailView(APIView):
    def get(self, request):
        payload = decode_jwt(request)
        if not payload:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        
        user = get_object_or_404(User, pk=payload.get("id"))
        
        # 단방향 친구 관계만 조회
        friends = Friend.objects.filter(adder=user)

        # 친구 정보 직렬화해 JSON 응답으로 반환
        serializer = UserSerializer([friend.friend_user for friend in friends], many=True)
        return JsonResponse(serializer.data, safe=False)

    @swagger_auto_schema(
        request_body=FriendRequestSerializer,
        responses={201: FriendSerializer()},
    )
    def post(self, request):
        payload = decode_jwt(request)
        if not payload:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        
        user = get_object_or_404(User, pk=payload.get("id"))

        serializer = FriendRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        friend_user_id = serializer.validated_data["user_id"]
        if user.user_id == friend_user_id:
            return Response({"error": "Cannot be friend with yourself"}, status=status.HTTP_400_BAD_REQUEST)
        friend_user = get_object_or_404(User, pk=friend_user_id)

        # 중복 친구 요청 방지(단방향만 체크)
        if Friend.objects.filter(adder=user, friend_user=friend_user).exists():
            return Response({"error": "Friendship already exists"}, status=status.HTTP_400_BAD_REQUEST)

        # 새로운 단방향 친구 관계 생성
        friend = Friend(adder=user, friend_user=friend_user)
        friend.save()

        response_serializer = FriendSerializer(friend)
        return JsonResponse(response_serializer.data, status=status.HTTP_201_CREATED)

    @swagger_auto_schema(
        request_body=FriendRequestSerializer,
        responses={204: "No Content"},
    )
    def delete(self, request):
        payload = decode_jwt(request)
        if not payload:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        
        user = get_object_or_404(User, pk=payload.get("id"))

        friend_user_id = request.data.get("user_id")
        friend_user = get_object_or_404(User, pk=friend_user_id)

        # 요청한 친구 관계만 삭제
        friend = Friend.objects.filter(adder=user, friend_user=friend_user)
        if not friend.exists():
            return Response({"error": "Friendship does not exist"}, status=status.HTTP_400_BAD_REQUEST)

        friend.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def get_user(request, pk):
    user = get_object_or_404(User, user_id=pk)
    user_serializer = UserSerializer(user)

    games_as_user1 = Game.objects.filter(user1=user)
    games_as_user2 = Game.objects.filter(user2=user)

    all_games = games_as_user1.union(games_as_user2)

    # 게임 정보 가공 및 직렬화
    games_data = []
    for game in all_games:
        if game.user1 == user and game.game_type == "PvP":
            op_user_id = game.user2.user_id
            my_score = game.score1
            op_score = game.score2
        elif game.user2 == user and game.game_type == "PvP":
            op_user_id = game.user1.user_id
            my_score = game.score2
            op_score = game.score1
        else:
            continue
        opponent = User.objects.get(user_id=op_user_id)
        games_data.append(
            {
                "op_user": {
                    "user_id": opponent.user_id,
                    "nickname": opponent.nickname,
                    "img_url": opponent.img_url,
                },
                "my_score": my_score,
                "op_score": op_score,
                "is_win": my_score > op_score,
                "start_timestamp": game.start_timestamp,
                "playtime": (game.end_timestamp - game.start_timestamp).total_seconds() // 60,  # playtime in minutes
            }
        )

    # 유저 정보와 게임 정보를 하나의 JSON으로 합치기
    response_data = {}
    response_data["user"] = user_serializer.data
    response_data["games"] = games_data

    return JsonResponse(response_data)


@api_view(["GET"])
def get_user_list(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return JsonResponse(serializer.data, safe=False)
