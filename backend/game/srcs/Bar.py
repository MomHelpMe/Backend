from enum import Enum


class Bar:
    X_GAP = 40
    HEIGHT = 200
    WIDTH = 20
    SPEED = 20
    PULL_SPEED = 1

    def __init__(
        self, id, x, y, max_x, width=WIDTH, height=HEIGHT, pull_speed=PULL_SPEED
    ):
        self.state = BarState.IDLE
        self.id = id
        self.min_x = x
        self.max_x = max_x
        self.max_power = abs(max_x - x)
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.pull_speed = pull_speed * (-1 if id == 0 else 1)
        self.power = 0

    def move_up(self, speed):
        self.y = max(0, self.y - speed)

    def move_down(self, speed, screen_height):
        self.y = min(screen_height - self.height, self.y + speed)

    def pull(self):
        if self.state == BarState.RELEASE:
            return
        self.state = BarState.PULLING
        if self.power < self.max_power:
            self.power = abs(self.x - self.min_x)
            self.x += ((-2 / (self.max_power * 2)) * self.power + 3) * self.pull_speed

    def set_release(self):
        if self.state != BarState.PULLING:
            return
        self.state = BarState.RELEASE

    def release(self):
        self.x += -self.pull_speed * (self.power + 0.1) * 0.25 
        if (self.id == 0 and self.x > self.min_x + 10) or (
            self.id == 1 and self.x < self.min_x - 10
        ):
            self.x = self.min_x
            self.power = 0
            self.state = BarState.IDLE

    def update(self):
        if self.state == BarState.RELEASE:
            self.release()

    def get_ball_power(self):
        if self.power < 15:
            return 0
        if self.power < 30:
            return 1
        return 2


class BarState(Enum):
    IDLE = 0
    PULLING = 1
    RELEASE = 2
