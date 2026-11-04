import { Trip, User } from '../types';

const TRIPS_KEY = 'tripwise_trips';
const SAVED_PLACES_KEY = 'tripwise_saved_places';

export const storageService = {
  getTrips: (): Trip[] => {
    const data = localStorage.getItem(TRIPS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveTrips: (trips: Trip[]): void => {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  },

  getTrip: (id: string | number): Trip | undefined => {
    const strId = String(id);
    const trips = storageService.getTrips();
    return trips.find(t => String(t.id) === strId);
  },

  createTrip: (trip: Trip): void => {
    const trips = storageService.getTrips();
    trips.push(trip);
    storageService.saveTrips(trips);
  },

  updateTrip: (id: string | number, updates: Partial<Trip>): Trip | undefined => {
    const strId = String(id);
    const trips = storageService.getTrips();
    const index = trips.findIndex(t => String(t.id) === strId);
    if (index !== -1) {
      trips[index] = { ...trips[index], ...updates, updatedAt: Date.now() };
      storageService.saveTrips(trips);
      return trips[index];
    }
    return undefined;
  },

  deleteTrip: (id: string | number): void => {
    const strId = String(id);
    let trips = storageService.getTrips();
    trips = trips.filter(t => String(t.id) !== strId);
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
