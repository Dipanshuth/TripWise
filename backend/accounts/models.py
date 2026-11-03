from django.db import models
from django.conf import settings

class Profile(models.Model):
    BUDGET_STYLE_CHOICES = [
        ('budget', 'Budget'),
        ('balanced', 'Balanced'),
        ('comfort', 'Comfort'),
        ('premium', 'Premium'),
    ]

    TRIP_LENGTH_CHOICES = [
        (3, 'Short (Weekend)'),
        (7, 'Medium (1 week)'),
        (14, 'Long (2 weeks)'),
        (30, 'Extended (1 month+)'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    profile_image_url = models.URLField(max_length=500, blank=True)
    budget_style = models.CharField(max_length=20, choices=BUDGET_STYLE_CHOICES, default='balanced')
    preferred_trip_length = models.IntegerField(choices=TRIP_LENGTH_CHOICES, default=7)
    favourite_destination = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
