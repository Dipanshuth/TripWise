import { Trip, ItineraryDay, ItineraryActivity } from '../types';
import { mockPlaces } from '../data/places';

export function regenerateItinerary(trip: Trip, contextPlaces?: any[]): ItineraryDay[] {
  const days = trip.days;
  const itinerary: ItineraryDay[] = [];
  
  // We distribute places across days. Max ~2-3 places a day to not exceed 6-8 hours.
  const allPlaces = trip.places.map(pId => {
    const pIdStr = String(pId);
    if (contextPlaces) {
      return contextPlaces.find(p => String(p.id) === pIdStr) || mockPlaces.find(p => String(p.id) === pIdStr);
    }
    return mockPlaces.find(p => String(p.id) === pIdStr);
  }).filter(Boolean) as any[];
  
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
      const timeHours = place.recommendedTimeHours || 2;
      const fee = place.entryFee || place.entry_fee || 0;
      dayActivities.push({
        id: `act-${place.id}`,
        time: `${10 + hoursSpent}:00 AM`, // dummy time
        title: `Visit ${place.name}`,
        duration: `${timeHours}h`,
        cost: Number(fee),
        image: place.image_url || place.image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&q=80',
        placeId: place.id
      });
      hoursSpent += timeHours;
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
    const timeHours = place.recommendedTimeHours || 2;
    const fee = place.entryFee || place.entry_fee || 0;
    itinerary[itinerary.length - 1].activities.splice(-1, 0, {
      id: `act-${place.id}`,
      time: `Flexible`,
      title: `Visit ${place.name}`,
      duration: `${timeHours}h`,
      cost: Number(fee),
      image: place.image_url || place.image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&q=80',
      placeId: place.id
    });
    placeIndex++;
  }

  return itinerary;
}
