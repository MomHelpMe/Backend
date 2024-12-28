from django.urls import re_path

from . import consumers
from . import onlineConsumers
from . import matchingConsumers

websocket_urlpatterns = [
    re_path(r"ws/game/(?P<room_name>\w+)/$", consumers.GameConsumer.as_asgi()),
    re_path(r"ws/game/vs/(?P<room_name>\w+)/$", matchingConsumers.MatchingGameConsumer.as_asgi()),
    re_path(r"ws/online", onlineConsumers.OnlineConsumer.as_asgi()),
]
