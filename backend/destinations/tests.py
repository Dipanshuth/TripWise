from django.test import TestCase, Client
from django.urls import reverse
from .models import Destination, Origin, Place, Accommodation, TransportOption

class SearchAPITests(TestCase):
    def setUp(self):
        self.client = Client()
        self.dest1 = Destination.objects.create(name='Manali', slug='manali')
        self.dest2 = Destination.objects.create(name='Goa', slug='goa')
        
        self.place1 = Place.objects.create(destination=self.dest1, name='Hadimba Temple', category='Temple')
        self.place2 = Place.objects.create(destination=self.dest2, name='Baga Beach', category='Beach')
        
        self.acc1 = Accommodation.objects.create(
            destination=self.dest1, name='Snow View', hotel_type='3_star', price_per_night=2000
        )
        
        self.origin = Origin.objects.create(name='Delhi', slug='delhi')
        self.transport = TransportOption.objects.create(
            origin=self.origin, destination=self.dest1, mode='bus', pricing_type='per_person', typical_price=1500
        )

    def test_destination_search(self):
        res = self.client.get(reverse('search-destinations') + '?q=man')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data['results']), 1)
        self.assertEqual(data['results'][0]['name'], 'Manali')

    def test_case_insensitive_destination_search(self):
        res = self.client.get(reverse('search-destinations') + '?q=MANALI')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()['results']), 1)

    def test_empty_destination_search(self):
        res = self.client.get(reverse('search-destinations'))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()['results']), 2)

    def test_place_search(self):
        res = self.client.get(reverse('search-places') + '?q=beach')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data['results']), 1)
        self.assertEqual(data['results'][0]['name'], 'Baga Beach')

    def test_place_filter_by_destination(self):
        res = self.client.get(reverse('search-places') + f'?destination={self.dest1.id}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()['results']), 1)
        self.assertEqual(res.json()['results'][0]['name'], 'Hadimba Temple')

    def test_accommodation_filter(self):
        res = self.client.get(reverse('search-accommodations') + f'?destination={self.dest1.id}&hotel_type=3_star')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()['results']), 1)
        
    def test_transport_filter(self):
        res = self.client.get(reverse('search-transport') + '?origin=Delhi&destination=Manali&mode=bus')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()['results']), 1)
        
    def test_transport_filter_by_id(self):
        res = self.client.get(reverse('search-transport') + f'?origin={self.origin.id}&destination={self.dest1.id}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()['results']), 1)
        
    def test_transport_filter_by_mixed(self):
        res = self.client.get(reverse('transport-list') + f'?origin=Delhi&destination={self.dest1.id}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()['results']), 1)
        data = res.json()['results'][0]
        self.assertIn('min_price', data)
        self.assertIn('typical_price', data)
        self.assertIn('pricing_type', data)

from django.core.management import call_command

class DataSeedTests(TestCase):
    def test_seed_data_counts(self):
        # Run the seed script
        call_command('seed_tripwise')
        
        # Verify exactly 12 destinations
        self.assertEqual(Destination.objects.count(), 12)
        
        # Verify exactly 60 places
        self.assertEqual(Place.objects.count(), 60)
        
        # Verify each destination has exactly 5 places
        for dest in Destination.objects.all():
            self.assertEqual(dest.places.count(), 5)
            
    def test_transport_seed_data(self):
        call_command('seed_tripwise')
        
        self.assertEqual(Origin.objects.count(), 4)
        self.assertEqual(Destination.objects.count(), 12)
        
        # 4 origins x 12 dests = 48 routes, but multiple modes per route
        # Check combinations exist
        for o in ['Delhi', 'Mumbai', 'Bengaluru', 'Chandigarh']:
            for d in ['Goa', 'Manali']:
                options = TransportOption.objects.filter(origin__name=o, destination__name=d)
                self.assertGreater(options.count(), 0)
                
        # Andaman is flight only
        andaman = TransportOption.objects.filter(destination__name='Andaman Islands')
        self.assertGreater(andaman.count(), 0)
        for t in andaman:
            self.assertEqual(t.mode, 'flight')
            
        # Verify pricing types
        buses = TransportOption.objects.filter(mode='bus')
        for b in buses: self.assertEqual(b.pricing_type, 'per_person')
        
        trains = TransportOption.objects.filter(mode='train')
        for t in trains: self.assertEqual(t.pricing_type, 'per_person')
        
        flights = TransportOption.objects.filter(mode='flight')
        for f in flights: self.assertEqual(f.pricing_type, 'per_person')
        
        cabs = TransportOption.objects.filter(mode='cab')
        for c in cabs: self.assertEqual(c.pricing_type, 'per_vehicle')
        
        # Verify min <= typical <= max
        for t in TransportOption.objects.all():
            self.assertTrue(t.min_price <= t.typical_price <= t.max_price)
            
        # API Tests for required routes
        # TEST 1: Delhi -> Kullu
        res = self.client.get(reverse('transport-list') + '?origin=Delhi&destination=Kullu')
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()['results']), 0)
        
        # TEST 2: Delhi -> Goa
        res = self.client.get(reverse('transport-list') + '?origin=Delhi&destination=Goa')
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()['results']), 0)
        
        # TEST 3: Mumbai -> Goa
        res = self.client.get(reverse('transport-list') + '?origin=Mumbai&destination=Goa')
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()['results']), 0)
        
        # TEST 4: Bengaluru -> Goa
        res = self.client.get(reverse('transport-list') + '?origin=Bengaluru&destination=Goa')
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()['results']), 0)
        
        # TEST 5: Chandigarh -> Goa
        res = self.client.get(reverse('transport-list') + '?origin=Chandigarh&destination=Goa')
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()['results']), 0)
        
        # TEST 6: Delhi -> Andaman returns flight-only
        res = self.client.get(reverse('transport-list') + '?origin=Delhi&destination=Andaman Islands')
        self.assertEqual(res.status_code, 200)
        results = res.json()['results']
        self.assertGreater(len(results), 0)
        for r in results:
            self.assertEqual(r['mode'], 'flight')
            
        # TEST 7 & 8: API response contains price fields and pricing_type
        data = res.json()['results'][0]
        self.assertIn('min_price', data)
        self.assertIn('typical_price', data)
        self.assertIn('max_price', data)
        self.assertIn('pricing_type', data)

class DestinationOverviewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.dest = Destination.objects.create(
            name='Test Dest', 
            slug='test-dest',
            recommended_duration='3 days',
            best_season='March to May',
            popular_for='Nature,Relaxation'
        )
        from .models import DestinationPricing
        self.pricing = DestinationPricing.objects.create(
            destination=self.dest,
            daily_budget_typical=3000
        )

    def test_overview_fields_present_in_list(self):
        res = self.client.get(reverse('search-destinations'))
        self.assertEqual(res.status_code, 200)
        data = res.json()['results'][0]
        self.assertIn('recommended_duration', data)
        self.assertIn('best_season', data)
        self.assertIn('popular_for', data)
        self.assertIn('daily_budget_typical', data)
        self.assertEqual(data['daily_budget_typical'], 3000)
        self.assertEqual(data['recommended_duration'], '3 days')
        self.assertEqual(data['best_season'], 'March to May')
        self.assertListEqual(data['popular_for'], ['Nature', 'Relaxation'])

    def test_overview_fields_present_in_detail(self):
        res = self.client.get(reverse('destination-detail', args=[self.dest.id]))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn('recommended_duration', data)
        self.assertIn('best_season', data)
        self.assertIn('popular_for', data)
        self.assertIn('daily_budget_typical', data)
        self.assertEqual(data['daily_budget_typical'], 3000)
        self.assertEqual(data['recommended_duration'], '3 days')
        self.assertEqual(data['best_season'], 'March to May')
        self.assertListEqual(data['popular_for'], ['Nature', 'Relaxation'])

