import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from destinations.models import Destination, DestinationPricing

pricing_data = [
    {
        "name": "Kullu",
        "food": {"min": 350, "typical": 800, "max": 1800},
        "transport": {"min": 250, "typical": 500, "max": 1200},
        "source": "Kullu current travel budget data"
    },
    {
        "name": "Manali",
        "food": {"min": 300, "typical": 750, "max": 1200},
        "transport": {"min": 200, "typical": 400, "max": 600},
        "source": "Current 2026 Manali travel budget guides"
    },
    {
        "name": "Goa",
        "food": {"min": 564, "typical": 1347, "max": 2953},
        "transport": {"min": 160, "typical": 443, "max": 1332},
        "source": "BudgetYourTrip Goa"
    },
    {
        "name": "Jaipur",
        "food": {"min": 303, "typical": 727, "max": 1617},
        "transport": {"min": 52, "typical": 122, "max": 256},
        "source": "BudgetYourTrip Jaipur"
    },
    {
        "name": "Agra",
        "food": {"min": 918, "typical": 2259, "max": 5352},
        "transport": {"min": 344, "typical": 863, "max": 2136},
        "source": "BudgetYourTrip Agra"
    },
    {
        "name": "Varanasi",
        "food": {"min": 401, "typical": 1032, "max": 2716},
        "transport": {"min": 156, "typical": 413, "max": 1147},
        "source": "BudgetYourTrip Varanasi"
    },
    {
        "name": "Munnar",
        "food": {"min": 563, "typical": 1426, "max": 3619},
        "transport": {"min": 161, "typical": 425, "max": 1180},
        "source": "BudgetYourTrip Munnar"
    },
    {
        "name": "Udaipur",
        "food": {"min": 639, "typical": 1607, "max": 4009},
        "transport": {"min": 222, "typical": 591, "max": 1665},
        "source": "BudgetYourTrip Udaipur"
    },
    {
        "name": "Rishikesh",
        "food": {"min": 300, "typical": 750, "max": 1500},
        "transport": {"min": 150, "typical": 500, "max": 1500},
        "source": "Current 2026 Rishikesh travel-budget guides"
    },
    {
        "name": "Darjeeling",
        "food": {"min": 860, "typical": 2021, "max": 4215},
        "transport": {"min": 265, "typical": 626, "max": 1318},
        "source": "BudgetYourTrip Darjeeling"
    },
    {
        "name": "Hampi",
        "food": {"min": 400, "typical": 1000, "max": 1800},
        "transport": {"min": 200, "typical": 800, "max": 1500},
        "source": "Current 2026 Hampi travel guides"
    },
    {
        "name": "Andaman Islands",
        "food": {"min": 667, "typical": 1333, "max": 2667},
        "transport": {"min": 250, "typical": 500, "max": 1000},
        "source": "Current Andaman multi-day travel budget data normalized to a per-person/day planning value"
    }
]

for item in pricing_data:
    try:
        dest = Destination.objects.get(name=item['name'])
        pricing, created = DestinationPricing.objects.get_or_create(destination=dest)
        
        pricing.food_min = Decimal(item['food']['min'])
        pricing.food_typical = Decimal(item['food']['typical'])
        pricing.food_max = Decimal(item['food']['max'])
        pricing.food_source = item['source']
        
        pricing.local_transport_min = Decimal(item['transport']['min'])
        pricing.local_transport_typical = Decimal(item['transport']['typical'])
        pricing.local_transport_max = Decimal(item['transport']['max'])
        pricing.local_transport_source = item['source']
        
        pricing.save()
        print(f"Updated pricing for {item['name']}")
    except Destination.DoesNotExist:
        print(f"Destination {item['name']} not found")
