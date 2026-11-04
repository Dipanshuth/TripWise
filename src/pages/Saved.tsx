import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { mockDestinations } from '@/data/destinations';
import { mockPlaces } from '@/data/places';
import { mockAccommodations } from '@/data/accommodations';
import { useTrips } from '@/context/TripContext';
import { useToast } from '@/context/ToastContext';

export function Saved() {
  const navigate = useNavigate();
  const { savedPlaces, toggleSavedPlace } = useTrips();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('destinations');

  // We find matches across destinations, places, and accommodations
  const savedDests = mockDestinations.filter(d => savedPlaces.includes(d.id));
  const savedPlc = mockPlaces.filter(p => savedPlaces.includes(p.id));
  const savedAcc = mockAccommodations.filter(a => savedPlaces.includes(a.id));

  const items = activeTab === 'destinations' ? savedDests :
                activeTab === 'places' ? savedPlc :
                activeTab === 'accommodations' ? savedAcc : [];

  const handleRemove = (id: string) => {
    toggleSavedPlace(id);
    toast('Removed from saved', 'info');
  };

  return (
    <div className="pt-24 px-4 max-w-7xl mx-auto pb-20 min-h-screen">
      <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-8">My Saved Items</h1>

      <div className="flex border-b border-gray-100 dark:border-gray-800 mb-8 overflow-x-auto hide-scrollbar">
        {['destinations', 'places', 'accommodations'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 capitalize whitespace-nowrap ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted dark:text-gray-400 hover:text-charcoal dark:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-xl text-muted mb-6">No saved {activeTab} yet.</p>
          <Button onClick={() => navigate('/explore')}>Explore {activeTab}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map(item => (
            <div key={item.id} className="group relative rounded-2xl overflow-hidden shadow-soft border border-gray-100 dark:border-gray-800">
              <div className="relative h-64 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                <button 
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full text-red-500 shadow-sm"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800">
                <h3 className="font-bold text-lg text-charcoal dark:text-white line-clamp-1">{item.name}</h3>
                {'state' in item && <p className="text-sm text-muted dark:text-gray-400 mb-4">{item.state}</p>}
                {'distance' in item && <p className="text-sm text-muted dark:text-gray-400 mb-4">{item.distance}</p>}
                {'pricePerNight' in item && <p className="text-sm text-muted dark:text-gray-400 mb-4">₹{item.pricePerNight}/night</p>}
                
                <Button 
                  variant="outline" 
                  className="w-full text-sm h-10 mt-2" 
                  onClick={() => 'slug' in item ? navigate(`/destinations/${item.slug}`) : toast('View Details feature coming soon', 'info')}
                >
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
