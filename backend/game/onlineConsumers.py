import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
import jwt
from django.conf import settings
from channels.exceptions import DenyConnection
from .matchingConsumers import MatchingGameConsumer, MatchingGameState
import random
import uuid


class OnlineConsumer(AsyncWebsocketConsumer):
    online_user_list = set([])
    matching_queue = []
    matching_task = None

    @classmethod
    async def start_matching_task(cls):
        """중앙에서 매칭을 처리하는 task"""
        while True:
            await asyncio.sleep(2)
            if len(cls.matching_queue) >= 2:
                print("2 users in queue")
                await cls.start_game()

    @classmethod
    async def start_game(cls):
        user1 = cls.matching_queue.pop(0)
        user2 = cls.matching_queue.pop(0)

        room_name = f"{user1.uid}_{user2.uid}_{str(uuid.uuid4())[:8]}"

        game_state = MatchingGameState()
        await game_state.initialize(user1.uid, user2.uid)  # 비동기 초기화
        MatchingGameConsumer.game_states[room_name] = game_state
        MatchingGameConsumer.client_counts[room_name] = 2

        await user1.send(
            text_data=json.dumps({"action": "start_game", "room_name": room_name})
        )
        await user2.send(
            text_data=json.dumps({"action": "start_game", "room_name": room_name})
        )

        print(f"Users {user1.uid} and {user2.uid} moved to game room: {room_name}")

    async def connect(self):
        self.uid = None
        self.authenticated = False
        await self.accept()

        if OnlineConsumer.matching_task is None:
            OnlineConsumer.matching_task = asyncio.create_task(
                OnlineConsumer.start_matching_task()
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json["action"]

        print("text_data", text_data_json)
        if action == "authenticate":
            token = text_data_json.get("token")
            if not token or not self.authenticate(token):
                print("authentication failed")
                await self.close(code=4001)
                return
            self.authenticated = True
            OnlineConsumer.online_user_list.add(self.uid)
            print("Online user list: ", OnlineConsumer.online_user_list)
        elif not self.authenticated:
            print("Invalid action")
            await self.close(code=4001)
            return
        elif action == "enter-matching":
            await self.enter_matching()
        elif action == "leave-matching":
            await self.leave_matching()

    def authenticate(self, token):
        try:
            # Decode JWT token
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            print("decoded: ", decoded)
            self.uid = decoded.get("id")
            print("uid: ", self.uid)
            if self.uid in OnlineConsumer.online_user_list:
                print("User already online")
                return False
            return True
        except jwt.ExpiredSignatureError:
            print("Token has expired")
            return False
        except jwt.InvalidTokenError:
            print("Invalid token")
            return False

    async def enter_matching(self):
        for user in list(OnlineConsumer.matching_queue):
            if user.uid == self.uid:
                OnlineConsumer.matching_queue.remove(user)
                print(f"Replaced existing user {self.uid} in the matching queue.")
                break
        OnlineConsumer.matching_queue.append(self)
        print(
            "Matching queue: ", [user.uid for user in OnlineConsumer.matching_queue]
        )

    async def leave_matching(self):
        for user in list(OnlineConsumer.matching_queue):
            if user.uid == self.uid:
                OnlineConsumer.matching_queue.remove(user)
                print(f"User {self.uid} removed from matching queue")
                break
        print(
            "Matching queue: ", [user.uid for user in OnlineConsumer.matching_queue]
        )

    async def disconnect(self, close_code):
        await self.leave_matching()
        try:
            if self.uid in OnlineConsumer.online_user_list:
                OnlineConsumer.online_user_list.remove(self.uid)
                print(f"Disconnected user {self.uid}. Updated list: {OnlineConsumer.online_user_list}")
            else:
                print(f"User {self.uid} not found in the online user list.")
        except Exception as e:
            print(f"Error during disconnect: {e}")
