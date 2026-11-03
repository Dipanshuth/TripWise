import logging
from django.db import connection
from django.shortcuts import render
from django.http import JsonResponse

logger = logging.getLogger(__name__)

def home_view(request):
    context = {
        "project_name": "TripWise",
        "description": "Travel planning and cost estimation platform",
        "phase": "Phase 2"
    }
    return render(request, 'core/home.html', context)

def about_view(request):
    context = {
        "project_name": "TripWise"
    }
    return render(request, 'core/about.html', context)

def health_view(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({
            "status": "ok",
            "database": "connected",
            "service": "TripWise Django Backend",
            "phase": "Phase 2"
        }, status=200)
    except Exception:
        logger.exception("Health check database connectivity test failed")
        return JsonResponse({
            "status": "degraded",
            "database": "unreachable",
            "service": "TripWise Django Backend",
            "phase": "Phase 2"
        }, status=503)
