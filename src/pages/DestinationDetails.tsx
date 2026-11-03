import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Wallet, Heart, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { mockDestinations } from '@/data/destinations';
import { mockPlaces } from '@/data/places';
import { useTrips } from '@/context/TripContext';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { getDestination } from '@/services/apiService';

export function DestinationDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { trips, savedPlaces, toggleSavedPlace, addPlaceToTrip } = useTrips();
  const { toast } = useToast();
  
  const [dest, setDest] = useState(mockDestinations.find(d => d.slug === slug));
  const places = mockPlaces.filter(p => p.destinationId === dest?.id);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDest = async () => {
      const mockDest = mockDestinations.find(d => d.slug === slug);
      if (mockDest) {
        try {
            // We use the ID to fetch full details
            const data = await getDestination(mockDest.id.replace('d', ''));
            if (data && data.id) {
                setDest({
                    ...mockDest,
                    dailyBudget: data.daily_budget_typical || mockDest.dailyBudget,
                    recommendedDays: data.recommended_duration ? parseInt(data.recommended_duration) || mockDest.recommendedDays : mockDest.recommendedDays,
                    bestSeason: data.best_season || mockDest.bestSeason,
                    categories: data.popular_for && data.popular_for.length > 0 ? data.popular_for : mockDest.categories
                });
            }
        } catch (e) {
            console.error("Using offline destination data", e);
        }
      }
    };
    fetchDest();
  }, [slug]);

  if (!dest) {
    return <div className="pt-32 text-center text-xl">Destination not found</div>;
  }

  const handleToggleSave = (placeId: string) => {
    toggleSavedPlace(placeId);
    const isSaved = savedPlaces.includes(placeId);
    toast(isSaved ? 'Removed from saved places' : 'Saved to favorites!', 'success');
  };

  const openAddToTripModal = (placeId: string) => {
    setSelectedPlaceId(placeId);
    setIsModalOpen(true);
  };

  const handleAddToTrip = (tripId: string) => {
    if (selectedPlaceId) {
      addPlaceToTrip(tripId, selectedPlaceId);
      const trip = trips.find(t => t.id === tripId);
      toast(`Added to ${trip?.source} → ${dest.name}`, 'success');
      setIsModalOpen(false);
      setSelectedPlaceId(null);
    }
  };

  return (
    <div className="pb-20">
      <div className="relative h-[60vh] min-h-[400px]">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url(${dest.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        </div>
        
        <div className="absolute top-24 left-4 z-10 md:hidden">
          <Button variant="ghost" size="icon" className="bg-white/20 text-white rounded-full backdrop-blur-md" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-7xl mx-auto z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <Badge variant="primary" className="mb-4">{dest.state}, {dest.country}</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">{dest.name}</h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl">{dest.description}</p>
            </div>
            <div className="flex gap-4">
              <Button size="lg" className="shadow-float" onClick={() => navigate('/plan')}>Plan a Trip Here</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold text-charcoal dark:text-white mb-8">Places worth visiting</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {places.map(place => {
              const isSaved = savedPlaces.includes(place.id);
              return (
                <Card key={place.id} className="group hover:shadow-float transition-all flex flex-col h-full">
                  <div className="relative h-48 overflow-hidden shrink-0">
                    <img src={place.image} alt={place.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="default" className="bg-white/90 backdrop-blur-sm text-charcoal">{place.category}</Badge>
                    </div>
                    <button 
                      onClick={() => handleToggleSave(place.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${isSaved ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  <CardContent className="flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-charcoal dark:text-white line-clamp-1">{place.name}</h3>
                      <div className="flex items-center text-sm font-bold text-charcoal dark:text-white shrink-0 ml-2">
                        <span className="text-yellow-500 mr-1">★</span> {place.rating}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-muted dark:text-gray-400 mb-4 flex-1">
                      <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> {place.distance ? `${place.distance} km` : ''} • {place.travel_time || `${place.recommendedTimeHours || 2}h`}</div>
                      <div className="flex items-center">
                        <Wallet className="w-4 h-4 mr-2" /> 
                        Entry: {place.entry_fee_raw ? `₹${place.entry_fee_raw}` : (place.entry_fee == 0 || place.entryFee == 0 ? 'Free' : `₹${place.entry_fee || place.entryFee}`)}
                      </div>
                      {place.local_transport_mode && (
                        <div className="flex items-center text-xs">
                           Access: {place.local_transport_mode} ({place.transport_estimate_raw})
                        </div>
                      )}
                    </div>
                    <Button variant="outline" className="w-full mt-auto" onClick={() => openAddToTripModal(place.id)}>
                      <Plus className="w-4 h-4 mr-2" /> Add to Trip
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">At a glance</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/5 p-3 rounded-xl text-primary"><Calendar className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal dark:text-white">Recommended duration</p>
                    <p className="text-sm text-muted dark:text-gray-400">{dest.recommendedDays} days</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/5 p-3 rounded-xl text-primary"><Wallet className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal dark:text-white">Daily budget</p>
                    <p className="text-sm text-muted dark:text-gray-400">₹{dest.dailyBudget} / person</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/5 p-3 rounded-xl text-primary"><MapPin className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal dark:text-white">Best season</p>
                    <p className="text-sm text-muted dark:text-gray-400">{dest.bestSeason}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <h4 className="font-semibold text-charcoal dark:text-white mb-3">Popular for</h4>
                <div className="flex flex-wrap gap-2">
                  {dest.categories.map(cat => (
                    <Badge key={cat} variant="default">{cat}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add to My Trip">
        <div className="space-y-3">
          <p className="text-sm text-muted mb-4">Select a trip to add this place to:</p>
          {trips.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted mb-4">You have no active trips.</p>
              <Button onClick={() => navigate('/plan')}>Create New Trip</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.filter(t => t.destinationId === dest.id).length === 0 && (
                <div className="mb-4 p-4 bg-primary/5 rounded-xl border border-primary/10 flex justify-between items-center">
                  <p className="text-sm text-charcoal dark:text-gray-300 font-medium">No {dest.name} trip yet.</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/plan')}>Create {dest.name} Trip</Button>
                </div>
              )}
              {[...trips]
                .sort((a, b) => {
                  if (a.destinationId === dest.id && b.destinationId !== dest.id) return -1;
                  if (a.destinationId !== dest.id && b.destinationId === dest.id) return 1;
                  return 0;
                })
                .map(trip => {
                  const tripDest = mockDestinations.find(d => d.id === trip.destinationId);
                  const isAlreadyAdded = selectedPlaceId && trip.places.includes(selectedPlaceId);
                  
                  return (
                    <button 
                      key={trip.id}
                      className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl flex justify-between items-center text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (isAlreadyAdded) return;
                        handleAddToTrip(trip.id);
                      }}
                      disabled={Boolean(isAlreadyAdded)}
                    >
                      <div>
                        <p className="font-semibold text-charcoal dark:text-white">{trip.source} → {tripDest?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted">{trip.days} Days • {trip.travellers} Travellers</p>
                      </div>
                      {isAlreadyAdded ? (
                        <span className="text-xs font-bold text-green-500 flex items-center">
                          ✓ Already Added
                        </span>
                      ) : (
                        <Plus className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
