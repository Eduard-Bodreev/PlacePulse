import base64

from django.core.files.base import ContentFile
from rest_framework import serializers
from reviews.models import Review, UserProfile
from django.contrib.auth import get_user_model


User = get_user_model()


class Base64ImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if isinstance(data, str) and data.startswith('data:image'):
            format, imgstr = data.split(';base64,')
            ext = format.split('/')[-1]

            data = ContentFile(base64.b64decode(imgstr), name='temp.' + ext)

        return super().to_internal_value(data)


class ReviewSerializer(serializers.ModelSerializer):
    author = serializers.SlugRelatedField(
        slug_field='username', read_only=True,
    )
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()

    class Meta:
        model = Review
        fields = ('__all__')
        read_only_fields = ('author',)

    def __init__(self, *args, **kwargs):
        super(ReviewSerializer, self).__init__(*args, **kwargs)

        # Если это обновление, делаем latitude и longitude необязательными
        if self.instance is not None:
            self.fields['latitude'].required = False
            self.fields['longitude'].required = False

    def create(self, validated_data):
        # Установка текущего пользователя как автора отзыва
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Обновление только тех полей, которые предоставлены в запросе
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'password',)  
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        # Создаем пользователя с зашифрованным паролем
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
        UserProfile.objects.create(user=user)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', required=False, allow_blank=True)
    bio = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = UserProfile
        fields = ('user_id', 'username', 'email', 'bio', 'friends', 'outgoing_requests', 'incoming_requests', 'is_visible_for_other_users')

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})

        email = user_data.get('email')
        if 'email' in user_data:
            instance.user.email = email if email is not None else instance.user.email
            instance.user.save()

        # Обновляем bio, если оно предоставлено
        bio = validated_data.get('bio')
        if bio is not None:
            instance.bio = bio
            instance.save()

        is_visible_for_other_users = validated_data.get('is_visible_for_other_users')
        if is_visible_for_other_users is not None:
            instance.is_visible_for_other_users = is_visible_for_other_users
            instance.save()

        return instance
