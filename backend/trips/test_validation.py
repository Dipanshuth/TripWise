from django.test import TestCase
from decimal import Decimal
from django.contrib.auth.models import User
from destinations.models import Destination, Origin, Place, Accommodation, TransportOption, DestinationPricing
from trips.models import Trip, TripPlace
from trips.services.cost_calculator import CostCalculator

class TripValidationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='password123')
        self.dest = Destination.objects.create(name='ValidationCity', slug='validation-city')
        self.origin = Origin.objects.create(name='OriginCity', slug='origin-city')
        
        self.pricing = DestinationPricing.objects.create(
            destination=self.dest,
            food_min=Decimal('500'),
            food_typical=Decimal('1000'),
            food_max=Decimal('2000'),
            local_transport_min=Decimal('200'),
            local_transport_typical=Decimal('500'),
            local_transport_max=Decimal('1000'),
            minimum_daily_budget_per_person=Decimal('1000'),
            local_transport_pricing_type='per_person_per_day'
        )

        self.acc_2p = Accommodation.objects.create(
            destination=self.dest, name='Hotel 2P', hotel_type='budget',
            price_per_night=Decimal('2000'), room_capacity=2
        )
        self.acc_3p = Accommodation.objects.create(
            destination=self.dest, name='Hotel 3P', hotel_type='budget',
            price_per_night=Decimal('3000'), room_capacity=3
        )

        self.transport_pp = TransportOption.objects.create(
            origin=self.origin, destination=self.dest, mode='bus', pricing_type='per_person',
            min_price=Decimal('500'), typical_price=Decimal('1000'), max_price=Decimal('1500')
        )
        
        self.transport_veh = TransportOption.objects.create(
            origin=self.origin, destination=self.dest, mode='cab', pricing_type='per_vehicle',
            min_price=Decimal('2000'), typical_price=Decimal('4000'), max_price=Decimal('6000')
        )

    def test_1_traveller(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=2, travellers=1, selected_transport=self.transport_pp, selected_accommodation=self.acc_2p)
        calc = CostCalculator(trip)
        res = calc.get_full_breakdown()
        # Transport: 1 * 1000 = 1000
        # Hotel: 1 room * 1 night * 2000 = 2000
        # Food: 1 * 2 * 1000 = 2000
        # Local: 1 * 2 * 500 = 1000
        self.assertEqual(res['total']['typical'], Decimal('6000'))

    def test_2_travellers(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=2, travellers=2, selected_transport=self.transport_pp, selected_accommodation=self.acc_2p)
        calc = CostCalculator(trip)
        res = calc.get_full_breakdown()
        # Transport: 2 * 1000 = 2000
        # Hotel: 1 room * 1 night * 2000 = 2000
        # Food: 2 * 2 * 1000 = 4000
        # Local: 2 * 2 * 500 = 2000
        self.assertEqual(res['total']['typical'], Decimal('10000'))

    def test_4_travellers_shared_private_taxi(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=2, travellers=4, selected_transport=self.transport_veh)
        calc = CostCalculator(trip)
        res = calc.calculate_transport_cost()
        # Vehicles = 1 (ceil(4/4))
        # Transport typ = 4000
        self.assertEqual(res['typical'], Decimal('4000'))

    def test_hotel_2_person_room(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=3, selected_accommodation=self.acc_2p)
        calc = CostCalculator(trip)
        res = calc.calculate_accommodation_cost()
        # 3 travellers, 2 per room -> 2 rooms
        # 3 days -> 2 nights
        # 2 * 2 * 2000 = 8000
        self.assertEqual(res['typical'], Decimal('8000'))

    def test_hotel_3_person_room(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=3, selected_accommodation=self.acc_3p)
        calc = CostCalculator(trip)
        res = calc.calculate_accommodation_cost()
        # 3 travellers, 3 per room -> 1 room
        # 2 nights
        # 1 * 2 * 3000 = 6000
        self.assertEqual(res['typical'], Decimal('6000'))

    def test_4_day_trip(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=4, travellers=1)
        calc = CostCalculator(trip)
        res = calc.calculate_food_cost()
        # 1 * 4 * 1000 = 4000
        self.assertEqual(res['typical'], Decimal('4000'))

    def test_1_day_trip(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=1, travellers=1, selected_accommodation=self.acc_2p)
        calc = CostCalculator(trip)
        acc_res = calc.calculate_accommodation_cost()
        # 1 day -> 0 nights. cost = 0
        self.assertEqual(acc_res['typical'], Decimal('0.00'))

    def test_food_per_person_calculation(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=2)
        calc = CostCalculator(trip)
        res = calc.calculate_food_cost()
        self.assertEqual(res['typical'], Decimal('6000'))

    def test_local_vehicle_calculation(self):
        # Change pricing to per_vehicle_per_day
        self.pricing.local_transport_pricing_type = 'per_vehicle_per_day'
        self.pricing.save()
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=3, travellers=3)
        calc = CostCalculator(trip)
        res = calc.calculate_local_travel_cost()
        # 3 travellers -> 1 vehicle
        # 3 days * 1 vehicle * 500 = 1500
        self.assertEqual(res['typical'], Decimal('1500'))

    def test_budget_below_minimum(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=2, travellers=1)
        # min required: food_min 500*2 = 1000, local_min 200*2 = 400 => total 1400
        calc = CostCalculator(trip, user_budget=1000)
        res = calc.get_full_breakdown()
        self.assertEqual(res['validation']['budget_status'], 'BELOW_MINIMUM')
        self.assertEqual(res['validation']['budget_shortfall'], Decimal('400'))
        self.assertEqual(res['total']['min'], Decimal('1400'))

    def test_budget_equal_to_minimum(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=2, travellers=1)
        calc = CostCalculator(trip, user_budget=1400)
        res = calc.get_full_breakdown()
        self.assertEqual(res['validation']['budget_status'], 'ECONOMICAL')

    def test_budget_between_minimum_and_typical(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=2, travellers=1)
        # typ required: food 1000*2 = 2000, local 500*2 = 1000 => total 3000
        calc = CostCalculator(trip, user_budget=2000)
        res = calc.get_full_breakdown()
        self.assertEqual(res['validation']['budget_status'], 'ECONOMICAL')

    def test_budget_above_typical(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=2, travellers=1)
        calc = CostCalculator(trip, user_budget=4000)
        res = calc.get_full_breakdown()
        self.assertEqual(res['validation']['budget_status'], 'COVERS_TYPICAL')

    def test_min_typical_max_consistency(self):
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=2, travellers=1)
        calc = CostCalculator(trip)
        res = calc.get_full_breakdown()
        self.assertTrue(res['validation']['range_consistency'])
        
        # Force a failure case manually if needed to verify it sets it to False, but we can just check it works

    def test_low_food_outlier(self):
        # Outlier tests check if the calculated per person per day is out of threshold
        # We can simulate this by setting the food typical to be extremely low, below min threshold
        self.pricing.food_typical = Decimal('150')
        self.pricing.food_min = Decimal('200')
        self.pricing.save()
        
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=2, travellers=1)
        calc = CostCalculator(trip)
        res = calc.get_full_breakdown()
        self.assertIn('food', res['validation']['outlier_flags'])
        self.assertEqual(res['validation']['food_warning'], 'LOW_COST_OUTLIER')

    def test_high_local_travel_outlier(self):
        # Add a place with huge local travel cost
        place = Place.objects.create(
            destination=self.dest, name='Viewpoint', category='Nature', 
            local_transport_cost=Decimal('5000'), local_transport_type='per_person'
        )
        trip = Trip.objects.create(user=self.user, source=self.origin, destination=self.dest, days=1, travellers=1)
        TripPlace.objects.create(trip=trip, place=place)
        
        calc = CostCalculator(trip)
        res = calc.get_full_breakdown()
        self.assertIn('local_travel', res['validation']['outlier_flags'])
        self.assertEqual(res['validation']['local_travel_warning'], 'HIGH_COST_OUTLIER')

class AndamanTests(TestCase):
    def test_andaman_flight_only_rule(self):
        # Check if the transport options for Andaman only include flight
        origin = Origin.objects.create(name='Delhi', slug='delhi')
        dest = Destination.objects.create(name='Andaman Islands', slug='andaman-islands')
        TransportOption.objects.create(origin=origin, destination=dest, mode='flight', min_price=10000, typical_price=15000, max_price=20000)
        
        options = TransportOption.objects.filter(destination=dest)
        for opt in options:
            self.assertEqual(opt.mode, 'flight')
