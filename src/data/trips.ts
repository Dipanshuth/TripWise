import { Trip } from '../types';

export const mockTrips: Trip[] = [
  {
    id: 'trip1',
    status: 'Saved',
    destinationId: 'd1', // Kullu
    source: 'Delhi',
    days: 4,
    travellers: 2,
    travelStyle: 'Balanced',
    budget: 15000,
    accommodationId: 'h1',
    transportId: 't1',
    places: ['p1', 'p2'],
    expenses: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    itinerary: [
      {
        dayNumber: 1,
        title: 'Arrival & Local Exploration',
        activities: [
          {
            id: 'a1',
            time: '08:00',
            title: 'Arrive in Kullu',
            duration: '30m',
            cost: 0
          },
          {
            id: 'a2',
            time: '09:30',
            title: 'Hotel check-in',
            duration: '1h',
            cost: 0
          },
          {
            id: 'a3',
            time: '11:00',
            title: 'Visit Raghunath Temple',
            duration: '1h 30m',
            cost: 0,
            image: 'https://assets.indiaonline.in/cg/Kullu/City-Guide/raghunathji-dussehra.jpg',
            placeId: 'p1'
          },
          {
            id: 'a4',
            time: '13:00',
            title: 'Lunch',
            duration: '1h',
            cost: 800
          },
          {
            id: 'a5',
            time: '15:00',
            title: 'Explore local market',
            duration: '2h',
            cost: 500
          },
          {
            id: 'a6',
            time: '18:00',
            title: 'Sunset viewpoint',
            duration: '1h',
            cost: 0
          }
        ]
      }
    ]
  }
];
