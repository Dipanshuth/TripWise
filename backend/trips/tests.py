from django.test import TestCase, Client
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from decimal import Decimal
import json

from destinations.models import Destination, Origin, Place, Accommodation, TransportOption, Activity, DestinationPricing
from expenses.models import Expense, Discount
from trips.models import Trip, TripPlace
from trips.services.cost_calculator import CostCalculator

class TripTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client.login(username='testuser', password='password123')
        self.user2 = User.objects.create_user(username='otheruser', password='password123')
        self.dest = Destination.objects.create(name='Kullu', slug='kullu')
        self.dest2 = Destination.objects.create(name='Goa', slug='goa')
        self.origin = Origin.objects.create(name='Delhi', slug='delhi')
        
        self.pricing = DestinationPricing.objects.create(
            destination=self.dest,
            food_min=Decimal('500'),
            food_typical=Decimal('800'),
            food_max=Decimal('3000'),
            local_transport_min=Decimal('300'),
            local_transport_typical=Decimal('600'),
            local_transport_max=Decimal('2500'),
            minimum_daily_budget_per_person=Decimal('2000')
        )
        
        self.acc = Accommodation.objects.create(
            destination=self.dest, name='Test Hotel', hotel_type='budget',
            price_per_night=Decimal('1000'), room_capacity=2
        )
        
        self.transport_pp = TransportOption.objects.create(
            origin=self.origin, destination=self.dest,
            mode='bus', pricing_type='per_person', typical_price=Decimal('1000')
        )
        
        self.transport_fixed = TransportOption.objects.create(
            origin=self.origin, destination=self.dest,
            mode='cab', pricing_type='per_vehicle', typical_price=Decimal('5000')
        )
        
        self.place = Place.objects.create(
            destination=self.dest, name='Viewpoint', category='Nature', entry_fee=Decimal('100')
        )
        
        self.place_goa = Place.objects.create(
            destination=self.dest2, name='Beach', category='Nature', entry_fee=Decimal('0')
        )

    def test_trip_creation(self):
        trip = Trip(source=self.origin, destination=self.dest, days=3, travellers=2, travel_style='balanced')
        trip.full_clean()
        trip.save()
        self.assertEqual(Trip.objects.count(), 1)
        
    def test_trip_validation_days_travellers(self):
        trip = Trip(source=self.origin, destination=self.dest, days=0, travellers=1)
        with self.assertRaises(ValidationError):
            trip.full_clean()
            
    def test_trip_place_duplicate_prevention(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2)
        TripPlace.objects.create(trip=trip, place=self.place)
        
        # Test DB constraints manually as django doesn't trigger unique_together without full_clean
        tp = TripPlace(trip=trip, place=self.place)
        with self.assertRaises(ValidationError):
            tp.full_clean()
            
    def test_invalid_destination_place_combination(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2)
        tp = TripPlace(trip=trip, place=self.place_goa)
        with self.assertRaises(ValidationError):
            tp.clean() # manually calling the clean method we defined

    # --- Cost Engine Tests ---
    def test_accommodation_cost(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=5, travellers=4, selected_accommodation=self.acc)
        # 4 nights, 2 rooms
        calc = CostCalculator(trip)
        self.assertEqual(calc.calculate_accommodation_cost()['typical'], Decimal('8000')) # 1000 * 4 * 2 = 8000
        
    def test_transport_per_person_calculation(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2, selected_transport=self.transport_pp)
        calc = CostCalculator(trip)
        self.assertEqual(calc.calculate_transport_cost()['typical'], Decimal('2000')) # 1000 * 2
        
    def test_transport_fixed_calculation(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2, selected_transport=self.transport_fixed)
        calc = CostCalculator(trip)
        self.assertEqual(calc.calculate_transport_cost()['typical'], Decimal('5000')) # 5000 flat
        
    def test_food_calculation(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2, travel_style='balanced')
        calc = CostCalculator(trip)
        self.assertEqual(calc.calculate_food_cost()['typical'], Decimal('4800')) # 800 * 2 * 3 = 4800
        
    def test_activity_calculation(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2)
        # Create a place with a per_vehicle fee and a local transport cost per person
        place2 = Place.objects.create(
            destination=self.dest, 
            name='Viewpoint 2', 
            category='Nature', 
            entry_fee=Decimal('100'),
            entry_fee_type='per_vehicle',
            local_transport_cost=Decimal('50'),
            local_transport_type='per_person'
        )
        TripPlace.objects.create(trip=trip, place=place2)
        calc = CostCalculator(trip)
        # 2 travellers. Per vehicle fee: ceil(2/4) = 1 vehicle. 1 * 100 = 100
        # Local transport is now split into 'local' key
        self.assertEqual(calc.calculate_activity_cost()['activity']['typical'], Decimal('100'))
        self.assertEqual(calc.calculate_activity_cost()['local']['typical'], Decimal('100'))
        
    def test_discount_calculation(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2, travel_style='balanced')
        discount = Discount.objects.create(code='D1', discount_type='fixed', value=Decimal('1000'), minimum_amount=Decimal('0'))
        trip.discount = discount
        trip.save()
        calc = CostCalculator(trip)
        subtotal = calc.get_full_breakdown()['subtotal']
        self.assertEqual(calc.apply_discount(subtotal)['typical'], Decimal('1000'))
        self.assertEqual(calc.get_full_breakdown()['total']['typical'], Decimal('7400'))

    def test_ticket_group_calculation(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2)
        # Create two places with same ticket group
        place1 = Place.objects.create(
            destination=self.dest, name='Vittala', entry_fee=Decimal('100'), ticket_group='hampi'
        )
        place2 = Place.objects.create(
            destination=self.dest, name='Lotus', entry_fee=Decimal('100'), ticket_group='hampi'
        )
        TripPlace.objects.create(trip=trip, place=place1)
        TripPlace.objects.create(trip=trip, place=place2)
        calc = CostCalculator(trip)
        # Both share 'hampi' ticket group, so entry fee should only be charged once.
        # Total cost: 100 * 2 travellers = 200 (not 400)
        self.assertEqual(calc.calculate_activity_cost()['activity']['typical'], Decimal('200'))

    def test_custom_expense_calculation(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2)
        Expense.objects.create(trip=trip, name='Shopping', category='custom', amount=Decimal('2000'))
        calc = CostCalculator(trip)
        self.assertEqual(calc.calculate_custom_cost()['typical'], Decimal('2000'))

    def test_final_total_calculation(self):
        trip = Trip.objects.create(
            source=self.origin, destination=self.dest, days=3, travellers=2,
            travel_style='balanced', selected_accommodation=self.acc, selected_transport=self.transport_pp
        )
        TripPlace.objects.create(trip=trip, place=self.place)
        Expense.objects.create(trip=trip, name='Shopping', category='custom', amount=Decimal('1000'))
        discount = Discount.objects.create(code='D2', discount_type='percentage', value=Decimal('10'), minimum_amount=Decimal('0'))
        trip.discount = discount
        trip.save()
        
        calc = CostCalculator(trip)
        # acc: 1000 * 2 nights * 1 room = 2000
        # transport_pp: 1000 * 2 = 2000
        # food: 800 * 2 * 3 = 4800
        # local: 600 * 3 * 2 = 3600 (Wait, local travel is per person now: 600 * 2 * 3 = 3600)
        # activity: 100 * 2 = 200
        # custom: 1000
        # subtotal: 2000 + 2000 + 4800 + 3600 + 200 + 1000 = 13600
        # discount: 13600 * 10% = 1360
        # total: 13600 - 1360 = 12240
        
        self.assertEqual(calc.get_full_breakdown()['subtotal']['typical'], Decimal('13600'))
        self.assertEqual(calc.get_full_breakdown()['total']['typical'], Decimal('12240'))
        
    def test_minimum_budget_calculation(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2)
        calc = CostCalculator(trip)
        # min_daily = 2000. 2000 * 2 * 3 = 12000
        self.assertEqual(calc.get_full_breakdown()['minimum_budget_threshold'], Decimal('12000'))

    def test_cost_scaling_by_days_and_travellers(self):
        # Base: 1 traveller, 1 day
        trip1 = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=1, travellers=1, travel_style='balanced')
        calc1 = CostCalculator(trip1)
        food1 = calc1.calculate_food_cost()['typical']
        local1 = calc1.calculate_local_travel_cost()['typical']

        # Scaled: 2 travellers, 3 days
        trip2 = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2, travel_style='balanced')
        calc2 = CostCalculator(trip2)
        food2 = calc2.calculate_food_cost()['typical']
        local2 = calc2.calculate_local_travel_cost()['typical']

        self.assertEqual(food2, food1 * 2 * 3)
        self.assertEqual(local2, local1 * 2 * 3)

    def test_preventing_negative_totals(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=1, travellers=1, travel_style='balanced')
        # Massive discount to force negative
        discount = Discount.objects.create(code='D3', discount_type='fixed', value=Decimal('999999'), minimum_amount=Decimal('0'))
        trip.discount = discount
        trip.save()
        calc = CostCalculator(trip)
        self.assertEqual(calc.get_full_breakdown()['total']['min'], Decimal('0.00'))
        self.assertEqual(calc.get_full_breakdown()['total']['typical'], Decimal('0.00'))
        
    # --- API Endpoint Tests ---
    def test_api_destination_endpoint(self):
        response = self.client.get('/api/destinations/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue('results' in data)
        self.assertEqual(len(data['results']), 2)
        
    def test_api_trip_calculation_endpoint(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2)
        response = self.client.post(f'/api/trips/{trip.id}/calculate/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue('subtotal' in data)
        self.assertTrue('total' in data)

    def test_user_cannot_access_other_users_trip(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2)
        
        # Login as user2
        self.client.login(username='otheruser', password='password123')
        
        # Try to view trip
        response = self.client.get(f'/api/trips/{trip.id}/')
        self.assertEqual(response.status_code, 404)
        
        # Try to delete trip
        response = self.client.delete(f'/api/trips/{trip.id}/')
        self.assertEqual(response.status_code, 404)

    def test_unauthenticated_access_denied(self):
        self.client.logout()
        response = self.client.get('/api/trips/')
        # @login_required typically redirects to /accounts/login/ or returns 302
        self.assertEqual(response.status_code, 302)

    # --- Reports Endpoint Tests ---
    def test_trip_csv_report_generation(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2)
        response = self.client.get(f'/api/reports/trips/{trip.id}/csv/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('TripWise Trip Report', response.content.decode())

    def test_expense_csv_report_generation(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2)
        Expense.objects.create(trip=trip, name='Shopping', category='custom', amount=Decimal('1000'))
        response = self.client.get(f'/api/reports/trips/{trip.id}/expenses/csv/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('Shopping', response.content.decode())

    def test_trip_pdf_report_generation(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2)
        response = self.client.get(f'/api/reports/trips/{trip.id}/pdf/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(len(response.content) > 0)
        
    def test_expense_pdf_report_generation(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2)
        Expense.objects.create(trip=trip, name='Shopping', category='custom', amount=Decimal('1000'))
        response = self.client.get(f'/api/reports/trips/{trip.id}/expenses/pdf/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(len(response.content) > 0)
        
    def test_other_user_cannot_download_report(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2)
        self.client.login(username='otheruser', password='password123')
        response = self.client.get(f'/api/reports/trips/{trip.id}/csv/')
        self.assertEqual(response.status_code, 404)
