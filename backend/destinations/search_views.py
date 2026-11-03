from django.http import JsonResponse
from django.db.models import Q
from .models import Destination, Place, Accommodation, TransportOption

def search_destinations(request):
    q = request.GET.get('q', '').strip()
    destinations = Destination.objects.all()
    if q:
        destinations = destinations.filter(
            Q(name__icontains=q) | 
            Q(slug__icontains=q) | 
            Q(description__icontains=q)
        )
    destinations = destinations.select_related('pricing')[:10]  # Limit to 10
    
    data = []
    for d in destinations:
        pricing = getattr(d, 'pricing', None)
        data.append({
            'id': d.id,
            'name': d.name,
            'slug': d.slug,
            'description': d.description,
            'image_url': d.image_url,
            'recommended_duration': d.recommended_duration,
            'best_season': d.best_season,
            'popular_for': d.popular_for.split(',') if d.popular_for else [],
            'daily_budget_typical': float(pricing.daily_budget_typical) if pricing and pricing.daily_budget_typical else 0,
        })
    
    return JsonResponse({'query': q, 'results': data})

def search_places(request):
    q = request.GET.get('q', '').strip()
    destination_id = request.GET.get('destination')
    
    places = Place.objects.select_related('destination').all()
    if destination_id:
        places = places.filter(destination_id=destination_id)
        
    if q:
        places = places.filter(
            Q(name__icontains=q) | 
            Q(category__icontains=q) | 
            Q(description__icontains=q)
        )
    places = places[:10]
    
    data = [{
        'id': p.id,
        'name': p.name,
        'destination': p.destination.name,
        'destination_id': p.destination.id,
        'destination_slug': p.destination.slug,
        'category': p.category,
        'rating': str(p.rating),
        'entry_fee': str(p.entry_fee),
        'entry_fee_raw': p.entry_fee_raw,
        'entry_fee_type': p.entry_fee_type,
        'ticket_group': p.ticket_group,
        'local_transport_mode': p.local_transport_mode,
        'local_transport_cost': str(p.local_transport_cost),
        'local_transport_type': p.local_transport_type,
        'transport_estimate_raw': p.transport_estimate_raw,
        'typical_transport_budget_pp_raw': p.typical_transport_budget_pp_raw,
        'distance': p.distance,
        'travel_time': p.travel_time,
    } for p in places]
    
    return JsonResponse({'query': q, 'results': data})

def search_accommodations(request):
    q = request.GET.get('q', '').strip()
    destination_id = request.GET.get('destination')
    hotel_type = request.GET.get('hotel_type')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    
    accs = Accommodation.objects.all()
    
    if destination_id:
        accs = accs.filter(destination_id=destination_id)
    if hotel_type:
        accs = accs.filter(hotel_type__iexact=hotel_type)
    if min_price:
        accs = accs.filter(price_per_night__gte=min_price)
    if max_price:
        accs = accs.filter(price_per_night__lte=max_price)
    if q:
        accs = accs.filter(
            Q(name__icontains=q) |
            Q(description__icontains=q)
        )
        
    accs = accs[:10]
    
    accs = accs.select_related('destination')
    
    data = [{
        'id': a.id,
        'name': a.name,
        'destination': a.destination.name,
        'destination_id': a.destination.id,
        'destination_slug': a.destination.slug,
        'hotel_type': a.hotel_type,
        'price_per_night': str(a.price_per_night),
        'room_capacity': a.room_capacity,
    } for a in accs]
    
    return JsonResponse({'query': q, 'results': data})

def search_transport(request):
    q = request.GET.get('q', '').strip()
    origin = request.GET.get('origin')
    destination = request.GET.get('destination')
    mode = request.GET.get('mode')
    pricing_type = request.GET.get('pricing_type')
    
    transports = TransportOption.objects.select_related('origin', 'destination').all()
    
    if origin:
        if origin.isdigit():
            transports = transports.filter(origin_id=origin)
        else:
            transports = transports.filter(origin__name__iexact=origin)
    if destination:
        if destination.isdigit():
            transports = transports.filter(destination_id=destination)
        else:
            transports = transports.filter(destination__name__iexact=destination)
    if mode:
        transports = transports.filter(mode__iexact=mode)
    if pricing_type:
        transports = transports.filter(pricing_type__iexact=pricing_type)
        
    transports = transports[:10]
        
    data = [{
        'id': t.id,
        'origin': t.origin.name,
        'destination': t.destination.name,
        'mode': t.mode,
        'min_price': str(t.min_price),
        'typical_price': str(t.typical_price),
        'max_price': str(t.max_price),
        'pricing_type': t.pricing_type,
        'distance_km': t.distance_km,
        'duration': t.duration,
        'duration_min': t.duration_min,
        'duration_typical': t.duration_typical,
        'duration_max': t.duration_max,
        'source': t.source,
        'last_verified': t.last_verified.isoformat() if t.last_verified else None,
    } for t in transports]
    
    return JsonResponse({'query': q, 'results': data})
