from rest_framework import serializers
from .models import User, Friend, Game, Tournament
from game.onlineConsumers import OnlineConsumer

class UserSerializer(serializers.ModelSerializer):
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["user_id", "nickname", "img_url", "is_2FA", "is_online", "win", "lose"]

    def get_is_online(self, obj):
        return obj.user_id in OnlineConsumer.online_user_list

class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["language"]

class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = Friend
        fields = ["user1", "user2"]


class FriendRequestSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
