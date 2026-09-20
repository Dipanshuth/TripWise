import { Trip, Place, User } from '../types';

const TRIPS_KEY = 'tripwise_trips';
const SAVED_PLACES_KEY = 'tripwise_saved_places';
const USER_PREF_KEY = 'tripwise_preferences';

export const storageService = {
  getTrips: (): Trip[] => {
    const data = localStorage.getItem(TRIPS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveTrips: (trips: Trip[]): void => {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  },

  getTrip: (id: string): Trip | undefined => {
    const trips = storageService.getTrips();
    return trips.find(t => t.id === id);
  },

  createTrip: (trip: Trip): void => {
    const trips = storageService.getTrips();
    trips.push(trip);
    storageService.saveTrips(trips);
  },

  updateTrip: (id: string, updates: Partial<Trip>): Trip | undefined => {
    const trips = storageService.getTrips();
    const index = trips.findIndex(t => t.id === id);
    if (index !== -1) {
      trips[index] = { ...trips[index], ...updates, updatedAt: Date.now() };
      storageService.saveTrips(trips);
      return trips[index];
    }
    return undefined;
  },

  deleteTrip: (id: string): void => {
    let trips = storageService.getTrips();
    trips = trips.filter(t => t.id !== id);
    storageService.saveTrips(trips);
  },

  getSavedPlaces: (): string[] => {
    const data = localStorage.getItem(SAVED_PLACES_KEY);
    return data ? JSON.parse(data) : [];
  },

  savePlace: (placeId: string): void => {
    const places = storageService.getSavedPlaces();
    if (!places.includes(placeId)) {
      places.push(placeId);
      localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(places));
    }
  },

  removeSavedPlace: (placeId: string): void => {
    let places = storageService.getSavedPlaces();
    places = places.filter(id => id !== placeId);
    localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(places));
  },
  
  getUserProfile: (): User | null => {
    const data = localStorage.getItem('tripwise_profile');
    return data ? JSON.parse(data) : null;
  },
  
  saveUserProfile: (user: User): void => {
    localStorage.setItem('tripwise_profile', JSON.stringify(user));
  }
};
