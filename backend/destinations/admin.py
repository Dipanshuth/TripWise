from django.contrib import admin
from .models import Destination, Origin, Place, Accommodation, TransportOption, Activity, DestinationPricing

admin.site.register(Destination)
admin.site.register(Origin)
admin.site.register(Place)
admin.site.register(Accommodation)
admin.site.register(TransportOption)
admin.site.register(Activity)
admin.site.register(DestinationPricing)
