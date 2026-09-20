import { Activity } from '../types';

export const mockActivities: Activity[] = [
  {
    id: 'act1',
    name: 'River Rafting',
    category: 'Adventure',
    estimatedCost: 1500,
    duration: '2h',
    description: 'Experience the thrill of river rafting in the Beas river.'
  },
  {
    id: 'act2',
    name: 'Paragliding',
    category: 'Adventure',
    estimatedCost: 3000,
    duration: '1h',
    description: 'Fly over the beautiful valleys and enjoy breathtaking views.'
  },
  {
    id: 'act3',
    name: 'Trekking',
    category: 'Nature',
    estimatedCost: 500,
    duration: '4h',
    description: 'Guided trek through pine forests to a hidden waterfall.'
  },
  {
    id: 'act4',
    name: 'Local Sightseeing Tour',
    category: 'Sightseeing',
    estimatedCost: 1200,
    duration: '6h',
    description: 'Visit major temples, markets, and historical spots.'
  }
];
