import { Trip } from '../types';
import { mockAccommodations } from '../data/accommodations';
import { mockRoutes } from '../data/transport';
import { mockDestinations } from '../data/destinations';
import { mockPlaces } from '../data/places';

export interface Range {
  min: number;
  typical: number;
  max: number;
}

export interface TripSummary {
  transportation: Range;
  accommodation: Range;
  food: Range;
  activities: Range;
  localTravel: Range;
  customExpenses: Range;
  subtotal: Range;
  discountAmount: Range;
  total: Range;
  perPerson: Range;
  perDay: Range;
  minimumBudgetThreshold?: number;
}

const createRange = (valMin: number, valTyp: number, valMax: number): Range => ({
  min: valMin,
  typical: valTyp,
  max: valMax
});

const zeroRange = (): Range => createRange(0, 0, 0);

export const budgetService = {
  calculateTripTotal: (trip: Trip, backendDest?: any, backendRoute?: any, backendPlaces?: any[], backendAccs?: any[]): TripSummary => {
    const strDestId = String(trip.destinationId);
    const mockDestId = strDestId.startsWith('d') ? strDestId : `d${strDestId}`;
    const dest = backendDest || mockDestinations.find(d => String(d.id) === mockDestId || String(d.id) === strDestId);
    const travellers = trip.travellers || 1;
    const days = trip.days || 1;
    const nights = Math.max(days - 1, 0);

    // 1. Transportation
    let transportRange = zeroRange();
    if (trip.transportId) {
      const route = backendRoute || mockRoutes.find(r => (r.origin || '').toLowerCase() === (trip.source || '').toLowerCase() && (String(r.destinationId) === mockDestId || String(r.destinationId) === strDestId));
      if (route && route.options) {
        const strTransportId = String(trip.transportId);
        const mockTransportId = strTransportId.startsWith('t') ? strTransportId : `t${strTransportId}`;
        const transport = route.options.find((t: any) => String(t.id) === mockTransportId || String(t.id) === strTransportId);
        if (transport) {
          const minPrice = Number(transport.min_price || transport.price || 0);
          const typPrice = Number(transport.typical_price || transport.price || 0);
          const maxPrice = Number(transport.max_price || transport.price || 0);
          const pricingType = transport.pricing_type || transport.pricingType || 'per_person';
          
          if (pricingType === 'per_person') {
            transportRange = createRange(minPrice * travellers, typPrice * travellers, maxPrice * travellers);
          } else if (pricingType === 'per_vehicle') {
            const vehicles = Math.ceil(travellers / 4);
            transportRange = createRange(minPrice * vehicles, typPrice * vehicles, maxPrice * vehicles);
          } else {
            transportRange = createRange(minPrice, typPrice, maxPrice);
          }
        }
      }
    }

    // 2. Accommodation
    let accommodationRange = zeroRange();
    if (trip.accommodationId && nights > 0) {
      const strAccId = String(trip.accommodationId);
      const mockAccId = strAccId.startsWith('a') ? strAccId : `a${strAccId}`;
      const acc = (backendAccs && backendAccs.find((a: any) => String(a.id) === strAccId || String(a.id) === mockAccId)) || 
                  mockAccommodations.find(a => String(a.id) === mockAccId || String(a.id) === strAccId);
      if (acc) {
        const price = Number(acc.pricePerNight || acc.price_per_night || 0);
        const capacity = Number(acc.room_capacity || acc.roomCapacity || 2);
        const rooms = Math.ceil(travellers / capacity);
        const total = price * nights * rooms;
        accommodationRange = createRange(total, total, total);
      }
    }

    // 3. Food
    let foodRange = zeroRange();
    if (dest?.pricing) {
      const fMin = Number(dest.pricing.food_min || 0) * travellers * days;
      const fTyp = Number(dest.pricing.food_typical || 0) * travellers * days;
      const fMax = Number(dest.pricing.food_max || 0) * travellers * days;
      foodRange = createRange(fMin, fTyp, fMax);
    } else if (dest) { // Fallback if no pricing (shouldn't happen with seeded data)
      const budgetAmount = dest.dailyBudget || dest.minimumBudget || 1000;
      const baseFood = budgetAmount * 0.2;
      const multiplier = trip.travelStyle === 'Premium' ? 2 : trip.travelStyle === 'Comfort' ? 1.5 : 1;
      const dailyFoodCost = Math.round(baseFood * multiplier);
      const total = dailyFoodCost * travellers * days;
      foodRange = createRange(total, total, total);
    }

    // 4. Local Travel
    let localTravelRange = zeroRange();
    if (dest?.pricing) {
      const lMin = Number(dest.pricing.local_transport_min || 0) * travellers * days;
      const lTyp = Number(dest.pricing.local_transport_typical || 0) * travellers * days;
      const lMax = Number(dest.pricing.local_transport_max || 0) * travellers * days;
      localTravelRange = createRange(lMin, lTyp, lMax);
    } else if (dest) { // Fallback
      const budgetAmount = dest.localTravelCost || (dest.minimumBudget ? dest.minimumBudget * 0.1 : 500);
      const multiplier = trip.travelStyle === 'Premium' ? 2.5 : trip.travelStyle === 'Comfort' ? 1.5 : 1;
      const dailyLocalTravel = Math.round(budgetAmount * multiplier);
      const total = dailyLocalTravel * days;
      localTravelRange = createRange(total, total, total);
    }

    // 5. Activities
    let activitiesTotal = 0;
    const paidTicketGroups = new Set<string>();
    const placesList = trip.places || [];

    if (placesList.length > 0) {
      placesList.forEach(placeId => {
        const pIdStr = String(placeId);
        const mockPId = pIdStr.startsWith('p') ? pIdStr : `p${pIdStr}`;
        const p = (backendPlaces && backendPlaces.find((bp: any) => String(bp.id) === pIdStr)) ||
                  mockPlaces.find(pl => String(pl.id) === mockPId || String(pl.id) === pIdStr);
        if (p) {
          const feeType = p.entry_fee_type || p.entryFeeType || 'per_person';
          const ticketGroup = p.ticket_group || p.ticketGroup;
          let feeToCharge = Number(p.entry_fee || p.entryFee || 0);

          if (ticketGroup) {
            if (paidTicketGroups.has(ticketGroup)) {
              feeToCharge = 0;
            } else {
              paidTicketGroups.add(ticketGroup);
            }
          }

          if (feeType === 'per_person') {
            activitiesTotal += feeToCharge * travellers;
          } else if (feeType === 'per_vehicle') {
            const vehicles = Math.ceil(travellers / 4);
            activitiesTotal += feeToCharge * vehicles;
          } else {
            activitiesTotal += feeToCharge;
          }

          const transportCost = Number(p.local_transport_cost || p.localTransportCost || 0);
          const transportType = p.local_transport_type || p.localTransportType || 'per_person';
          if (transportCost > 0) {
            if (transportType === 'per_person') {
              activitiesTotal += transportCost * travellers;
            } else if (transportType === 'per_vehicle') {
              const vehicles = Math.ceil(travellers / 4);
              activitiesTotal += transportCost * vehicles;
            } else {
              activitiesTotal += transportCost;
            }
          }
        } else if (trip.itinerary) {
          trip.itinerary.forEach(day => {
            day.activities.forEach(act => {
              if (String(act.placeId) === pIdStr) {
                activitiesTotal += Number(act.cost) * travellers;
              }
            });
          });
        }
      });
    }

    // Also include any standalone activities in itinerary that are not place-based
    if (trip.itinerary && trip.itinerary.length > 0) {
      const placesStr = placesList.map(String);
      trip.itinerary.forEach(day => {
        day.activities.forEach(act => {
          if (!act.placeId && Number(act.cost) > 0) {
            activitiesTotal += Number(act.cost) * travellers;
          }
        });
      });
    }

    const activitiesRange = createRange(activitiesTotal, activitiesTotal, activitiesTotal);

    // 6. Custom Expenses
    const customTotal = (trip.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
    const customRange = createRange(customTotal, customTotal, customTotal);

    // Subtotal
    const subMin = transportRange.min + accommodationRange.min + foodRange.min + activitiesRange.min + localTravelRange.min + customRange.min;
    const subTyp = transportRange.typical + accommodationRange.typical + foodRange.typical + activitiesRange.typical + localTravelRange.typical + customRange.typical;
    const subMax = transportRange.max + accommodationRange.max + foodRange.max + activitiesRange.max + localTravelRange.max + customRange.max;
    const subtotalRange = createRange(subMin, subTyp, subMax);

    // 7. Discount
    let discountRange = zeroRange();
    if (trip.discount) {
      if (trip.discount.type === 'percentage') {
        const pct = trip.discount.value / 100;
        discountRange = createRange(subtotalRange.min * pct, subtotalRange.typical * pct, subtotalRange.max * pct);
      } else {
        const val = trip.discount.value;
        discountRange = createRange(
          Math.min(subtotalRange.min, val),
          Math.min(subtotalRange.typical, val),
          Math.min(subtotalRange.max, val)
        );
      }
    }

    // Total
    let tMin = Math.max(0, subtotalRange.min - discountRange.max);
    let tTyp = Math.max(0, subtotalRange.typical - discountRange.typical);
    let tMax = Math.max(0, subtotalRange.max - discountRange.min);
    
    if (tMin > tTyp) tMin = tTyp;
    if (tTyp > tMax) tTyp = tMax;

    const totalRange = createRange(tMin, tTyp, tMax);
    const perPersonRange = createRange(totalRange.min / travellers, totalRange.typical / travellers, totalRange.max / travellers);
    const perDayRange = createRange(totalRange.min / days, totalRange.typical / days, totalRange.max / days);

    let minimumBudgetThreshold = 0;
    if (dest?.pricing?.minimum_daily_budget_per_person) {
      minimumBudgetThreshold = Number(dest.pricing.minimum_daily_budget_per_person) * travellers * days;
    }

    return {
      transportation: transportRange,
      accommodation: accommodationRange,
      food: foodRange,
      activities: activitiesRange,
      localTravel: localTravelRange,
      customExpenses: customRange,
      subtotal: subtotalRange,
      discountAmount: discountRange,
      total: totalRange,
      perPerson: perPersonRange,
      perDay: perDayRange,
      minimumBudgetThreshold
    };
  },
  
  calculateMinimumBudget: (trip: Trip, dest: any): number => {
    if (!dest?.pricing?.minimum_daily_budget_per_person) return 0;
    return Number(dest.pricing.minimum_daily_budget_per_person) * (trip.travellers || 1) * (trip.days || 1);
  }
};
