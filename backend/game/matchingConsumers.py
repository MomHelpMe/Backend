import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from game.srcs.Ball import Ball
from game.srcs.Bar import Bar
from game.srcs.GameMap import GameMap
import jwt
from django.conf import settings
from channels.exceptions import DenyConnection
from django.shortcuts import get_object_or_404
from users.models import User, Game
from asgiref.sync import sync_to_async
from django.utils import timezone

SCREEN_HEIGHT = 750
SCREEN_WIDTH = 1250
MAX_SCORE = 10


@sync_to_async
def get_user_nicknames(user1, user2):
    user1_nickname = "Unknown"
    user2_nickname = "Unknown"

    # Check user1
    if User.objects.filter(user_id=user1).exists():
        user1_nickname = User.objects.get(user_id=user1).nickname
    else:
        print(f"User with user_id={user1} does NOT exist.")

    # Check user2
    if User.objects.filter(user_id=user2).exists():
        user2_nickname = User.objects.get(user_id=user2).nickname
    else:
        print(f"User with user_id={user2} does NOT exist.")

    print("user1_nickname:", user1_nickname, "user2_nickname:", user2_nickname)
    return user1_nickname, user2_nickname


class MatchingGameState:
    async def initialize(self, user1, user2):
        try:
            self.game_state = 0 # 0: in game, 1: game over
            self.user = [user1, user2]
            self.user_authenticated = [False, False]
            self.map = GameMap()
            self.left_bar = Bar(0, Bar.X_GAP, SCREEN_HEIGHT // 2 - Bar.HEIGHT // 2, 0)
            self.right_bar = Bar(
                1,
                SCREEN_WIDTH - Bar.WIDTH - Bar.X_GAP,
                SCREEN_HEIGHT // 2 - Bar.HEIGHT // 2,
                SCREEN_WIDTH - Bar.WIDTH,
            )
            self.left_ball = Ball(0, SCREEN_HEIGHT, SCREEN_WIDTH, self.left_bar)
            self.right_ball = Ball(1, SCREEN_HEIGHT, SCREEN_WIDTH, self.right_bar)
            self.score = [0, 0]
            # print("user1:", user1, "user2:", user2)
            user1_nickname, user2_nickname = await get_user_nicknames(user1, user2)
            # print("user1_nickname:", user1_nickname, "user2_nickname:", user2_nickname)
            self.player = [user1_nickname, user2_nickname]
            self.penalty_time = [0, 0]
            print("initializing game state finished successfully!")
        except Exception as e:
            print("Error in MatchingGameState initialization:", e)


class MatchingGameConsumer(AsyncWebsocketConsumer):
    game_tasks = {}
    game_states = {}
    client_counts = {}

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = self.room_name
        self.authenticated = False
        self.start_time = timezone.now()

        if self.room_group_name not in MatchingGameConsumer.game_states:
            return

        await self.accept()


    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json["action"]

        if action == "authenticate":
            token = text_data_json.get("token")
            if not token or not self.authenticate(token):
                print("authentication failed")
                # await self.close(code=4001)
                return
            self.authenticated = True

            # Join room group after successful authentication
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

            # # Send initialize game state to the client
            await self.send_initialize_game()

            # Update authentication status in the game state
            state = MatchingGameConsumer.game_states[self.room_group_name]
            state.user_authenticated[self.user_index] = True

            # Check if both users are authenticated, then start the game_loop
            if all(state.user_authenticated):
                # Start the game loop if not already started
                if self.room_group_name not in MatchingGameConsumer.game_tasks:
                    print("user_authenticated", state.user_authenticated)
                    MatchingGameConsumer.game_tasks[self.room_group_name] = (
                        asyncio.create_task(self.game_loop())
                    )
        else:
            bar = text_data_json.get("bar")
            state = MatchingGameConsumer.game_states[self.room_group_name]

            # Update the bar position based on the action
            if bar == "left" and self.user_index == 0:
                if action == "move_up":
                    state.left_bar.move_up(Bar.SPEED)
                elif action == "move_down":
                    state.left_bar.move_down(Bar.SPEED, SCREEN_HEIGHT)
                elif action == "pull":
                    state.left_bar.pull()
                elif action == "release":
                    state.left_bar.set_release()
            elif bar == "right" and self.user_index == 1:
                if action == "move_up":
                    state.right_bar.move_up(Bar.SPEED)
                elif action == "move_down":
                    state.right_bar.move_down(Bar.SPEED, SCREEN_HEIGHT)
                elif action == "pull":
                    state.right_bar.pull()
                elif action == "release":
                    state.right_bar.set_release()

            # Update game state after moving bar or resetting game
            await self.send_game_state()

    def authenticate(self, token):
        try:
            # Decode JWT token
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            uid = decoded.get("id")
            # Check if uid matches the room_name
            state = MatchingGameConsumer.game_states[self.room_group_name]
            if str(uid) == str(state.user[0]):
                self.user_index = 0
                return True
            elif str(uid) == str(state.user[1]):
                self.user_index = 1
                return True
            else:
                return False
        except jwt.ExpiredSignatureError:
            return False
        except jwt.InvalidTokenError:
            return False

    async def disconnect(self, close_code):
        # 인증된 소켓만 처리
        if self.authenticated:
            print("disconnected: ", self.user_index)
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

            # 현재 방의 접속자 수를 1 줄임
            if self.room_group_name in MatchingGameConsumer.client_counts:
                MatchingGameConsumer.client_counts[self.room_group_name] -= 1

                # 만약 이제 방에 1명만 남았다면 -> 남은 사람이 승자
                if MatchingGameConsumer.client_counts[self.room_group_name] == 1:
                    # 누가 남았는지 판별 (내가 0이라면 1이 승자, 내가 1이라면 0이 승자)
                    winner_index = 1 - self.user_index  
                    state = MatchingGameConsumer.game_states[self.room_group_name]
                    if (state.game_state != 0):
                        return
                    await asyncio.sleep(0.1)
                    await self.send_game_result(winner_index)
                    await asyncio.sleep(0.1)
                    await self.close()
                
                # 아무도 안 남았다면 방을 완전히 정리
                elif MatchingGameConsumer.client_counts[self.room_group_name] <= 0:
                    if self.room_group_name in MatchingGameConsumer.game_tasks:
                        MatchingGameConsumer.game_tasks[self.room_group_name].cancel()
                        del MatchingGameConsumer.game_tasks[self.room_group_name]
                    if self.room_group_name in MatchingGameConsumer.game_states:
                        del MatchingGameConsumer.game_states[self.room_group_name]
                    if self.room_group_name in MatchingGameConsumer.client_counts:
                        del MatchingGameConsumer.client_counts[self.room_group_name]
            else:
                MatchingGameConsumer.client_counts[self.room_group_name] = 0


    async def send_initialize_game(self):
        state = MatchingGameConsumer.game_states[self.room_group_name]
        await self.send(
            text_data=json.dumps(
                {
                    "type": "initialize_game",
                    "left_bar_x": state.left_bar.x,
                    "left_bar_y": state.left_bar.y,
                    "right_bar_x": state.right_bar.x,
                    "right_bar_y": state.right_bar.y,
                    "screen_height": SCREEN_HEIGHT,
                    "screen_width": SCREEN_WIDTH,
                    "bar_height": Bar.HEIGHT,
                    "bar_width": Bar.WIDTH,
                    "bar_x_gap": Bar.X_GAP,
                    "left_ball_x": state.left_ball.x,
                    "left_ball_y": state.left_ball.y,
                    "right_ball_x": state.right_ball.x,
                    "right_ball_y": state.right_ball.y,
                    "ball_radius": Ball.RADIUS,
                    "map": state.map.map,
                    "player": state.player,
                    "max_score": MAX_SCORE,
                }
            )
        )

    async def game_loop(self):
        print("!!Game loop started for", self.room_group_name)
        try:
            count = 0
            while True:
                state = MatchingGameConsumer.game_states[self.room_group_name]
                state.left_bar.update()
                state.right_bar.update()

                state.penalty_time[0] = state.left_ball.move(state.left_bar)
                state.left_ball.check_bar_collision(state.left_bar)
                state.left_ball.check_bar_collision(state.right_bar)
                state.left_ball.check_collision(state.map, state.score)

                state.penalty_time[1] = state.right_ball.move(state.right_bar)
                state.right_ball.check_bar_collision(state.left_bar)
                state.right_ball.check_bar_collision(state.right_bar)
                state.right_ball.check_collision(state.map, state.score)

                if count % 5 == 0:
                    await self.send_game_state()
                    await asyncio.sleep(0.00390625)
                    await state.map.init()
                    if state.score[0] >= MAX_SCORE:
                        await asyncio.sleep(0.1)
                        await self.send_game_result(0)
                        await asyncio.sleep(0.1)
                        await self.close()
                        break
                    elif state.score[1] >= MAX_SCORE:
                        await asyncio.sleep(0.1)
                        await self.send_game_result(1)
                        await asyncio.sleep(0.1)
                        await self.close()
                        break
                else:
                    await asyncio.sleep(0.00390625)
                    # await asyncio.sleep(0.016)
                count += 1
        except asyncio.CancelledError:
            # Handle the game loop cancellation
            print("Game loop cancelled for", self.room_group_name)
            await self.close()

    async def send_game_result(self, winner):
        state = MatchingGameConsumer.game_states[self.room_group_name]
        state.game_state = 1

        print("Game result for", self.room_group_name, ":", state.score, "Winner:", winner)
        await self.save_game_result(state, winner)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "game_result_message",
                "score": state.score,
                "winner": winner,
            },
        )
    
    @sync_to_async
    def save_game_result(self, state, winner):
        try:
            user1_obj = User.objects.get(user_id=state.user[0])
        except User.DoesNotExist:
            user1_obj = None
        try:
            user2_obj = User.objects.get(user_id=state.user[1])
        except User.DoesNotExist:
            user2_obj = None

        score1, score2 = state.score
        if winner == 0:
            score1 = MAX_SCORE
        else:
            score2 = MAX_SCORE

        game = Game.objects.create(
            game_type="PvP",  
            user1=user1_obj,
            user2=user2_obj,
            score1=score1,
            score2=score2,
            start_timestamp=self.start_time,
            end_timestamp=timezone.now(),
        )

        if winner == 0:
            if user1_obj:
                user1_obj.win += 1
                user1_obj.save()
            if user2_obj:
                user2_obj.lose += 1
                user2_obj.save()
        else:
            if user2_obj:
                user2_obj.win += 1
                user2_obj.save()
            if user1_obj:
                user1_obj.lose += 1
                user1_obj.save()

    async def game_result_message(self, event):
        score = event["score"]
        winner = event["winner"]

        if not self.scope["client"]:
            return
        try:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "game_result",
                        "score": score,
                        "winner": winner,
                    }
                )
            )
        except Exception as e:
            print("Failed to send game_result_message:", e, "for", self.user_index)


    async def send_game_state(self):
        state = MatchingGameConsumer.game_states[self.room_group_name]
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "update_game_state_message",
                "left_bar_x": state.left_bar.x,
                "left_bar_y": state.left_bar.y,
                "right_bar_x": state.right_bar.x,
                "right_bar_y": state.right_bar.y,
                "left_ball_x": state.left_ball.x,
                "left_ball_y": state.left_ball.y,
                "right_ball_x": state.right_ball.x,
                "right_ball_y": state.right_ball.y,
                "map_diff": state.map.diff,
                "score": state.score,
                "penalty_time": state.penalty_time,
            },
        )

    async def update_game_state_message(self, event):
        left_bar_x = event["left_bar_x"]
        left_bar_y = event["left_bar_y"]
        right_bar_x = event["right_bar_x"]
        right_bar_y = event["right_bar_y"]
        left_ball_x = event["left_ball_x"]
        left_ball_y = event["left_ball_y"]
        right_ball_x = event["right_ball_x"]
        right_ball_y = event["right_ball_y"]
        score = event["score"]
        penalty_time = event["penalty_time"]
        # Send the updated game state to the WebSocket
        await self.send(
            text_data=json.dumps(
                {
                    "type": "update_game_state",
                    "left_bar_x": left_bar_x,
                    "left_bar_y": left_bar_y,
                    "right_bar_x": right_bar_x,
                    "right_bar_y": right_bar_y,
                    "left_ball_x": int(left_ball_x),
                    "left_ball_y": int(left_ball_y),
                    "right_ball_x": int(right_ball_x),
                    "right_ball_y": int(right_ball_y),
                    "map_diff": MatchingGameConsumer.game_states[
                        self.room_group_name
                    ].map.diff,
                    "score": score,
                    "penalty_time": penalty_time,
                }
            )
        )
