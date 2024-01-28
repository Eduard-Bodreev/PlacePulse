from django.db import models
from django.core.validators import (
    MaxValueValidator, MinValueValidator
)
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()


class Review(models.Model):
    text = models.TextField(
        verbose_name='Текст отзыва',
        max_length=400,
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Автор'
    )
    score = models.IntegerField(
        verbose_name='Оценка места',
        validators=[MinValueValidator(1, message='Минимальная оценка - 1'),
                    MaxValueValidator(5, message='Максимальня оценка - 5')]
    )
    pub_date = models.DateTimeField(
        verbose_name='Дата добавления отзыва',
        auto_now_add=True
    )
    is_public = models.BooleanField(
        verbose_name='Публичный ли отзыв',
        default=False
    )
    image = models.ImageField(
        upload_to='reviews/images/',
        null=True,
        default=None
        )
    latitude = models.FloatField(verbose_name='Широта')
    longitude = models.FloatField(verbose_name='Долгота')

    class Meta:
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'

    def __str__(self):
        return self.text


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField("О себе", max_length=500, blank=True)
    friends = models.TextField("Друзья", blank=True, default="")
    outgoing_requests = models.TextField("Исходящие запросы", blank=True, default="")
    incoming_requests = models.TextField("Входящие запросы", blank=True, default="")
    is_visible_for_other_users = models.BooleanField("Видимость для других пользователей", default=False)


    def __str__(self):
        return self.user.username
