from django.shortcuts import render
from django.http import JsonResponse

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
    return JsonResponse({
        "status": "ok",
        "service": "TripWise Django Backend",
        "phase": "Phase 2"
    })
