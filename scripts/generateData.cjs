const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'src', 'data');

// 1. DESTINATIONS
const destinations = [
  {
    id: 'd1', slug: 'kullu', name: 'Kullu', state: 'Himachal Pradesh', country: 'India',
    rating: 4.8, reviews: 1240, recommendedDays: 4, dailyBudget: 2500, minimumBudget: 7000, localTravelCost: 500,
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Beas_Valley_-_Palchan_-_Kullu_2014-05-10_2275.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    description: 'Perfect for nature, mountains and slow travel. Known as the Valley of Gods.',
    bestSeason: 'March to June', difficulty: 'Easy', categories: ['Mountains', 'Nature', 'Adventure']
  },
  {
    id: 'd2', slug: 'manali', name: 'Manali', state: 'Himachal Pradesh', country: 'India',
    rating: 4.7, reviews: 3100, recommendedDays: 5, dailyBudget: 3500, minimumBudget: 8000, localTravelCost: 600,
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Manali_City.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    description: 'High-altitude Himalayan resort town, famous for backpacking and honeymooning.',
    bestSeason: 'October to February', difficulty: 'Easy', categories: ['Mountains', 'Adventure', 'Nature']
  },
  {
    id: 'd3', slug: 'goa', name: 'Goa', state: 'Goa', country: 'India',
    rating: 4.9, reviews: 8500, recommendedDays: 5, dailyBudget: 4000, minimumBudget: 12000, localTravelCost: 800,
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/BeachFun.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    description: 'Famous for its pristine beaches, vibrant nightlife, and Portuguese heritage.',
    bestSeason: 'November to February', difficulty: 'Easy', categories: ['Beaches', 'Relaxation', 'Heritage']
  },
  {
    id: 'd4', slug: 'jaipur', name: 'Jaipur', state: 'Rajasthan', country: 'India',
    rating: 4.8, reviews: 5200, recommendedDays: 3, dailyBudget: 3000, minimumBudget: 8000, localTravelCost: 500,
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    description: 'The Pink City, known for its royal palaces, forts, and vibrant markets.',
    bestSeason: 'October to March', difficulty: 'Easy', categories: ['Heritage', 'Food', 'Culture']
  },
  {
    id: 'd5', slug: 'agra', name: 'Agra', state: 'Uttar Pradesh', country: 'India',
    rating: 4.6, reviews: 12000, recommendedDays: 2, dailyBudget: 2000, minimumBudget: 5000, localTravelCost: 400,
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Taj_Mahal%2C_Agra%2C_India.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    description: 'Home to the iconic Taj Mahal, a masterpiece of Mughal architecture.',
    bestSeason: 'October to March', difficulty: 'Easy', categories: ['Heritage', 'Culture', 'Architecture']
  },
  {
    id: 'd6', slug: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', country: 'India',
    rating: 4.7, reviews: 8000, recommendedDays: 3, dailyBudget: 1500, minimumBudget: 4500, localTravelCost: 300,
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Varanasi%2C_India%2C_Ghats%2C_Cremation_ceremony_in_progress.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    description: 'Spiritual capital of India, known for its ghats on the Ganges river.',
    bestSeason: 'October to March', difficulty: 'Easy', categories: ['Spiritual', 'Culture', 'Heritage']
  },
  {
    id: 'd7', slug: 'munnar', name: 'Munnar', state: 'Kerala', country: 'India',
    rating: 4.8, reviews: 6500, recommendedDays: 4, dailyBudget: 2800, minimumBudget: 8500, localTravelCost: 600,
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Munnar_Overview.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    description: 'Famous for its tea estates, exotic lush greenery and craggy peaks.',
    bestSeason: 'September to March', difficulty: 'Easy', categories: ['Nature', 'Mountains', 'Relaxation']
  },
  {
    id: 'd8', slug: 'udaipur', name: 'Udaipur', state: 'Rajasthan', country: 'India',
    rating: 4.9, reviews: 7200, recommendedDays: 3, dailyBudget: 3500, minimumBudget: 9000, localTravelCost: 550,
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Evening_view%2C_City_Palace%2C_Udaipur.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    description: 'The City of Lakes, known for its lavish royal residences.',
    bestSeason: 'September to March', difficulty: 'Easy', categories: ['Heritage', 'Romantic', 'Culture']
  },
  {
    id: 'd9', slug: 'rishikesh', name: 'Rishikesh', state: 'Uttarakhand', country: 'India',
    rating: 4.8, reviews: 5500, recommendedDays: 4, dailyBudget: 2200, minimumBudget: 6000, localTravelCost: 400,
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/74/Trayambakeshwar_Temple_VK.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    description: 'Yoga capital of the world and gateway to the Garhwal Himalayas.',
    bestSeason: 'September to June', difficulty: 'Moderate', categories: ['Spiritual', 'Adventure', 'Nature']
  },
  {
    id: 'd10', slug: 'darjeeling', name: 'Darjeeling', state: 'West Bengal', country: 'India',
    rating: 4.7, reviews: 4800, recommendedDays: 4, dailyBudget: 2500, minimumBudget: 7500, localTravelCost: 450,
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/96/DarjeelingTrainFruitshop_%282%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    description: 'Known for tea industry and the spectacular views of Kangchenjunga.',
    bestSeason: 'April to June', difficulty: 'Easy', categories: ['Mountains', 'Nature', 'Relaxation']
  },
  {
    id: 'd11', slug: 'hampi', name: 'Hampi', state: 'Karnataka', country: 'India',
    rating: 4.9, reviews: 3200, recommendedDays: 3, dailyBudget: 1800, minimumBudget: 5000, localTravelCost: 350,
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    description: 'An ancient village with numerous ruined temple complexes.',
    bestSeason: 'October to February', difficulty: 'Easy', categories: ['Heritage', 'History', 'Culture']
  },
  {
    id: 'd12', slug: 'andaman', name: 'Andaman Islands', state: 'Andaman & Nicobar', country: 'India',
    rating: 4.9, reviews: 4500, recommendedDays: 6, dailyBudget: 5000, minimumBudget: 20000, localTravelCost: 1000,
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/The_Coral_Reef_at_the_Andaman_Islands.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
    description: 'Known for their palm-lined, white-sand beaches, mangroves and tropical rainforests.',
    bestSeason: 'October to May', difficulty: 'Easy', categories: ['Beaches', 'Adventure', 'Relaxation']
  }
];

// 2. PLACES
const placeNames = {
  'd1': ['Raghunath Temple', 'Great Himalayan National Park', 'Manikaran Sahib', 'Kasol', 'Naggar Castle'],
  'd2': ['Solang Valley', 'Rohtang Pass', 'Hadimba Temple', 'Old Manali', 'Mall Road'],
  'd3': ['Baga Beach', 'Calangute Beach', 'Fort Aguada', 'Basilica of Bom Jesus', 'Dudhsagar Falls'],
  'd4': ['Amber Fort', 'Hawa Mahal', 'City Palace', 'Jantar Mantar', 'Albert Hall Museum'],
  'd5': ['Taj Mahal', 'Agra Fort', 'Fatehpur Sikri', 'Mehtab Bagh', 'Tomb of Itimad-ud-Daulah'],
  'd6': ['Dashashwamedh Ghat', 'Kashi Vishwanath Temple', 'Sarnath', 'Assi Ghat', 'Manikarnika Ghat'],
  'd7': ['Eravikulam National Park', 'Mattupetty Dam', 'Tea Museum', 'Anamudi Peak', 'Echo Point'],
  'd8': ['City Palace', 'Lake Pichola', 'Jag Mandir', 'Saheliyon Ki Bari', 'Monsoon Palace'],
  'd9': ['Laxman Jhula', 'Triveni Ghat', 'Parmarth Niketan', 'Beatles Ashram', 'Neelkanth Mahadev'],
  'd10': ['Tiger Hill', 'Batasia Loop', 'Padmaja Naidu Zoo', 'Peace Pagoda', 'Tea Garden'],
  'd11': ['Virupaksha Temple', 'Vittala Temple', 'Matanga Hill', 'Elephant Stables', 'Lotus Mahal'],
  'd12': ['Radhanagar Beach', 'Cellular Jail', 'Ross Island', 'Elephant Beach', 'Baratang Island']
};

const placeImages = [
  'https://images.unsplash.com/photo-1544669651-77b3191ebcb4?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1598890777032-bdeef3e46c00?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1592663486333-f7f1a91361db?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1510258169128-dbd0870ba087?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1565026938953-eb8ce48c3b53?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1621213076161-53696eb0c2a7?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1627914093952-475225d30bc2?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582510003544-4d00b7f7415e?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1601004169542-f28ea330a133?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1620023425049-3bc7bfec57e3?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580910406859-9945df84b80b?auto=format&fit=crop&q=80'
];

const places = [];
let placeIdCounter = 1;
for (const dest of destinations) {
  const names = placeNames[dest.id];
  for (let i=0; i<5; i++) {
    const rawRating = 4.0 + Math.random();
    places.push({
      id: "p" + placeIdCounter++,
      destinationId: dest.id,
      name: names[i],
      rating: parseFloat(rawRating.toFixed(1)),
      category: ['Nature', 'Heritage', 'Adventure', 'Relaxation'][Math.floor(Math.random()*4)],
      recommendedTimeHours: Math.floor(Math.random() * 3) + 2,
      entryFee: Math.random() > 0.3 ? Math.floor(Math.random() * 500) + 50 : 0,
      distance: Math.floor(Math.random() * 15) + 1 + " km from center",
      image: placeImages[Math.floor(Math.random() * placeImages.length)],
      description: "A wonderful place to visit in " + dest.name + "."
    });
  }
}

// 3. ACCOMMODATIONS
const accImages = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40eb0d1b73?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542314831-c6a4d14db041?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80'
];

const accommodations = [];
let accIdCounter = 1;
for (const dest of destinations) {
  const types = ['Budget', 'Balanced', 'Premium'];
  const prices = [
    Math.floor(Math.random() * 1000) + 800,   // Budget: 800-1800
    Math.floor(Math.random() * 2000) + 2000,  // Balanced: 2000-4000
    Math.floor(Math.random() * 5000) + 5000   // Premium: 5000-10000
  ];
  for (let i=0; i<3; i++) {
    const rawRating = 3.5 + (i * 0.5) + (Math.random() * 0.5);
    accommodations.push({
      id: "a" + accIdCounter++,
      destinationId: dest.id,
      name: dest.name + " " + types[i] + " Stay",
      rating: parseFloat(rawRating.toFixed(1)),
      pricePerNight: prices[i],
      distanceFromCenter: Math.floor(Math.random() * 10) + 1 + " km from center",
      amenities: ['WiFi', 'Parking', i > 0 ? 'Breakfast' : 'Kitchen'].filter(Boolean),
      type: types[i] === 'Premium' ? 'Resort' : types[i] === 'Balanced' ? 'Hotel' : 'Hostel',
      image: accImages[Math.floor(Math.random() * accImages.length)]
    });
  }
}

// 4. TRANSPORT
const origins = ['Delhi', 'Mumbai', 'Bengaluru', 'Chandigarh'];
const routes = [];
let transIdCounter = 1;

for (const origin of origins) {
  for (const dest of destinations) {
    // Generate 3 mock options for each origin-destination pair
    const distanceMultiplier = (origin === dest.name) ? 0.1 : (Math.random() * 2 + 1); // rough proxy
    
    routes.push({
      origin: origin,
      destinationId: dest.id,
      options: [
        {
          id: "t" + transIdCounter++,
          mode: 'Bus',
          price: Math.floor(1000 * distanceMultiplier),
          pricingType: 'per_person',
          duration: Math.floor(8 * distanceMultiplier) + "h",
          comfort: 'Basic',
          recommended: true
        },
        {
          id: "t" + transIdCounter++,
          mode: 'Train',
          price: Math.floor(1500 * distanceMultiplier),
          pricingType: 'per_person',
          duration: Math.floor(10 * distanceMultiplier) + "h",
          comfort: 'Comfortable',
          recommended: false
        },
        {
          id: "t" + transIdCounter++,
          mode: 'Flight / Cab',
          price: Math.floor(6000 * distanceMultiplier),
          pricingType: 'fixed', // Cab is fixed total, flight is normally per person, but let's mix it up
          duration: Math.floor(2 * distanceMultiplier) + "h",
          comfort: 'Premium',
          recommended: false
        }
      ]
    });
  }
}

// Write to files
fs.writeFileSync(path.join(dataDir, 'destinations.ts'), 
  "import { Destination } from '../types';\n\nexport const mockDestinations: Destination[] = " + JSON.stringify(destinations, null, 2) + ";\n"
);

fs.writeFileSync(path.join(dataDir, 'places.ts'), 
  "import { Place } from '../types';\n\nexport const mockPlaces: Place[] = " + JSON.stringify(places, null, 2) + ";\n"
);

fs.writeFileSync(path.join(dataDir, 'accommodations.ts'), 
  "import { Accommodation } from '../types';\n\nexport const mockAccommodations: Accommodation[] = " + JSON.stringify(accommodations, null, 2) + ";\n"
);

fs.writeFileSync(path.join(dataDir, 'transport.ts'), 
  "import { RouteTransport } from '../types';\n\nexport const mockRoutes: RouteTransport[] = " + JSON.stringify(routes, null, 2) + ";\n"
);

console.log('Data generation complete!');
