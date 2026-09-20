import { Trip, ItineraryDay, ItineraryActivity } from '../types';
import { mockPlaces } from '../data/places';

export function regenerateItinerary(trip: Trip): ItineraryDay[] {
  const days = trip.days;
  const itinerary: ItineraryDay[] = [];
  
  // We distribute places across days. Max ~2-3 places a day to not exceed 6-8 hours.
  const allPlaces = trip.places.map(pId => mockPlaces.find(p => p.id === pId)).filter(Boolean) as typeof mockPlaces;
  
  let placeIndex = 0;

  for (let i = 1; i <= days; i++) {
    const dayActivities: ItineraryActivity[] = [];
    let hoursSpent = 0;

    // First day is arrival
    if (i === 1) {
      dayActivities.push({
        id: `arr-${i}`,
        time: '10:00 AM',
        title: 'Arrival & Check-in',
        duration: '2h',
        cost: 0
      });
      hoursSpent += 2;
    }

    // Add places until we hit ~6 hours or run out of places
    while (placeIndex < allPlaces.length && hoursSpent < 6) {
      const place = allPlaces[placeIndex];
      dayActivities.push({
        id: `act-${place.id}`,
        time: `${10 + hoursSpent}:00 AM`, // dummy time
        title: `Visit ${place.name}`,
        duration: `${place.recommendedTimeHours}h`,
        cost: place.entryFee,
        image: place.image,
        placeId: place.id
      });
      hoursSpent += place.recommendedTimeHours;
      placeIndex++;
    }

    // Last day is departure
    if (i === days) {
      dayActivities.push({
        id: `dep-${i}`,
        time: '04:00 PM',
        title: 'Departure',
        duration: '2h',
        cost: 0
      });
    }

    itinerary.push({
      dayNumber: i,
      title: i === 1 ? 'Arrival' : i === days ? 'Departure' : `Exploration Day ${i}`,
      activities: dayActivities
    });
  }

  // If there are leftover places, just shove them in the last day for now
  while (placeIndex < allPlaces.length) {
    const place = allPlaces[placeIndex];
    itinerary[itinerary.length - 1].activities.splice(-1, 0, {
      id: `act-${place.id}`,
      time: `Flexible`,
      title: `Visit ${place.name}`,
      duration: `${place.recommendedTimeHours}h`,
      cost: place.entryFee,
      image: place.image,
      placeId: place.id
    });
    placeIndex++;
  }

  return itinerary;
}
