import json
from django.http import JsonResponse, HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from .models import Trip, TripPlace
from destinations.models import Destination, Origin, TransportOption, Accommodation, Place
from .services.cost_calculator import CostCalculator

def trip_to_dict(trip):
    return {
        'id': trip.id,
        'source_id': trip.source.id if trip.source else None,
        'source_name': trip.source.name if trip.source else '',
        'destination_id': trip.destination.id if trip.destination else None,
        'destination_name': trip.destination.name if trip.destination else '',
        'days': trip.days,
        'travellers': trip.travellers,
        'travel_style': trip.travel_style,
        'status': trip.status,
        'selected_transport_id': trip.selected_transport.id if trip.selected_transport else None,
        'selected_accommodation_id': trip.selected_accommodation.id if trip.selected_accommodation else None,
        'discount_code': trip.discount.code if trip.discount else None,
    }

@login_required
@require_http_methods(["GET", "POST"])
def trip_list(request):
    if request.method == 'GET':
        trips = Trip.objects.filter(user=request.user)
        # Basic filtering
        dest = request.GET.get('destination')
        if dest:
            trips = trips.filter(destination__name__iexact=dest)
        style = request.GET.get('travel_style')
        if style:
            trips = trips.filter(travel_style=style)
            
        data = [trip_to_dict(t) for t in trips]
        return JsonResponse({'results': data})
        
    elif request.method == 'POST':
        try:
            body = json.loads(request.body)
            
            # Handle Origin
            if 'source_id' in body:
                origin = get_object_or_404(Origin, id=body['source_id'])
            elif 'source_name' in body:
                origin = get_object_or_404(Origin, name__iexact=body['source_name'])
            else:
                return JsonResponse({'error': 'source_id or source_name required'}, status=400)
                
            dest = get_object_or_404(Destination, id=body['destination_id'])
            
            trip = Trip(
                user=request.user,
                source=origin,
                destination=dest,
                days=int(body.get('days', 1)),
                travellers=int(body.get('travellers', 1)),
                travel_style=body.get('travel_style', 'balanced')
            )
            trip.full_clean()
            trip.save()
            return JsonResponse(trip_to_dict(trip), status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@login_required
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def trip_detail(request, trip_id):
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    
    if request.method == 'GET':
        return JsonResponse(trip_to_dict(trip))
        
    elif request.method in ['PUT', 'PATCH']:
        try:
            body = json.loads(request.body)
            if 'days' in body:
                trip.days = int(body['days'])
            if 'travellers' in body:
                trip.travellers = int(body['travellers'])
            if 'travel_style' in body:
                trip.travel_style = body['travel_style']
            if 'status' in body:
                trip.status = body['status']
            if 'selected_transport_id' in body:
                if body['selected_transport_id']:
                    trip.selected_transport = get_object_or_404(TransportOption, id=body['selected_transport_id'])
                else:
                    trip.selected_transport = None
            if 'selected_accommodation_id' in body:
                if body['selected_accommodation_id']:
                    trip.selected_accommodation = get_object_or_404(Accommodation, id=body['selected_accommodation_id'])
                else:
                    trip.selected_accommodation = None
            if 'discount_code' in body:
                if body['discount_code']:
                    from expenses.models import Discount
                    discount = Discount.objects.filter(code__iexact=body['discount_code'], active=True).first()
                    trip.discount = discount
                else:
                    trip.discount = None
                    
            trip.full_clean()
            trip.save()
            return JsonResponse(trip_to_dict(trip))
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    elif request.method == 'DELETE':
        trip.delete()
        return JsonResponse({'message': 'Trip deleted successfully'}, status=204)

@login_required
@require_http_methods(["POST"])
def calculate_trip(request, trip_id):
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    user_budget = None
    try:
        if request.body:
            body = json.loads(request.body)
            if 'budget' in body:
                user_budget = body['budget']
    except json.JSONDecodeError:
        pass
        
    calculator = CostCalculator(trip, user_budget=user_budget)
    breakdown = calculator.get_full_breakdown()
    
    # Convert Decimals to float or string for JSON serialization
    for k, v in breakdown.items():
        if hasattr(v, 'quantize'): # is decimal
            breakdown[k] = float(v)
            
    return JsonResponse(breakdown)

@login_required
@require_http_methods(["POST", "GET"])
def trip_places(request, trip_id):
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    
    if request.method == 'GET':
        places = [tp.place.id for tp in trip.trip_places.all()]
        return JsonResponse({'places': places})
        
    elif request.method == 'POST':
        try:
            body = json.loads(request.body)
            place = get_object_or_404(Place, id=body['place_id'])
            tp, created = TripPlace.objects.get_or_create(trip=trip, place=place)
            return JsonResponse({'message': 'Place added', 'created': created}, status=201 if created else 200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@login_required
@require_http_methods(["DELETE"])
def trip_place_remove(request, trip_id, place_id):
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    place = get_object_or_404(Place, id=place_id)
    TripPlace.objects.filter(trip=trip, place=place).delete()
    return JsonResponse({'message': 'Place removed'}, status=204)
