from django.db import models


class User(models.Model):
    LANGUAGE_CHOICES = [
        (0, "EN"),
        (1, "KR"),
        (2, "JP"),
    ]

    user_id = models.IntegerField(primary_key=True)
    nickname = models.CharField(max_length=12)
    email = models.EmailField(max_length=255 )
    img_url = models.URLField(blank=True)
    is_2FA = models.BooleanField(default=False)
    is_online = models.BooleanField(default=False)
    win = models.IntegerField(default=0)
    lose = models.IntegerField(default=0)
    language = models.IntegerField(choices=LANGUAGE_CHOICES, default=0)

    def __str__(self):
        return self.nickname + "#" + str(self.user_id)


class Friend(models.Model):
    friend_id = models.AutoField(primary_key=True)
    adder = models.ForeignKey(User, on_delete=models.CASCADE, related_name="friend_added")
    friend_user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.adder.nickname} - {self.friend_user.nickname}"

class Game(models.Model):
    game_id = models.AutoField(primary_key=True)
    game_type = models.CharField(max_length=255)
    user1 = models.ForeignKey(User, null=True, on_delete=models.CASCADE, related_name="games_as_user1")
    user2 = models.ForeignKey(User, null=True, on_delete=models.CASCADE, related_name="games_as_user2")
    score1 = models.IntegerField()
    score2 = models.IntegerField()
    start_timestamp = models.DateTimeField()
    end_timestamp = models.DateTimeField()

    def __str__(self):
        user1_name = self.user1.nickname if self.user1 else "Unknown"
        user2_name = self.user2.nickname if self.user2 else "Unknown"
        return f"Game {self.game_id}: {user1_name} vs {user2_name}"


class Tournament(models.Model):
    tournament_id = models.AutoField(primary_key=True)
    game_id1 = models.ForeignKey(Game, null=True, on_delete=models.CASCADE, related_name="tournaments_as_game1")
    game_id2 = models.ForeignKey(Game, null=True, on_delete=models.CASCADE, related_name="tournaments_as_game2")
    game_id3 = models.ForeignKey(Game, null=True, on_delete=models.CASCADE, related_name="tournaments_as_game3")
    start_timestamp = models.DateTimeField()
    end_timestamp = models.DateTimeField()

    def __str__(self):
        return f"Tournament {self.tournament_id}: {self.game_id1.game_type} - {self.game_id2.game_type} - {self.game_id3.game_type}"
