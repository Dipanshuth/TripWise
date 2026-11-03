import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Trip, Expense, Discount } from '../types';
import { storageService } from '../services/storageService';
import { regenerateItinerary } from '../utils/itineraryHelper';
import { mockPlaces } from '../data/places';

interface TripContextType {
  trips: Trip[];
  savedPlaces: string[];
  createTrip: (trip: Trip) => void;
  updateTrip: (id: string | number, updates: Partial<Trip>, contextPlaces?: any[]) => void;
  deleteTrip: (id: string | number) => void;
  duplicateTrip: (id: string | number) => void;
  toggleSavedPlace: (placeId: string | number) => void;
  addPlaceToTrip: (tripId: string | number, placeId: string | number, contextPlaces?: any[]) => void;
  removePlaceFromTrip: (tripId: string | number, placeId: string | number, contextPlaces?: any[]) => void;
  applyDiscount: (tripId: string | number, discount: Discount) => void;
  removeDiscount: (tripId: string | number) => void;
  addExpense: (tripId: string | number, expense: Expense) => void;
  removeExpense: (tripId: string | number, expenseId: string) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<string[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const loadedTrips = storageService.getTrips();
    const loadedPlaces = storageService.getSavedPlaces();
    
    // If no trips exist in localStorage and not initialized, initialize with mock trips
    const isInitialized = localStorage.getItem('tripwise_initialized');
    if (loadedTrips.length === 0 && !isInitialized) {
      import('../data/trips').then(({ mockTrips }) => {
        setTrips(mockTrips);
        storageService.saveTrips(mockTrips);
        localStorage.setItem('tripwise_initialized', 'true');
      });
    } else {
      if (!isInitialized) localStorage.setItem('tripwise_initialized', 'true');
      setTrips(loadedTrips);
    }
    
    setSavedPlaces(loadedPlaces);
  }, []);

  const createTrip = (trip: Trip) => {
    storageService.createTrip(trip);
    setTrips(storageService.getTrips());
  };

  const updateTrip = (id: string | number, updates: Partial<Trip>, contextPlaces?: any[]) => {
    const strId = String(id);
    let finalUpdates = { ...updates };
    const existingTrip = trips.find(t => String(t.id) === strId);
    
    if (existingTrip && (updates.places !== undefined || updates.days !== undefined)) {
      const draftTrip = { ...existingTrip, ...updates };
      finalUpdates.itinerary = regenerateItinerary(draftTrip, contextPlaces);
    }
    
    storageService.updateTrip(strId, finalUpdates);
    setTrips(storageService.getTrips());
  };

  const deleteTrip = (id: string | number) => {
    storageService.deleteTrip(String(id));
    setTrips(storageService.getTrips());
  };

  const duplicateTrip = (id: string | number) => {
    const strId = String(id);
    const tripToDuplicate = trips.find(t => String(t.id) === strId);
    if (tripToDuplicate) {
      const newTrip: Trip = {
        ...tripToDuplicate,
        id: `trip-${Date.now()}`,
        source: `${tripToDuplicate.source} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      createTrip(newTrip);
    }
  };

  const toggleSavedPlace = (placeId: string | number) => {
    const strPlaceId = String(placeId);
    if (savedPlaces.includes(strPlaceId)) {
      storageService.removeSavedPlace(strPlaceId);
    } else {
      storageService.savePlace(strPlaceId);
    }
    setSavedPlaces(storageService.getSavedPlaces());
  };

  const addPlaceToTrip = (tripId: string | number, placeId: string | number, contextPlaces?: any[]) => {
    const strTripId = String(tripId);
    const strPlaceId = String(placeId);
    const trip = trips.find(t => String(t.id) === strTripId);
    if (trip && !trip.places.map(String).includes(strPlaceId)) {
      updateTrip(strTripId, { places: [...trip.places, strPlaceId] }, contextPlaces);
    }
  };

  const removePlaceFromTrip = (tripId: string | number, placeId: string | number, contextPlaces?: any[]) => {
    const strTripId = String(tripId);
    const strPlaceId = String(placeId);
    const trip = trips.find(t => String(t.id) === strTripId);
    if (trip) {
      updateTrip(strTripId, { places: trip.places.filter(id => String(id) !== strPlaceId) }, contextPlaces);
    }
  };

  const applyDiscount = (tripId: string | number, discount: Discount) => {
    updateTrip(String(tripId), { discount });
  };

  const removeDiscount = (tripId: string | number) => {
    updateTrip(String(tripId), { discount: undefined });
  };

  const addExpense = (tripId: string | number, expense: Expense) => {
    const strTripId = String(tripId);
    const trip = trips.find(t => String(t.id) === strTripId);
    if (trip) {
      updateTrip(strTripId, { expenses: [...(trip.expenses || []), expense] });
    }
  };

  const removeExpense = (tripId: string | number, expenseId: string) => {
    const strTripId = String(tripId);
    const trip = trips.find(t => String(t.id) === strTripId);
    if (trip) {
      updateTrip(strTripId, { expenses: (trip.expenses || []).filter(e => e.id !== expenseId) });
    }
  };

  return (
    <TripContext.Provider value={{
      trips,
      savedPlaces,
      createTrip,
      updateTrip,
      deleteTrip,
      duplicateTrip,
      toggleSavedPlace,
      addPlaceToTrip,
      removePlaceFromTrip,
      applyDiscount,
      removeDiscount,
      addExpense,
      removeExpense
    }}>
      {children}
    </TripContext.Provider>
  );
}

export const useTrips = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
};
