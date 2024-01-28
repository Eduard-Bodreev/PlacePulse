from .serializers import ReviewSerializer, UserProfileSerializer, UserRegistrationSerializer
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Review, UserProfile
from rest_framework.exceptions import status
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

User = get_user_model()


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Review.objects.all()

    def get_serializer_context(self):
        context = super(ReviewViewSet, self).get_serializer_context()
        context.update({"request": self.request})
        return context

    @action(detail=False, methods=['get'])
    def user_reviews(self, request):
        queryset = self.get_queryset().filter(author=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def update(self, request, pk=None):
        review = self.get_object()
        serializer = self.get_serializer(review, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def friends_reviews(self, request):
        user_profile = request.user.profile
        friends_ids = [int(friend_id) for friend_id in user_profile.friends.split(',') if friend_id]
        queryset = Review.objects.filter(author_id__in=friends_ids)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def get_current_user(self, request):
        user = request.user
        # Проверяем, существует ли профиль, и создаем его, если нужно
        profile, created = UserProfile.objects.get_or_create(user=user)

        if request.method == 'GET':
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    @action(detail=False, methods=['post'], url_path='register', permission_classes=[permissions.AllowAny])
    def register_user(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User successfully registered"}, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_path='send-friend-request')
    def send_friend_request(self, request):
        friend_id = request.data.get('friend_id')
        if not friend_id:
            return Response({'error': 'Friend ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            friend_profile = UserProfile.objects.get(user_id=friend_id, is_visible_for_other_users=True)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User does not exist or is not visible for other users'}, status=status.HTTP_404_NOT_FOUND)

        user_profile, _ = UserProfile.objects.get_or_create(user=request.user)

        # Проверяем, если пользователь уже отправил запрос в прошлом
        if str(friend_id) in user_profile.outgoing_requests.split(','):
            # Проверяем, если пользователь уже получил запрос от этого друга
            if str(request.user.id) in friend_profile.incoming_requests.split(','):
                # Удаляем user_id из входящих и исходящих запросов
                user_profile.outgoing_requests = ','.join(filter(lambda x: x != str(friend_id), user_profile.outgoing_requests.split(',')))
                friend_profile.incoming_requests = ','.join(filter(lambda x: x != str(request.user.id), friend_profile.incoming_requests.split(',')))
                
                # Добавляем в друзья обоих пользователей
                user_profile.friends = f"{user_profile.friends},{friend_id}" if user_profile.friends else str(friend_id)
                friend_profile.friends = f"{friend_profile.friends},{request.user.id}" if friend_profile.friends else str(request.user.id)
                
                user_profile.save()
                friend_profile.save()
                
                return Response({'message': 'Friend request accepted successfully, you are now friends'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Friend request already sent'}, status=status.HTTP_400_BAD_REQUEST)

        user_profile.outgoing_requests += f"{friend_id}," if user_profile.outgoing_requests else f"{friend_id}"
        user_profile.save()

        friend_profile.incoming_requests += f"{request.user.id}," if friend_profile.incoming_requests else f"{request.user.id}"
        friend_profile.save()

        return Response({'message': 'Friend request sent successfully'}, status=status.HTTP_200_OK)

    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_path='cancel-friend-request')
    def cancel_friend_request(self, request):
        friend_id = request.data.get('friend_id')
        if not friend_id:
            return Response({'error': 'Friend ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        friend_id_str = str(friend_id)

        try:
            friend_profile = UserProfile.objects.get(id=friend_id)
            user_profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

        # Удаление из исходящих запросов текущего пользователя
        outgoing_requests = user_profile.outgoing_requests.split(',')
        if friend_id_str in outgoing_requests:
            outgoing_requests.remove(friend_id_str)
            user_profile.outgoing_requests = ','.join(outgoing_requests)
            user_profile.save()
        else:
            return Response({'error': 'Friend request not found in outgoing requests'}, status=status.HTTP_404_NOT_FOUND)

        # Удаление из входящих запросов целевого пользователя
        incoming_requests = friend_profile.incoming_requests.split(',')
        user_id_str = str(request.user.id)
        if user_id_str in incoming_requests:
            incoming_requests.remove(user_id_str)
            friend_profile.incoming_requests = ','.join(incoming_requests)
            friend_profile.save()

        return Response({'message': 'Friend request cancelled successfully'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_path='remove-friend')
    def remove_friend(self, request):
        friend_id = request.data.get('friend_id')
        if not friend_id:
            return Response({'error': 'Friend ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            friend_profile = UserProfile.objects.get(user_id=friend_id)
            user_profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        friend_id_str = str(friend_id)
        user_id_str = str(request.user.id)
        
        # Удаляем user_id из friends текущего пользователя
        friends = user_profile.friends.split(',')
        if friend_id_str in friends:
            friends.remove(friend_id_str)
            user_profile.friends = ','.join(friends)
            user_profile.save()
        else:
            return Response({'error': 'Friend not found in your friends list'}, status=status.HTTP_404_NOT_FOUND)
        
        # Удаляем user_id текущего пользователя из friends другого пользователя
        friend_friends = friend_profile.friends.split(',')
        if user_id_str in friend_friends:
            friend_friends.remove(user_id_str)
            friend_profile.friends = ','.join(friend_friends)
            friend_profile.save()
        
        return Response({'message': 'Friend removed successfully'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_path='accept-friend-request')
    def accept_friend_request(self, request):
        friend_id = request.data.get('friend_id')
        if not friend_id:
            return Response({'error': 'Friend ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        user_profile, _ = UserProfile.objects.get_or_create(user=request.user)
        try:
            friend_profile = UserProfile.objects.get(user_id=friend_id)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Friend profile not found'}, status=status.HTTP_404_NOT_FOUND)

        # Проверяем, есть ли friend_id в incoming_requests текущего пользователя
        if str(friend_id) in user_profile.incoming_requests.split(','):
            # Проверяем, есть ли user_id в outgoing_requests профиля друга
            if str(request.user.id) in friend_profile.outgoing_requests.split(','):
                # Удаляем friend_id из incoming_requests текущего пользователя
                user_profile.incoming_requests = ','.join(filter(lambda x: x != str(friend_id), user_profile.incoming_requests.split(',')))
                user_profile.save()

                # Удаляем user_id из outgoing_requests профиля друга
                friend_profile.outgoing_requests = ','.join(filter(lambda x: x != str(request.user.id), friend_profile.outgoing_requests.split(',')))
                friend_profile.save()

                # Добавляем друга в список друзей обоих пользователей
                user_profile.friends = f"{user_profile.friends},{friend_id}" if user_profile.friends else str(friend_id)
                friend_profile.friends = f"{friend_profile.friends},{request.user.id}" if friend_profile.friends else str(request.user.id)
                user_profile.save()
                friend_profile.save()

                return Response({'message': 'Friend request accepted. You are now friends.'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Friend request not found in outgoing requests of the friend'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error': 'Friend request not found in your incoming requests'}, status=status.HTTP_400_BAD_REQUEST)


class PublicUserProfilesView(APIView):
    def get(self, request, format=None):
        # Фильтрация UserProfile по is_visible_for_other_users
        public_profiles = UserProfile.objects.filter(is_visible_for_other_users=True)
        serializer = UserProfileSerializer(public_profiles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)