from django.contrib import admin
from .models import Trip, TripPlace

class TripPlaceInline(admin.TabularInline):
    model = TripPlace
    extra = 1

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'source', 'destination', 'days', 'status')
    inlines = [TripPlaceInline]
