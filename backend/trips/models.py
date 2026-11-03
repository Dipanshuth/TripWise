from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class Trip(models.Model):
    TRAVEL_STYLE_CHOICES = [
        ('budget', 'Budget'),
        ('balanced', 'Balanced'),
        ('comfort', 'Comfort'),
        ('premium', 'Premium'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('saved', 'Saved'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='trips'
    )
    source = models.ForeignKey('destinations.Origin', on_delete=models.PROTECT, related_name='trips_from')
    destination = models.ForeignKey('destinations.Destination', on_delete=models.PROTECT, related_name='trips_to')
    days = models.PositiveIntegerField(default=1)
    travellers = models.PositiveIntegerField(default=1)
    travel_style = models.CharField(max_length=20, choices=TRAVEL_STYLE_CHOICES, default='balanced')
    selected_transport = models.ForeignKey(
        'destinations.TransportOption',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    selected_accommodation = models.ForeignKey(
        'destinations.Accommodation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    discount = models.ForeignKey('expenses.Discount', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()
        if self.days < 1:
            raise ValidationError("A trip must be at least 1 day.")
        if self.travellers < 1:
            raise ValidationError("A trip must have at least 1 traveller.")
        
        # Verify related fields belong to the same destination
        if self.selected_accommodation and self.selected_accommodation.destination != self.destination:
            raise ValidationError("Accommodation must belong to the trip's destination.")
        
        if self.selected_transport:
            if self.selected_transport.destination != self.destination or self.selected_transport.origin != self.source:
                raise ValidationError("Transport option must match the trip's origin and destination.")

    def __str__(self):
        return f"Trip to {self.destination.name}"

class TripPlace(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='trip_places')
    place = models.ForeignKey('destinations.Place', on_delete=models.CASCADE)
    visit_order = models.PositiveIntegerField(default=0)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('trip', 'place')
        ordering = ['visit_order', 'added_at']

    def clean(self):
        super().clean()
        if self.place.destination != self.trip.destination:
            raise ValidationError("Place must belong to the trip's destination.")

    def __str__(self):
        return f"{self.place.name} in {self.trip}"

class ItineraryDay(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='itinerary_days')
    day_number = models.PositiveIntegerField()
    title = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ['day_number']
        unique_together = ('trip', 'day_number')

    def __str__(self):
        return f"Day {self.day_number} of {self.trip}"

class ItineraryItem(models.Model):
    itinerary_day = models.ForeignKey(ItineraryDay, on_delete=models.CASCADE, related_name='items')
    place = models.ForeignKey('destinations.Place', on_delete=models.SET_NULL, null=True, blank=True)
    activity = models.ForeignKey('destinations.Activity', on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=200)
    notes = models.TextField(blank=True)
    start_time = models.TimeField(null=True, blank=True)
    duration = models.CharField(max_length=50, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'start_time']

    def __str__(self):
        return f"{self.title} on {self.itinerary_day}"
