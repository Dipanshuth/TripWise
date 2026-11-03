import os
import django
import json
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from destinations.models import Destination, Place, Accommodation

def extract_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        # extract everything between [ and ]
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            # Note: the typescript files use strict JSON formatting for the arrays
            try:
                # To be safe, remove `export const ... = ` and parse with json.loads? 
                # Actually, in places.ts it's literally strict JSON objects
                text = match.group(0)
                # some properties might not be quoted, but looking at places.ts it had quotes around keys.
                return json.loads(text)
            except Exception as e:
                print(f"Error parsing {filepath}: {e}")
                return []
    return []

def run():
    print("Deleting old generic places and accommodations...")
    Place.objects.all().delete()
    Accommodation.objects.all().delete()

    places = extract_json('src/data/places.ts')
    print(f"Loaded {len(places)} places from mock data.")

    destinations = {d.slug: d for d in Destination.objects.all()}
    
    # Map frontend dest_id (like d1) to slug
    dest_map = {
        'd1': 'kullu', 'd2': 'manali', 'd3': 'goa', 'd4': 'jaipur', 'd5': 'agra',
        'd6': 'varanasi', 'd7': 'munnar', 'd8': 'udaipur', 'd9': 'rishikesh',
        'd10': 'darjeeling', 'd11': 'hampi', 'd12': 'andaman'
    }

    for p in places:
        slug = dest_map.get(p.get('destinationId'))
        dest = destinations.get(slug)
        if dest:
            Place.objects.create(
                destination=dest,
                name=p.get('name', 'Unknown'),
                category=p.get('category', 'Sightseeing'),
                description=p.get('description', ''),
                image_url=p.get('image', ''),
                rating=p.get('rating', 4.0),
                distance=p.get('distance', ''),
                visit_duration=p.get('recommendedTimeHours', 2),
                entry_fee=p.get('entryFee', 0)
            )

    print("Added real places!")
    
    # Accommodations
    accs = extract_json('src/data/accommodations.ts')
    print(f"Loaded {len(accs)} accommodations from mock data.")
    for a in accs:
        slug = dest_map.get(a.get('destinationId'))
        dest = destinations.get(slug)
        if dest:
            Accommodation.objects.create(
                destination=dest,
                name=a.get('name', 'Unknown'),
                hotel_type=a.get('type', 'budget'),
                price_per_night=a.get('pricePerNight', 0),
                rating=a.get('rating', 4.0),
                image_url=a.get('image', ''),
                description=a.get('description', '')
            )
            
    print("Added real accommodations!")

if __name__ == "__main__":
    run()
