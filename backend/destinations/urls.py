from django.urls import path
from . import views
from . import search_views

urlpatterns = [
    path('destinations/', views.destinations_list, name='destinations-list'),
    path('destinations/<int:dest_id>/', views.destination_detail, name='destination-detail'),
    path('destinations/<int:dest_id>/places/', views.destination_places, name='destination-places'),
    path('destinations/<int:dest_id>/accommodations/', views.destination_accommodations, name='destination-accommodations'),
    path('destinations/<int:dest_id>/activities/', views.destination_activities, name='destination-activities'),
    path('transport/', views.transport_list, name='transport-list'),
    
    # Search Endpoints
    path('search/destinations/', search_views.search_destinations, name='search-destinations'),
    path('search/places/', search_views.search_places, name='search-places'),
    path('search/accommodations/', search_views.search_accommodations, name='search-accommodations'),
    path('search/transport/', search_views.search_transport, name='search-transport'),
]
