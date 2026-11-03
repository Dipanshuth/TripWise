import json
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from .models import Expense
from trips.models import Trip

@login_required
@require_http_methods(["GET", "POST"])
def trip_expenses(request, trip_id):
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    
    if request.method == 'GET':
        expenses = trip.expenses.all()
        data = [{
            'id': e.id,
            'name': e.name,
            'category': e.category,
            'amount': float(e.amount),
            'description': e.description,
        } for e in expenses]
        return JsonResponse({'results': data})
        
    elif request.method == 'POST':
        try:
            body = json.loads(request.body)
            expense = Expense(
                trip=trip,
                name=body['name'],
                category=body.get('category', 'custom'),
                amount=body['amount'],
                description=body.get('description', '')
            )
            expense.full_clean()
            expense.save()
            return JsonResponse({
                'id': expense.id,
                'name': expense.name,
                'category': expense.category,
                'amount': float(expense.amount)
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
