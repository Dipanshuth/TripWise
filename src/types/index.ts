export type TravelStyle = 'Budget' | 'Balanced' | 'Comfort' | 'Premium';

export interface Destination {
  id: string;
  slug: string;
  name: string;
  state: string;
  country: string;
  rating: number;
  reviews: number;
  recommendedDays: number;
  dailyBudget: number;
  minimumBudget: number;
  localTravelCost: number;
  image: string;
  description: string;
  bestSeason: string;
  difficulty: string;
  categories: string[];
}

export interface Place {
  id: string;
  destinationId: string;
  name: string;
  rating: number;
  category: string;
  recommendedTimeHours: number;
  entryFee: number;
  distance: string;
  image: string;
  description?: string;
}

export interface Accommodation {
  id: string;
  destinationId: string;
  name: string;
  rating: number;
  pricePerNight: number;
  distanceFromCenter: string;
  amenities: string[];
  type: string;
  image: string;
}

export interface TransportOption {
  id: string;
  mode: string;
  price: number;
  pricingType: 'per_person' | 'fixed';
  duration: string;
  comfort: string;
  recommended: boolean;
}

export interface RouteTransport {
  origin: string;
  destinationId: string;
  options: TransportOption[];
}

export interface Activity {
  id: string;
  name: string;
  category: string;
  estimatedCost: number;
  duration: string;
  description: string;
}

export interface ItineraryActivity {
  id: string;
  time: string;
  title: string;
  duration: string;
  cost: number;
  image?: string;
  placeId?: string;
  activityId?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  activities: ItineraryActivity[];
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
}

export interface Discount {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface Trip {
  id: string;
  status: 'Draft' | 'Saved';
  destinationId: string;
  source: string;
  days: number;
  travellers: number;
  travelStyle: TravelStyle;
  budget: number;
  accommodationId?: string;
  transportId?: string;
  places: string[]; // array of Place IDs
  expenses: Expense[];
  discount?: Discount;
  itinerary: ItineraryDay[];
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  preferences: {
    budgetStyle: TravelStyle;
    preferredLength: number;
    favouriteTypes: string[];
  };
}
