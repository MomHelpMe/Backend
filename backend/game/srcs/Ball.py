import numpy as np
from game.srcs.Bar import BarState

RADIAN60 = np.pi / 3
RADIAN20 = np.pi / 9
COLLISION_IGNORE_FRAMES = 5  # 충돌 무시 프레임 수
PENALTY_FRAMES = 500  # 페널티 프레임 수


class Ball:
    SPEED = [1.75, 2.75, 3.75]
    RADIUS = 14

    def __init__(self, id, screen_height, screen_width, bar):
        self.id = id
        self.screen_height = screen_height
        self.screen_width = screen_width
        self.initialize(bar)
        self.penalty_timer = 0
        self.life = 0;

    def initialize(self, bar):
        self.x = bar.x + bar.width / 2 + (150 if self.id == 0 else -150)
        self.y = bar.y + bar.height / 2 + (1 if self.id == 0 else -1)
        self.dx = -self.SPEED[0] if self.id == 0 else self.SPEED[0]
        self.dy = 0
        self.collision_timer = 0
        self.life = 0

    def move(self, bar):
        if self.penalty_timer > 0:
            self.penalty_timer -= 1
            if self.penalty_timer == 0:
                self.initialize(bar)
            return self.penalty_timer // 10

        self.x += self.dx
        self.y += self.dy
        if self.collision_timer > 0:
            self.collision_timer -= 1
        return self.penalty_timer // 10

    def check_bar_collision(self, bar):
        if self.collision_timer > 0 or self.penalty_timer > 0:
            return
        if bar.y < self.y + self.RADIUS and bar.y + bar.height > self.y:
            if bar.id == 0 and bar.x + bar.width < self.x - self.RADIUS:
                return
            if bar.id == 1 and bar.x > self.x + self.RADIUS:
                return
            speed = self.SPEED[0]
            if (bar.state == BarState.RELEASE):
                self.life = bar.get_ball_power()
                speed = self.SPEED[self.life]
                self.x = bar.min_x + (bar.width if bar.id == 0 else 0)
            # 바와의 충돌로 dx를 반전시키고, dy를 새로 계산
            relative_intersect_y = (bar.y + (bar.height // 2)) - self.y
            normalized_relative_intersect_y = relative_intersect_y / (
                bar.height // 2
            )
            bounce_angle = normalized_relative_intersect_y * RADIAN60
            if abs(bounce_angle) < RADIAN20:
                bounce_angle = RADIAN20 if bounce_angle >= 0 else -RADIAN20
            self.dx = speed * np.cos(bounce_angle)
            self.dy = speed * -np.sin(bounce_angle)
            # 방향을 반전시킴
            if self.x < bar.x + bar.width / 2:
                self.dx = -abs(self.dx)
            else:
                self.dx = abs(self.dx)
            self.collision_timer = COLLISION_IGNORE_FRAMES

    def check_collision(self, game_map, score):
        if self.penalty_timer > 0:
            return
        # 미래 위치 예측
        future_x = self.x + self.dx
        future_y = self.y + self.dy

        # 벽 충돌 검사
        if future_y - self.RADIUS <= 0 or future_y + self.RADIUS >= self.screen_height:
            self.dy *= -1
            future_y = self.y + self.dy
        elif future_x - self.RADIUS <= -self.RADIUS * 10:
            self.x = -self.RADIUS * 5
            self.penalty_timer = PENALTY_FRAMES
            if self.id == 1:
                score[1] += 20
            return
        elif future_x + self.RADIUS >= self.screen_width + self.RADIUS * 10:
            self.x = self.screen_width + self.RADIUS * 5
            self.penalty_timer = PENALTY_FRAMES
            if self.id == 0:
                score[0] += 20
            return

        # 맵과의 충돌 검사
        if self.collision_timer > 0:
            return

        pos = [
            (future_x - self.RADIUS, future_y - self.RADIUS),
            (future_x + self.RADIUS, future_y - self.RADIUS),
            (future_x - self.RADIUS, future_y + self.RADIUS),
            (future_x + self.RADIUS, future_y + self.RADIUS),
        ]

        for x, y in pos:
            grid_x = int(x / (self.screen_width / game_map.WIDTH))
            grid_y = int(y / (self.screen_height / game_map.HEIGHT))
            if (
                grid_x < 0
                or grid_x >= game_map.WIDTH
                or grid_y < 0
                or grid_y >= game_map.HEIGHT
            ):
                continue
            current_value = game_map.map[grid_y][grid_x]

            if (self.id == 0 and current_value == 1) or (
                self.id == 1 and current_value == 0
            ):
                block_top = grid_y * (self.screen_height // game_map.HEIGHT)
                block_bottom = (grid_y + 1) * (self.screen_height // game_map.HEIGHT)
                block_left = grid_x * (self.screen_width // game_map.WIDTH)
                block_right = (grid_x + 1) * (self.screen_width // game_map.WIDTH)

                # 충돌 최소 거리 계산
                dist_top = abs(y - block_top)
                dist_bottom = abs(y - block_bottom)
                dist_left = abs(x - block_left)
                dist_right = abs(x - block_right)
                min_dist = min(dist_top, dist_bottom, dist_left, dist_right)

                if self.life == 0:
                    # 충돌 처리
                    if min_dist == dist_top or min_dist == dist_bottom:
                        self.dy *= -1
                        future_y = self.y + self.dy
                    else:
                        self.dx *= -1
                        future_x = self.x + self.dx
                else:
                    self.life -= 1

                # 블록 상태 업데이트
                new_value = 1 if current_value == 0 else 0
                game_map.update(grid_x, grid_y, new_value)
                score[self.id] += 1

                # 충돌 타이머 설정
                self.collision_timer = COLLISION_IGNORE_FRAMES
                break

        # 미래 위치로 업데이트
        self.x = future_x
        self.y = future_y