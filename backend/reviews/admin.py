from django.contrib import admin
from .models import UserProfile, Review

admin.site.register(UserProfile)
admin.site.register(Review)