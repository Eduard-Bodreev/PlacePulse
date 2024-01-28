from rest_framework import routers

from django.contrib import admin
from django.urls import include, path

from django.conf import settings
from django.conf.urls.static import static
from reviews.views import ReviewViewSet, UserViewSet, PublicUserProfilesView


router = routers.DefaultRouter()
router.register(r'reviews',
                ReviewViewSet, basename='reviews')
router.register(r'users', UserViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/', include('djoser.urls')),
    path('api/', include('djoser.urls.authtoken')),
    path('api/public-profiles/', PublicUserProfilesView.as_view(), name='public-profiles'),
    path('api/send-friend-request/', UserViewSet.as_view({'post': 'send_friend_request'}), name='send-friend-request'),
    path('api/cancel-friend-request/', UserViewSet.as_view({'post': 'cancel_friend_request'}), name='cancel-friend-request'),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL, document_root=settings.MEDIA_ROOT
    )
