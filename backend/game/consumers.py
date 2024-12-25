import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from game.srcs.Ball import Ball
from game.srcs.Bar import Bar
from game.srcs.GameMap import GameMap
import jwt
from django.conf import settings
from channels.exceptions import DenyConnection

SCREEN_HEIGHT = 750
SCREEN_WIDTH = 1250
MAX_SCORE = 150


class GameState:
    def __init__(self):
        print("initializing game state!")
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
        self.player = ["player1", "player2"]
        self.penalty_time = [0, 0]


class GameConsumer(AsyncWebsocketConsumer):
    game_tasks = {}
    game_states = {}
    client_counts = {}

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"game_{self.room_name}"
        print(f"room_name: {self.room_name}")

        # Wait for authentication before joining room group
        self.authenticated = False

        await self.accept()

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json["action"]

        # print("text_data", text_data_json)
        if action == "authenticate":
            token = text_data_json.get("token")
            if not token or not self.authenticate(token):
                print("authentication failed")
                await self.close(code=4001)
                return
            self.authenticated = True

            # Join room group after successful authentication
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

            # Initialize game state for the room if it doesn't exist
            if self.room_group_name not in GameConsumer.game_states:
                print("new game!")
                GameConsumer.game_states[self.room_group_name] = GameState()
                GameConsumer.client_counts[self.room_group_name] = 0

            GameConsumer.client_counts[self.room_group_name] += 1

            # Send initialize game state to the client
            await self.send_initialize_game()

            # Start ball movement if not already running
            if self.room_group_name not in GameConsumer.game_tasks:
                GameConsumer.game_tasks[self.room_group_name] = asyncio.create_task(
                    self.game_loop()
                )
        elif not self.authenticated:
            await self.close(code=4001)
        else:
            bar = text_data_json.get("bar")
            state = GameConsumer.game_states[self.room_group_name]

            # Update the bar position based on the action
            if bar == "left":
                if action == "move_up":
                    state.left_bar.move_up(Bar.SPEED)
                elif action == "move_down":
                    state.left_bar.move_down(Bar.SPEED, SCREEN_HEIGHT)
                elif action == "pull":
                    state.left_bar.pull()
                elif action == "release":
                    state.left_bar.set_release()
            elif bar == "right":
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
            print(
                f"uid: {uid}",
                f"room_name: {self.room_name}",
                str(uid) == str(self.room_name),
            )
            # Check if uid matches the room_name
            if str(uid) == str(self.room_name):
                return True
            else:
                return False
        except jwt.ExpiredSignatureError:
            print("Token has expired")
            return False
        except jwt.InvalidTokenError:
            print("Invalid token")
            return False

    async def disconnect(self, close_code):
        # Leave room group
        if self.authenticated:
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )
            # Decrease the client count for this room
            if self.room_group_name in GameConsumer.client_counts:
                GameConsumer.client_counts[self.room_group_name] -= 1
                if GameConsumer.client_counts[self.room_group_name] <= 0:
                    GameConsumer.game_tasks[self.room_group_name].cancel()
                    del GameConsumer.game_tasks[self.room_group_name]
                    del GameConsumer.game_states[self.room_group_name]
                    del GameConsumer.client_counts[self.room_group_name]
            else:
                GameConsumer.client_counts[self.room_group_name] = 0

    async def send_initialize_game(self):
        state = GameConsumer.game_states[self.room_group_name]
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
        try:
            count = 0
            while True:
                state = GameConsumer.game_states[self.room_group_name]
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
                count += 1
        except asyncio.CancelledError:
            # Handle the game loop cancellation
            print("Game loop cancelled for", self.room_group_name)
            await self.close()

    async def send_game_result(self, winner):
        state = GameConsumer.game_states[self.room_group_name]
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "game_result_message",
                "score": state.score,
                "winner": winner,
            },
        )

    async def game_result_message(self, event):
        score = event["score"]
        winner = event["winner"]

        # Send the game result to the WebSocket
        await self.send(
            text_data=json.dumps(
                {
                    "type": "game_result",
                    "score": score,
                    "winner": winner,
                }
            )
        )

    async def send_game_state(self):
        state = GameConsumer.game_states[self.room_group_name]
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
                    "map_diff": GameConsumer.game_states[self.room_group_name].map.diff,
                    "score": score,
                    "penalty_time": penalty_time,
                }
            )
        )
