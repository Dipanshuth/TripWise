from django.db import models

class Destination(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    image_url = models.URLField(max_length=500)
    
    # Overview / At-a-glance fields
    recommended_duration = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. '4 days'")
    best_season = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. 'March to June'")
    popular_for = models.CharField(max_length=255, blank=True, null=True, help_text="Comma-separated tags e.g. 'Mountains,Nature,Adventure'")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class DestinationPricing(models.Model):
    destination = models.OneToOneField(Destination, on_delete=models.CASCADE, related_name='pricing')
    
    # Food ranges
    food_min = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    food_typical = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    food_max = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    food_pricing_type = models.CharField(max_length=50, default='per_person_per_day')
    food_source = models.CharField(max_length=255, blank=True, null=True)
    food_last_verified = models.DateTimeField(auto_now=True)
    
    # Local Transport ranges
    local_transport_min = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    local_transport_typical = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    local_transport_max = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    local_transport_pricing_type = models.CharField(max_length=50, default='per_person_per_day')
    local_transport_source = models.CharField(max_length=255, blank=True, null=True)
    local_transport_last_verified = models.DateTimeField(auto_now=True)
    
    minimum_daily_budget_per_person = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Destination Explore Overview Budgets (Informational)
    daily_budget_min = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    daily_budget_typical = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    daily_budget_max = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    daily_budget_source = models.CharField(max_length=255, blank=True, null=True)
    daily_budget_last_verified = models.DateTimeField(auto_now=True)
    
    notes = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.destination.name} Pricing"

class Origin(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Place(models.Model):
    PRICING_CHOICES = [
        ('per_person', 'Per Person'),
        ('per_vehicle', 'Per Vehicle'),
        ('fixed', 'Fixed'),
        ('per_trip', 'Per Trip'),
    ]

    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name='places')
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    distance = models.CharField(max_length=100, blank=True)
    travel_time = models.CharField(max_length=100, blank=True)
    visit_duration = models.IntegerField(help_text="Estimated duration in hours", default=2)
    
    # Entry fee fields
    entry_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    entry_fee_raw = models.CharField(max_length=200, blank=True)
    entry_fee_type = models.CharField(max_length=20, choices=PRICING_CHOICES, default='per_person')
    entry_fee_notes = models.TextField(blank=True)
    ticket_group = models.CharField(max_length=100, blank=True, null=True, help_text="Shared ticket identifier")
    
    # Local transport fields
    local_transport_mode = models.CharField(max_length=200, blank=True)
    local_transport_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    transport_estimate_raw = models.CharField(max_length=200, blank=True)
    typical_transport_budget_pp_raw = models.CharField(max_length=200, blank=True)
    local_transport_type = models.CharField(max_length=20, choices=PRICING_CHOICES, default='per_person')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Accommodation(models.Model):
    HOTEL_TYPE_CHOICES = [
        ('budget', 'Budget'),
        ('3_star', '3 Star'),
        ('4_star', '4 Star'),
        ('luxury', 'Luxury'),
    ]

    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name='accommodations')
    name = models.CharField(max_length=200)
    hotel_type = models.CharField(max_length=20, choices=HOTEL_TYPE_CHOICES)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    room_capacity = models.IntegerField(default=2)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    description = models.TextField(blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['price_per_night']

    def __str__(self):
        return f"{self.name} ({self.get_hotel_type_display()})"

class Activity(models.Model):
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name='activities')
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price_per_person = models.DecimalField(max_digits=10, decimal_places=2)
    duration = models.CharField(max_length=50, help_text="E.g., 2 hours")
    image_url = models.URLField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Activities'
        ordering = ['name']

    def __str__(self):
        return self.name

class TransportOption(models.Model):
    TRANSPORT_CHOICES = [
        ('bus', 'Bus'),
        ('train', 'Train'),
        ('flight', 'Flight'),
        ('cab', 'Cab'),
    ]
    PRICING_CHOICES = [
        ('per_person', 'Per Person'),
        ('per_vehicle', 'Per Vehicle'),
        ('fixed', 'Fixed'),
    ]

    origin = models.ForeignKey(Origin, on_delete=models.CASCADE, related_name='transport_options_origin')
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name='transport_options_dest')
    mode = models.CharField(max_length=20, choices=TRANSPORT_CHOICES, default='bus')
    
    min_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    typical_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pricing_type = models.CharField(max_length=20, choices=PRICING_CHOICES, default='per_person')
    
    distance_km = models.CharField(max_length=50, blank=True, null=True)
    duration = models.CharField(max_length=100, blank=True, null=True)
    duration_min = models.IntegerField(blank=True, null=True, help_text="Duration in minutes (min)")
    duration_typical = models.IntegerField(blank=True, null=True, help_text="Duration in minutes (typical)")
    duration_max = models.IntegerField(blank=True, null=True, help_text="Duration in minutes (max)")
    
    source = models.CharField(max_length=100, blank=True, null=True)
    last_verified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.origin} to {self.destination} by {self.get_mode_display()}"
