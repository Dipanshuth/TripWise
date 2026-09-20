import { Trip } from '../types';
import { mockAccommodations } from '../data/accommodations';
import { mockRoutes } from '../data/transport';
import { mockDestinations } from '../data/destinations';
import { mockPlaces } from '../data/places';

export interface TripSummary {
  transportation: number;
  accommodation: number;
  food: number;
  activities: number;
  localTravel: number;
  customExpenses: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  perPerson: number;
  perDay: number;
}

export const budgetService = {
  calculateTripTotal: (trip: Trip): TripSummary => {
    const dest = mockDestinations.find(d => d.id === trip.destinationId);

    // 1. Transportation
    let transportation = 0;
    if (trip.transportId) {
      const route = mockRoutes.find(r => r.origin.toLowerCase() === trip.source.toLowerCase() && r.destinationId === trip.destinationId);
      if (route) {
        const transport = route.options.find(t => t.id === trip.transportId);
        if (transport) {
          if (transport.pricingType === 'per_person') {
            transportation = transport.price * trip.travellers;
          } else {
            transportation = transport.price;
          }
        }
      }
    }

    // 2. Accommodation
    let accommodation = 0;
    if (trip.accommodationId) {
      const acc = mockAccommodations.find(a => a.id === trip.accommodationId);
      if (acc) {
        // Price per night * number of nights (days - 1, assuming min 1 night)
        const nights = Math.max(1, trip.days - 1);
        accommodation = acc.pricePerNight * nights;
      }
    }

    // 3. Food
    let dailyFoodCost = 600; // default
    if (dest) {
      // derive base food cost from dest.dailyBudget (approx 20%)
      const baseFood = dest.dailyBudget * 0.2;
      switch (trip.travelStyle) {
        case 'Budget': dailyFoodCost = baseFood * 0.6; break;
        case 'Balanced': dailyFoodCost = baseFood; break;
        case 'Comfort': dailyFoodCost = baseFood * 1.5; break;
        case 'Premium': dailyFoodCost = baseFood * 2.5; break;
      }
    }
    const food = dailyFoodCost * trip.travellers * trip.days;

    // 4. Local Travel
    let dailyLocalTravel = 500;
    if (dest) {
      dailyLocalTravel = dest.localTravelCost;
      switch (trip.travelStyle) {
        case 'Budget': dailyLocalTravel *= 0.6; break;
        case 'Balanced': dailyLocalTravel *= 1; break;
        case 'Comfort': dailyLocalTravel *= 1.5; break;
        case 'Premium': dailyLocalTravel *= 2; break;
      }
    }
    const localTravel = dailyLocalTravel * trip.days;

    // 5. Activities (from trip.places array instead of raw itinerary, to be accurate)
    let activities = 0;
    trip.places.forEach(placeId => {
      const p = mockPlaces.find(pl => pl.id === placeId);
      if (p) {
        activities += (p.entryFee * trip.travellers);
      }
    });

    // 6. Custom Expenses
    let customExpenses = 0;
    trip.expenses.forEach(exp => {
      customExpenses += exp.amount;
    });

    const subtotal = transportation + accommodation + food + activities + localTravel + customExpenses;

    // 7. Discount
    let discountAmount = 0;
    if (trip.discount) {
      if (trip.discount.type === 'percentage') {
        discountAmount = subtotal * (trip.discount.value / 100);
      } else {
        discountAmount = trip.discount.value;
      }
    }

    const total = Math.max(0, subtotal - discountAmount);
    const perPerson = trip.travellers > 0 ? total / trip.travellers : 0;
    const perDay = trip.days > 0 ? total / trip.days : 0;

    return {
      transportation,
      accommodation,
      food,
      activities,
      localTravel,
      customExpenses,
      subtotal,
      discountAmount,
      total,
      perPerson: Math.round(perPerson),
      perDay: Math.round(perDay)
    };
  },

  calculateMinimumBudget: (trip: Pick<Trip, 'source' | 'destinationId' | 'days' | 'travellers'>): number => {
    const dest = mockDestinations.find(d => d.id === trip.destinationId);
    if (!dest) return 0;

    let baseMin = dest.minimumBudget * trip.travellers;
    
    // adjust slightly by days vs recommendedDays
    const daysRatio = trip.days / dest.recommendedDays;
    
    return Math.round(baseMin * daysRatio);
  }
};
