import csv
from django.http import HttpResponse

def generate_trip_csv(trip):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="tripwise_trip_{trip.id}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['TripWise Trip Report'])
    writer.writerow([])
    
    writer.writerow(['Trip ID', trip.id])
    writer.writerow(['User', trip.user.username])
    writer.writerow(['Source', trip.source.name if trip.source else 'None'])
    writer.writerow(['Destination', trip.destination.name if trip.destination else 'None'])
    writer.writerow(['Days', trip.days])
    writer.writerow(['Travellers', trip.travellers])
    writer.writerow(['Travel Style', trip.travel_style])
    writer.writerow([])
    
    # Calculate costs
    from trips.services.cost_calculator import CostCalculator
    calc = CostCalculator(trip)
    costs = calc.get_full_breakdown()
    
    def fmt(val_dict):
        v_min = float(val_dict.get('min', 0))
        v_typ = float(val_dict.get('typical', 0))
        v_max = float(val_dict.get('max', 0))
        if v_min == v_max:
            return f"{v_typ:.2f}"
        return f"{v_min:.2f} - {v_max:.2f}"

    writer.writerow(['Cost Breakdown'])
    writer.writerow(['Transportation', fmt(costs.get('transportation', {}))])
    writer.writerow(['Accommodation', fmt(costs.get('accommodation', {}))])
    writer.writerow(['Food', fmt(costs.get('food', {}))])
    writer.writerow(['Activities', fmt(costs.get('activities', {}))])
    writer.writerow(['Local Travel', fmt(costs.get('local_travel', {}))])
    writer.writerow(['Custom Expenses', fmt(costs.get('custom', {}))])
    writer.writerow(['Subtotal', fmt(costs.get('subtotal', {}))])
    writer.writerow(['Discount', fmt(costs.get('discount', {}))])
    writer.writerow(['Total', fmt(costs.get('total', {}))])
    writer.writerow(['Cost Per Person', fmt(costs.get('per_person', {}))])
    writer.writerow(['Cost Per Day', fmt(costs.get('per_day', {}))])
    writer.writerow([])
    
    places = trip.trip_places.all()
    if places:
        writer.writerow(['Selected Places'])
        writer.writerow(['Place', 'Category', 'Entry Fee'])
        for tp in places:
            writer.writerow([tp.place.name, tp.place.category, tp.place.entry_fee])
            
    return response

def generate_expense_csv(trip):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="tripwise_expenses_{trip.id}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['TripWise Expense Report'])
    writer.writerow(['Trip ID', trip.id])
    writer.writerow(['Destination', trip.destination.name if trip.destination else 'None'])
    writer.writerow([])
    
    writer.writerow(['Expense Name', 'Category', 'Amount', 'Description', 'Created At'])
    
    for expense in trip.expenses.all().order_by('-created_at'):
        writer.writerow([
            expense.name,
            expense.category,
            f"{expense.amount:.2f}",
            expense.description,
            expense.created_at.strftime('%Y-%m-%d %H:%M')
        ])
        
    return response
