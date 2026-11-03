from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from trips.models import Trip
from .services.csv_reports import generate_trip_csv, generate_expense_csv
from .services.pdf_reports import generate_trip_pdf, generate_expense_pdf

@login_required
@require_http_methods(["GET"])
def report_trip_csv(request, trip_id):
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    return generate_trip_csv(trip)

@login_required
@require_http_methods(["GET"])
def report_expense_csv(request, trip_id):
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    return generate_expense_csv(trip)

@login_required
@require_http_methods(["GET"])
def report_trip_pdf(request, trip_id):
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    return generate_trip_pdf(trip)

@login_required
@require_http_methods(["GET"])
def report_expense_pdf(request, trip_id):
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    return generate_expense_pdf(trip)
