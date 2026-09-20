import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Trip, Expense, Discount } from '../types';
import { storageService } from '../services/storageService';
import { regenerateItinerary } from '../utils/itineraryHelper';
import { mockPlaces } from '../data/places';

interface TripContextType {
  trips: Trip[];
  savedPlaces: string[];
  createTrip: (trip: Trip) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  duplicateTrip: (id: string) => void;
  toggleSavedPlace: (placeId: string) => void;
  addPlaceToTrip: (tripId: string, placeId: string) => void;
  removePlaceFromTrip: (tripId: string, placeId: string) => void;
  applyDiscount: (tripId: string, discount: Discount) => void;
  removeDiscount: (tripId: string) => void;
  addExpense: (tripId: string, expense: Expense) => void;
  removeExpense: (tripId: string, expenseId: string) => void;
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

  const updateTrip = (id: string, updates: Partial<Trip>) => {
    let finalUpdates = { ...updates };
    const existingTrip = trips.find(t => t.id === id);
    
    if (existingTrip && (updates.places !== undefined || updates.days !== undefined)) {
      const draftTrip = { ...existingTrip, ...updates };
      finalUpdates.itinerary = regenerateItinerary(draftTrip);
    }
    
    storageService.updateTrip(id, finalUpdates);
    setTrips(storageService.getTrips());
  };

  const deleteTrip = (id: string) => {
    storageService.deleteTrip(id);
    setTrips(storageService.getTrips());
  };

  const duplicateTrip = (id: string) => {
    const tripToDuplicate = trips.find(t => t.id === id);
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

  const toggleSavedPlace = (placeId: string) => {
    if (savedPlaces.includes(placeId)) {
      storageService.removeSavedPlace(placeId);
    } else {
      storageService.savePlace(placeId);
    }
    setSavedPlaces(storageService.getSavedPlaces());
  };

  const addPlaceToTrip = (tripId: string, placeId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (trip && !trip.places.includes(placeId)) {
      const place = mockPlaces.find(p => p.id === placeId);
      if (place && place.destinationId === trip.destinationId) {
        updateTrip(tripId, { places: [...trip.places, placeId] });
      } else {
        console.error("Place destination does not match trip destination.");
      }
    }
  };

  const removePlaceFromTrip = (tripId: string, placeId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      updateTrip(tripId, { places: trip.places.filter(id => id !== placeId) });
    }
  };

  const applyDiscount = (tripId: string, discount: Discount) => {
    updateTrip(tripId, { discount });
  };

  const removeDiscount = (tripId: string) => {
    updateTrip(tripId, { discount: undefined });
  };

  const addExpense = (tripId: string, expense: Expense) => {
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      updateTrip(tripId, { expenses: [...trip.expenses, expense] });
    }
  };

  const removeExpense = (tripId: string, expenseId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      updateTrip(tripId, { expenses: trip.expenses.filter(e => e.id !== expenseId) });
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
