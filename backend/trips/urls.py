from django.urls import path
from . import views
from expenses.views import trip_expenses
from reports import views as report_views

urlpatterns = [
    path('trips/', views.trip_list, name='trip-list'),
    path('trips/<int:trip_id>/', views.trip_detail, name='trip-detail'),
    path('trips/<int:trip_id>/calculate/', views.calculate_trip, name='trip-calculate'),
    path('trips/<int:trip_id>/places/', views.trip_places, name='trip-places'),
    path('trips/<int:trip_id>/places/<int:place_id>/', views.trip_place_remove, name='trip-place-remove'),
    path('trips/<int:trip_id>/expenses/', trip_expenses, name='trip-expenses'),
    
    # Reports
    path('reports/trips/<int:trip_id>/csv/', report_views.report_trip_csv, name='report-trip-csv'),
    path('reports/trips/<int:trip_id>/expenses/csv/', report_views.report_expense_csv, name='report-expense-csv'),
    path('reports/trips/<int:trip_id>/pdf/', report_views.report_trip_pdf, name='report-trip-pdf'),
    path('reports/trips/<int:trip_id>/expenses/pdf/', report_views.report_expense_pdf, name='report-expense-pdf'),
]
