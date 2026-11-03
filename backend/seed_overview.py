import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from destinations.models import Destination, DestinationPricing

data = {
    'Kullu': {
        'budget': 3700,
        'duration': '4 days',
        'season': 'March to June',
        'tags': 'Mountains,Nature,Adventure'
    },
    'Manali': {
        'budget': 2500,
        'duration': '4 days',
        'season': 'March to June',
        'tags': 'Mountains,Adventure,Snow'
    },
    'Goa': {
        'budget': 3500,
        'duration': '5 days',
        'season': 'November to February',
        'tags': 'Beaches,Nightlife,Water Sports'
    },
    'Jaipur': {
        'budget': 3000,
        'duration': '3 days',
        'season': 'October to March',
        'tags': 'Heritage,Culture,Shopping'
    },
    'Agra': {
        'budget': 3000,
        'duration': '2 days',
        'season': 'October to March',
        'tags': 'Heritage,Architecture,History'
    },
    'Varanasi': {
        'budget': 2000,
        'duration': '3 days',
        'season': 'October to March',
        'tags': 'Spiritual,Culture,Heritage'
    },
    'Munnar': {
        'budget': 2500,
        'duration': '4 days',
        'season': 'September to May',
        'tags': 'Nature,Tea,Mountains'
    },
    'Udaipur': {
        'budget': 3000,
        'duration': '3 days',
        'season': 'October to March',
        'tags': 'Lakes,Heritage,Romance'
    },
    'Rishikesh': {
        'budget': 2000,
        'duration': '4 days',
        'season': 'September to November',
        'tags': 'Adventure,Yoga,Nature'
    },
    'Darjeeling': {
        'budget': 2500,
        'duration': '4 days',
        'season': 'March to May',
        'tags': 'Mountains,Tea,Nature'
    },
    'Hampi': {
        'budget': 2000,
        'duration': '3 days',
        'season': 'October to February',
        'tags': 'Heritage,History,Architecture'
    },
    'Andaman Islands': {
        'budget': 3500,
        'duration': '6 days',
        'season': 'October to May',
        'tags': 'Beaches,Diving,Island Adventure'
    }
}

for name, info in data.items():
    try:
        dest = Destination.objects.get(name=name)
        dest.recommended_duration = info['duration']
        dest.best_season = info['season']
        dest.popular_for = info['tags']
        dest.save()
        
        pricing, created = DestinationPricing.objects.get_or_create(destination=dest)
        pricing.daily_budget_typical = info['budget']
        pricing.daily_budget_min = info['budget'] * 0.7  # Just some logical min if needed
        pricing.daily_budget_max = info['budget'] * 1.5
        pricing.daily_budget_source = 'Current 2026 destination travel budget guide'
        pricing.save()
        
        print(f"Updated {name}")
    except Destination.DoesNotExist:
        print(f"Skipped {name} - not found")

print("Seeding complete.")
