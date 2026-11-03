import math
from decimal import Decimal
from django.db.models import Sum

class CostCalculator:
    def __init__(self, trip, user_budget=None):
        self.trip = trip
        self.travellers = Decimal(self.trip.travellers)
        self.days = Decimal(self.trip.days)
        self.nights = Decimal(max(self.trip.days - 1, 0))
        self.user_budget = Decimal(user_budget) if user_budget is not None else None

    def _range(self, val_min, val_typ, val_max):
        return {'min': val_min, 'typical': val_typ, 'max': val_max}

    def _zero_range(self):
        return self._range(Decimal('0.00'), Decimal('0.00'), Decimal('0.00'))

    def calculate_transport_cost(self):
        transport = self.trip.selected_transport
        if not transport:
            return self._zero_range()

        t_min = transport.min_price or Decimal('0.00')
        t_typ = transport.typical_price or Decimal('0.00')
        t_max = transport.max_price or Decimal('0.00')

        if transport.pricing_type == 'per_person':
            return self._range(t_min * self.travellers, t_typ * self.travellers, t_max * self.travellers)
        elif transport.pricing_type == 'per_vehicle':
            vehicles = Decimal(math.ceil(self.trip.travellers / 4))
            return self._range(t_min * vehicles, t_typ * vehicles, t_max * vehicles)
        else:
            return self._range(t_min, t_typ, t_max)

    def calculate_accommodation_cost(self):
        acc = self.trip.selected_accommodation
        if not acc or self.nights == 0:
            return self._zero_range()

        price = acc.price_per_night or Decimal('0.00')
        rooms = Decimal(math.ceil(self.trip.travellers / acc.room_capacity))
        total = price * self.nights * rooms
        return self._range(total, total, total)

    def calculate_food_cost(self):
        pricing = getattr(self.trip.destination, 'pricing', None)
        if not pricing:
            return self._zero_range()

        f_min = pricing.food_min * self.travellers * self.days
        f_typ = pricing.food_typical * self.travellers * self.days
        f_max = pricing.food_max * self.travellers * self.days

        return self._range(f_min, f_typ, f_max)

    def calculate_local_travel_cost(self):
        pricing = getattr(self.trip.destination, 'pricing', None)
        if not pricing:
            return self._zero_range()

        l_type = getattr(pricing, 'local_transport_pricing_type', 'per_person_per_day')
        
        if l_type == 'per_person_per_day':
            mult = self.travellers * self.days
        elif l_type == 'per_vehicle_per_day':
            vehicles = Decimal(math.ceil(self.trip.travellers / 4))
            mult = vehicles * self.days
        elif l_type == 'fixed':
            mult = Decimal('1')
        else:
            mult = self.travellers * self.days

        l_min = pricing.local_transport_min * mult
        l_typ = pricing.local_transport_typical * mult
        l_max = pricing.local_transport_max * mult

        return self._range(l_min, l_typ, l_max)

    def calculate_activity_cost(self):
        act_total = Decimal('0.00')
        loc_total = Decimal('0.00')
        paid_ticket_groups = set()
        
        for trip_place in self.trip.trip_places.all():
            place = trip_place.place
            
            fee_type = place.entry_fee_type
            ticket_group = place.ticket_group
            fee = place.entry_fee or Decimal('0.00')
            
            if ticket_group:
                if ticket_group in paid_ticket_groups:
                    fee = Decimal('0.00')
                else:
                    paid_ticket_groups.add(ticket_group)

            if fee_type == 'per_person':
                act_total += fee * self.travellers
            elif fee_type == 'per_vehicle':
                vehicles = Decimal(math.ceil(self.trip.travellers / 4))
                act_total += fee * vehicles
            else:
                act_total += fee
                
            l_cost = place.local_transport_cost or Decimal('0.00')
            l_type = place.local_transport_type
            if l_cost > 0:
                if l_type == 'per_person':
                    loc_total += l_cost * self.travellers
                elif l_type == 'per_vehicle':
                    vehicles = Decimal(math.ceil(self.trip.travellers / 4))
                    loc_total += l_cost * vehicles
                else:
                    loc_total += l_cost

        return {'activity': self._range(act_total, act_total, act_total), 'local': self._range(loc_total, loc_total, loc_total)}

    def calculate_custom_cost(self):
        total = self.trip.expenses.aggregate(sum=Sum('amount'))['sum'] or Decimal('0.00')
        return self._range(total, total, total)

    def apply_discount(self, total_range):
        discount = self.trip.discount
        if not discount:
            return self._zero_range()

        d_min, d_typ, d_max = Decimal('0.00'), Decimal('0.00'), Decimal('0.00')
        
        if discount.discount_type == 'percentage':
            pct = discount.value / Decimal('100.00')
            d_min = total_range['min'] * pct
            d_typ = total_range['typical'] * pct
            d_max = total_range['max'] * pct
        else: # fixed
            val = discount.value
            d_min = min(total_range['min'], val)
            d_typ = min(total_range['typical'], val)
            d_max = min(total_range['max'], val)

        return self._range(d_min, d_typ, d_max)

    def get_full_breakdown(self):
        transport = self.calculate_transport_cost()
        accommodation = self.calculate_accommodation_cost()
        food = self.calculate_food_cost()
        
        act_res = self.calculate_activity_cost()
        activities = act_res['activity']
        
        base_local = self.calculate_local_travel_cost()
        local_travel = self._range(
            base_local['min'] + act_res['local']['min'],
            base_local['typical'] + act_res['local']['typical'],
            base_local['max'] + act_res['local']['max'],
        )
        
        custom = self.calculate_custom_cost()

        subtotal_min = transport['min'] + accommodation['min'] + food['min'] + activities['min'] + local_travel['min'] + custom['min']
        subtotal_typ = transport['typical'] + accommodation['typical'] + food['typical'] + activities['typical'] + local_travel['typical'] + custom['typical']
        subtotal_max = transport['max'] + accommodation['max'] + food['max'] + activities['max'] + local_travel['max'] + custom['max']
        subtotal = self._range(subtotal_min, subtotal_typ, subtotal_max)

        discount = self.apply_discount(subtotal)
        
        raw_min = max(Decimal('0.00'), subtotal_min - discount['max'])
        raw_typ = max(Decimal('0.00'), subtotal_typ - discount['typical'])
        raw_max = max(Decimal('0.00'), subtotal_max - discount['min'])
        
        # Calculate minimum required from mandatory components
        minimum_required = raw_min
        
        budget_status = 'NO_BUDGET_SET'
        budget_shortfall = Decimal('0.00')
        
        if self.user_budget is not None:
            if self.user_budget < minimum_required:
                budget_status = 'BELOW_MINIMUM'
                budget_shortfall = minimum_required - self.user_budget
            elif self.user_budget >= minimum_required and self.user_budget < raw_typ:
                budget_status = 'ECONOMICAL'
            elif self.user_budget >= raw_typ:
                budget_status = 'COVERS_TYPICAL'

        estimated_min = max(raw_min, minimum_required)
        estimated_typical = raw_typ
        estimated_max = max(raw_max, estimated_typical)

        total = self._range(estimated_min, estimated_typical, estimated_max)
        
        range_consistency = True
        if not (total['min'] <= total['typical'] <= total['max']):
            range_consistency = False
            
        pricing = getattr(self.trip.destination, 'pricing', None)
        food_warning = None
        local_travel_warning = None
        accommodation_warning = None
        
        person_days = self.travellers * self.days
        if person_days > 0 and pricing:
            food_pp_pd = food['typical'] / person_days
            if food_pp_pd < pricing.food_min:
                food_warning = "LOW_COST_OUTLIER"
            elif food_pp_pd > pricing.food_max:
                food_warning = "HIGH_COST_OUTLIER"
                
            local_pp_pd = local_travel['typical'] / person_days
            if local_pp_pd < pricing.local_transport_min:
                local_travel_warning = "LOW_COST_OUTLIER"
            elif local_pp_pd > pricing.local_transport_max:
                local_travel_warning = "HIGH_COST_OUTLIER"

        outlier_flags = []
        if food_warning: outlier_flags.append('food')
        if local_travel_warning: outlier_flags.append('local_travel')
        if accommodation_warning: outlier_flags.append('accommodation')

        validation = {
            'budget_status': budget_status,
            'minimum_required': minimum_required,
            'budget_shortfall': budget_shortfall,
            'food_warning': food_warning,
            'local_travel_warning': local_travel_warning,
            'accommodation_warning': accommodation_warning,
            'range_consistency': range_consistency,
            'pricing_basis_valid': True,
            'outlier_flags': outlier_flags
        }

        per_person = self._range(
            total['min'] / self.travellers if self.travellers > 0 else Decimal('0.00'),
            total['typical'] / self.travellers if self.travellers > 0 else Decimal('0.00'),
            total['max'] / self.travellers if self.travellers > 0 else Decimal('0.00')
        )
        
        per_day = self._range(
            total['min'] / self.days if self.days > 0 else Decimal('0.00'),
            total['typical'] / self.days if self.days > 0 else Decimal('0.00'),
            total['max'] / self.days if self.days > 0 else Decimal('0.00')
        )

        min_thresh = Decimal('0.00')
        if hasattr(self.trip.destination, 'pricing') and getattr(self.trip.destination, 'pricing'):
            min_thresh = self.trip.destination.pricing.minimum_daily_budget_per_person * self.travellers * self.days

        return {
            'transportation': transport,
            'accommodation': accommodation,
            'food': food,
            'activities': activities,
            'local_travel': local_travel,
            'custom': custom,
            'subtotal': subtotal,
            'discount': discount,
            'total': total,
            'per_person': per_person,
            'per_day': per_day,
            'minimum_budget_threshold': min_thresh,
            'validation': validation
        }
