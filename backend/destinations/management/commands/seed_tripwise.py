import json
import random
import re
import os
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.conf import settings
from destinations.models import Destination, Origin, DestinationPricing, Place, Accommodation, Activity, TransportOption
from expenses.models import Discount

class Command(BaseCommand):
    help = 'Seed the TripWise database with initial data'

    def parse_fee(self, fee_str):
        if not fee_str: return Decimal('0.00')
        # handle ₹50, 500, etc.
        matches = re.findall(r'\d+', str(fee_str).replace(',', ''))
        if matches:
            return Decimal(matches[0])
        return Decimal('0.00')

    def determine_pricing_type(self, notes_str, unit_str):
        notes_str = str(notes_str).lower()
        unit_str = str(unit_str).lower()
        combined = notes_str + " " + unit_str
        if 'vehicle' in combined or 'car' in combined or 'jeep' in combined:
            return 'per_vehicle'
        elif 'trip' in combined:
            return 'per_trip'
        elif 'free' in combined:
            return 'per_person'
        else:
            return 'per_person'

    def parse_transport_cost(self, typical_str, estimate_str):
        text = str(typical_str) if typical_str else str(estimate_str)
        if not text: return Decimal('0.00')

        matches = re.findall(r'\d+', text.replace(',', ''))
        if len(matches) >= 2:
            return Decimal(str(int((int(matches[0]) + int(matches[1])) / 2)))
        elif len(matches) == 1:
            return Decimal(matches[0])
        return Decimal('0.00')

    def get_ticket_group(self, dest_name, place_name):
        if dest_name == 'Hampi' and place_name in ['Vittala Temple', 'Elephant Stables', 'Lotus Mahal']:
            return 'hampi_monument_group'
        return None

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting to seed database...")

        # 1. Origins
        origins_data = ['Delhi', 'Mumbai', 'Bengaluru', 'Chandigarh']
        origins = {}
        for name in origins_data:
            obj, created = Origin.objects.get_or_create(name=name, defaults={'slug': name.lower()})
            origins[name] = obj

        destinations_data = [
            {'name': 'Kullu', 'slug': 'kullu', 'min_budget': 7000, 'img': 'https://upload.wikimedia.org/wikipedia/commons/3/34/Beas_Valley_-_Palchan_-_Kullu_2014-05-10_2275.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'},
            {'name': 'Manali', 'slug': 'manali', 'min_budget': 8000, 'img': 'https://upload.wikimedia.org/wikipedia/commons/0/03/Manali_City.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'},
            {'name': 'Goa', 'slug': 'goa', 'min_budget': 12000, 'img': 'https://upload.wikimedia.org/wikipedia/commons/f/fc/BeachFun.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'},
            {'name': 'Jaipur', 'slug': 'jaipur', 'min_budget': 8000, 'img': 'https://upload.wikimedia.org/wikipedia/commons/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'},
            {'name': 'Agra', 'slug': 'agra', 'min_budget': 5000, 'img': 'https://upload.wikimedia.org/wikipedia/commons/6/68/Taj_Mahal%2C_Agra%2C_India.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'},
            {'name': 'Varanasi', 'slug': 'varanasi', 'min_budget': 4500, 'img': 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Varanasi%2C_India%2C_Ghats%2C_Cremation_ceremony_in_progress.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'},
            {'name': 'Munnar', 'slug': 'munnar', 'min_budget': 8500, 'img': 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Munnar_Overview.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'},
            {'name': 'Udaipur', 'slug': 'udaipur', 'min_budget': 9000, 'img': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Evening_view%2C_City_Palace%2C_Udaipur.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'},
            {'name': 'Rishikesh', 'slug': 'rishikesh', 'min_budget': 6000, 'img': 'https://upload.wikimedia.org/wikipedia/commons/7/74/Trayambakeshwar_Temple_VK.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'},
            {'name': 'Darjeeling', 'slug': 'darjeeling', 'min_budget': 7500, 'img': 'https://upload.wikimedia.org/wikipedia/commons/9/96/DarjeelingTrainFruitshop_%282%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'},
            {'name': 'Hampi', 'slug': 'hampi', 'min_budget': 5000, 'img': 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'},
            {'name': 'Andaman Islands', 'slug': 'andaman', 'min_budget': 20000, 'img': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/The_Coral_Reef_at_the_Andaman_Islands.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'},
        ]

        destinations = {}
        for idx, dest_info in enumerate(destinations_data, start=1):
            name = dest_info['name']
            slug = dest_info['slug']
            min_budget = dest_info['min_budget']
            img = dest_info.get('img', f"https://example.com/{slug}.jpg")

            dest, created = Destination.objects.get_or_create(
                slug=slug,
                defaults={
                    'name': name,
                    'description': f"Beautiful destination: {name}",
                    'image_url': img
                }
            )
            if not created and dest.image_url != img:
                dest.image_url = img
                dest.save()
            destinations[name] = dest

            # Create pricing
            DestinationPricing.objects.get_or_create(
                destination=dest,
                defaults={
                    'food_min': Decimal('500.00'),
                    'food_typical': Decimal('800.00'),
                    'food_max': Decimal('3000.00'),
                    'local_transport_min': Decimal('300.00'),
                    'local_transport_typical': Decimal('600.00'),
                    'local_transport_max': Decimal('2500.00'),
                    'minimum_daily_budget_per_person': Decimal(str(min_budget / 3)), # rough estimate
                }
            )

            # 4. Accommodations
            hotel_types = ['budget', '3_star', '4_star', 'luxury']
            for i in range(3):
                h_type = hotel_types[i]
                price = Decimal(str(1000 * (i + 1)))
                Accommodation.objects.get_or_create(
                    destination=dest,
                    name=f"{name} {h_type.replace('_', ' ').title()} Hotel",
                    defaults={
                        'hotel_type': h_type,
                        'price_per_night': price,
                        'room_capacity': 2,
                        'rating': Decimal(str(round(random.uniform(3.5, 5.0), 1))),
                    }
                )
                
            # 5. Activities
            Activity.objects.get_or_create(
                destination=dest,
                name=f"{name} Adventure Tour",
                defaults={
                    'category': 'Adventure',
                    'price_per_person': Decimal('1500.00'),
                    'duration': '4 hours'
                }
            )
            
            # 6. Transport Options (From every origin) will be seeded after destinations.
            
        # Load 48 Transport Routes
        transport_json_path = os.path.join(settings.BASE_DIR, 'data', 'TripWise_48_Transport_Master.json')
        if os.path.exists(transport_json_path):
            with open(transport_json_path, 'r', encoding='utf-8') as f:
                transport_data = json.load(f)
            
            # Clear old mock transport options to prevent MultipleObjectsReturned on update_or_create
            TransportOption.objects.all().delete()
            
            for t in transport_data:
                origin_obj = origins.get(t['origin'])
                dest_obj = destinations.get(t['destination'])
                if not origin_obj or not dest_obj:
                    continue
                
                TransportOption.objects.create(
                    origin=origin_obj,
                    destination=dest_obj,
                    mode=t['mode'],
                    min_price=Decimal(str(t['min_price'])),
                    typical_price=Decimal(str(t['typical_price'])),
                    max_price=Decimal(str(t['max_price'])),
                    pricing_type=t['pricing_type'],
                    distance_km=t.get('distance_km', ''),
                    duration=t.get('duration', ''),
                    duration_min=t.get('duration_min'),
                    duration_typical=t.get('duration_typical'),
                    duration_max=t.get('duration_max'),
                )

        # 7. Discounts
        discounts = [
            {'code': 'TRIP10', 'type': 'percentage', 'val': '10.00', 'min': '0.00'},
            {'code': 'SAVE500', 'type': 'fixed', 'val': '500.00', 'min': '2000.00'},
            {'code': 'STUDENT15', 'type': 'percentage', 'val': '15.00', 'min': '0.00'},
            {'code': 'WELCOME', 'type': 'fixed', 'val': '1000.00', 'min': '5000.00'}
        ]
        
        for d in discounts:
            Discount.objects.get_or_create(
                code=d['code'],
                defaults={
                    'discount_type': d['type'],
                    'value': Decimal(d['val']),
                    'minimum_amount': Decimal(d['min']),
                    'active': True
                }
            )

        # Load 60 Places
        json_path = os.path.join(settings.BASE_DIR, 'data', 'TripWise_60_Places_Master.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            places_data = json.load(f)

        valid_place_ids = []
        for p in places_data:
            dest_name = p['destination']
            if dest_name not in destinations:
                continue
            dest_obj = destinations[dest_name]
            
            entry_fee_raw = str(p.get('entry_fee', '0'))
            entry_fee = self.parse_fee(entry_fee_raw)
            entry_fee_type = self.determine_pricing_type(p.get('entry_fee_notes', ''), p.get('entry_fee_unit', ''))
            
            transport_estimate_raw = str(p.get('transport_estimate', ''))
            typical_transport_budget_pp_raw = str(p.get('typical_transport_budget_pp', ''))
            local_transport_cost = self.parse_transport_cost(typical_transport_budget_pp_raw, transport_estimate_raw)
            local_transport_type = self.determine_pricing_type(transport_estimate_raw, "")

            ticket_group = self.get_ticket_group(dest_name, p['place'])

            place, _ = Place.objects.update_or_create(
                destination=dest_obj,
                name=p['place'],
                defaults={
                    'category': p.get('category', 'Sightseeing'),
                    'distance': p.get('distance', ''),
                    'travel_time': p.get('travel_time_one_way', ''),
                    'entry_fee': entry_fee,
                    'entry_fee_raw': entry_fee_raw,
                    'entry_fee_type': entry_fee_type,
                    'entry_fee_notes': p.get('entry_fee_notes', ''),
                    'ticket_group': ticket_group,
                    'local_transport_mode': p.get('local_transport_mode', ''),
                    'local_transport_cost': local_transport_cost,
                    'transport_estimate_raw': transport_estimate_raw,
                    'typical_transport_budget_pp_raw': typical_transport_budget_pp_raw,
                    'local_transport_type': local_transport_type,
                }
            )
            valid_place_ids.append(place.id)

        # Delete mock places (any place not in the valid 60 places list)
        mock_places = Place.objects.exclude(id__in=valid_place_ids)
        mock_places.delete()

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded database. Loaded {len(valid_place_ids)} places.'))
