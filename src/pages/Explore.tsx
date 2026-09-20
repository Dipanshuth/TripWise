import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Heart } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { mockDestinations } from '@/data/destinations';
import { Reveal } from '@/components/ui/Reveal';
import { useTrips } from '@/context/TripContext';
import { useToast } from '@/context/ToastContext';

const categories = ['All', 'Mountains', 'Beaches', 'Heritage', 'Adventure', 'Nature', 'Relaxation', 'Food'];

export function Explore() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const { savedPlaces, toggleSavedPlace } = useTrips();
  const { toast } = useToast();

  const filteredDestinations = mockDestinations.filter(dest => {
    const matchesSearch = dest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          dest.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || dest.categories.includes(activeCategory);
    return matchesSearch && matchesCategory;
  });

  const handleToggleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleSavedPlace(id);
    const isSaved = savedPlaces.includes(id);
    toast(isSaved ? 'Removed from saved' : 'Destination saved!', 'success');
  };

  return (
    <div className="pt-24 px-4 max-w-7xl mx-auto pb-16">
      <Reveal>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-charcoal dark:text-white mb-6">Where do you want to go?</h1>
          <Input 
            icon={<Search className="w-5 h-5" />} 
            placeholder="Search destinations, places, or experiences..." 
            className="h-14 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex overflow-x-auto hide-scrollbar w-full md:w-auto pb-2 md:pb-0 gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat 
                    ? 'bg-primary text-white' 
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-charcoal dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <Button variant="outline" className="flex items-center gap-2 whitespace-nowrap" onClick={() => toast('Filters coming soon', 'info')}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </Reveal>

      {filteredDestinations.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-muted dark:text-gray-400">No destinations found matching your criteria.</p>
          <Button variant="outline" className="mt-4" onClick={() => {setSearchTerm(''); setActiveCategory('All');}}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDestinations.map((dest, index) => {
            const isSaved = savedPlaces.includes(dest.id);
            return (
              <Reveal key={dest.id} delay={index * 0.05}>
                <div 
                  className="group cursor-pointer rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-float transition-all border border-gray-100 dark:border-gray-700 flex flex-col h-full"
                  onClick={() => navigate(`/destinations/${dest.slug}`)}
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={dest.image} 
                      alt={dest.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <button className={`absolute top-4 right-4 p-2 backdrop-blur-md rounded-full transition-colors ${isSaved ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                      onClick={(e) => handleToggleSave(e, dest.id)}
                    >
                      <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center text-sm font-bold text-charcoal">
                      <span className="text-yellow-500 mr-1">★</span> {dest.rating}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-charcoal dark:text-white">{dest.name}</h3>
                      <span className="text-sm font-semibold text-primary">₹{dest.dailyBudget}/day</span>
                    </div>
                    <p className="text-sm text-muted dark:text-gray-400 mb-3">{dest.state}, {dest.country}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {dest.categories.slice(0, 3).map(cat => (
                        <Badge key={cat} variant="default">{cat}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-charcoal dark:text-gray-300 line-clamp-2 mb-4 flex-1">{dest.description}</p>
                    <Button variant="outline" className="w-full mt-auto group-hover:bg-primary group-hover:text-white transition-colors">
                      View Destination
                    </Button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
