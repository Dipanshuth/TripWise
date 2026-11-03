from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Destination, Place, Accommodation, Activity, TransportOption, Origin

def destinations_list(request):
    destinations = Destination.objects.select_related('pricing').all()
    
    # Optional search by name
    q = request.GET.get('q')
    if q:
        destinations = destinations.filter(name__icontains=q)
        
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
    return JsonResponse({'results': data})

def destination_detail(request, dest_id):
    d = get_object_or_404(Destination, id=dest_id)
    pricing = getattr(d, 'pricing', None)
    return JsonResponse({
        'id': d.id,
        'name': d.name,
        'slug': d.slug,
        'description': d.description,
        'image_url': d.image_url,
        'recommended_duration': d.recommended_duration,
        'best_season': d.best_season,
        'popular_for': d.popular_for.split(',') if d.popular_for else [],
        'daily_budget_min': float(pricing.daily_budget_min) if pricing and pricing.daily_budget_min else 0,
        'daily_budget_typical': float(pricing.daily_budget_typical) if pricing and pricing.daily_budget_typical else 0,
        'daily_budget_max': float(pricing.daily_budget_max) if pricing and pricing.daily_budget_max else 0,
        'pricing': {
            'food_min': float(pricing.food_min) if pricing else 0,
            'food_typical': float(pricing.food_typical) if pricing else 0,
            'food_max': float(pricing.food_max) if pricing else 0,
            'local_transport_min': float(pricing.local_transport_min) if pricing else 0,
            'local_transport_typical': float(pricing.local_transport_typical) if pricing else 0,
            'local_transport_max': float(pricing.local_transport_max) if pricing else 0,
            'minimum_daily_budget_per_person': float(pricing.minimum_daily_budget_per_person) if pricing else 0,
        } if pricing else None
    })

def destination_places(request, dest_id):
    d = get_object_or_404(Destination, id=dest_id)
    places = d.places.all()
    
    cat = request.GET.get('category')
    if cat:
        places = places.filter(category__iexact=cat)
        
    data = [{
        'id': p.id,
        'name': p.name,
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
        'image_url': p.image_url,
        'description': p.description,
        'distance': p.distance,
        'travel_time': p.travel_time,
        'recommendedTimeHours': p.visit_duration
    } for p in places]
    return JsonResponse({'results': data})

def destination_accommodations(request, dest_id):
    d = get_object_or_404(Destination, id=dest_id)
    accs = d.accommodations.all()
    
    htype = request.GET.get('hotel_type')
    if htype:
        accs = accs.filter(hotel_type=htype)
        
    data = [{
        'id': a.id,
        'name': a.name,
        'hotel_type': a.hotel_type,
        'price_per_night': str(a.price_per_night),
        'room_capacity': a.room_capacity,
        'image_url': a.image_url,
        'description': a.description,
        'rating': str(a.rating)
    } for a in accs]
    return JsonResponse({'results': data})

def destination_activities(request, dest_id):
    d = get_object_or_404(Destination, id=dest_id)
    acts = d.activities.all()
    data = [{
        'id': a.id,
        'name': a.name,
        'price_per_person': str(a.price_per_person),
        'duration': a.duration
    } for a in acts]
    return JsonResponse({'results': data})

def transport_list(request):
    transports = TransportOption.objects.all()
    
    origin = request.GET.get('origin')
    destination = request.GET.get('destination')
    mode = request.GET.get('mode')
    
    if origin:
        if origin.isdigit():
            transports = transports.filter(origin_id=origin)
        else:
            transports = transports.filter(
                Q(origin__name__iexact=origin) | Q(origin__slug__iexact=origin)
            )
    if destination:
        if destination.isdigit():
            transports = transports.filter(destination_id=destination)
        else:
            transports = transports.filter(
                Q(destination__name__iexact=destination) | Q(destination__slug__iexact=destination)
            )
    if mode:
        transports = transports.filter(mode__iexact=mode)
        
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
    return JsonResponse({'results': data})
