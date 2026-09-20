import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, MapPin, Search, Calendar, Users, Briefcase, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { TravelStyle, Trip } from '@/types';
import { useTrips } from '@/context/TripContext';
import { useToast } from '@/context/ToastContext';
import { mockDestinations } from '@/data/destinations';
import { mockRoutes } from '@/data/transport';
import { mockAccommodations } from '@/data/accommodations';
import { regenerateItinerary } from '@/utils/itineraryHelper';
import { budgetService } from '@/services/budgetService';

export function Plan() {
  const navigate = useNavigate();
  const { createTrip } = useTrips();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    destinationId: '',
    days: 4,
    travellers: 2,
    style: 'Balanced' as TravelStyle,
    budget: 15000,
  });

  const [destSearchFocus, setDestSearchFocus] = useState(false);

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (step === 1 && !formData.from) {
      toast('Please enter your starting location.', 'error');
      return;
    }
    if (step === 2) {
      const dest = mockDestinations.find(d => d.id === formData.destinationId) || mockDestinations.find(d => d.name.toLowerCase() === formData.to.toLowerCase());
      if (!dest) {
        toast('Please select a valid destination from the suggestions.', 'error');
        return;
      }
      if (!formData.destinationId) {
        updateForm('destinationId', dest.id);
        updateForm('to', dest.name); // Normalize casing
      }
    }
    setStep(s => Math.min(s + 1, 6));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const filteredDestinations = useMemo(() => {
    if (!formData.to) return mockDestinations;
    return mockDestinations.filter(d => 
      d.name.toLowerCase().includes(formData.to.toLowerCase()) || 
      d.state.toLowerCase().includes(formData.to.toLowerCase())
    );
  }, [formData.to]);

  const selectedDestination = useMemo(() => {
    if (formData.destinationId) {
      return mockDestinations.find(d => d.id === formData.destinationId);
    }
    return mockDestinations.find(d => d.name.toLowerCase() === formData.to.toLowerCase());
  }, [formData.to, formData.destinationId]);

  const minimumBudget = useMemo(() => {
    if (!selectedDestination) return 0;
    return budgetService.calculateMinimumBudget({
      source: formData.from,
      destinationId: selectedDestination.id,
      days: formData.days,
      travellers: formData.travellers
    });
  }, [selectedDestination, formData.from, formData.days, formData.travellers]);

  const handleBuildTrip = () => {
    const dest = selectedDestination;
    if (!dest) return;

    // Find default transport
    const route = mockRoutes.find(r => r.origin.toLowerCase() === formData.from.toLowerCase() && r.destinationId === dest.id);
    const defaultTransportId = route ? route.options[0]?.id : undefined;

    // Find default accommodation based on style
    const destAccs = mockAccommodations.filter(a => a.destinationId === dest.id);
    const targetType = formData.style === 'Premium' ? 'Resort' : formData.style === 'Budget' ? 'Hostel' : 'Hotel';
    const defaultAccId = destAccs.find(a => a.type === targetType)?.id || destAccs[0]?.id;

    const draftTrip: Trip = {
      id: `trip-${Date.now()}`,
      status: 'Draft',
      destinationId: dest.id,
      source: formData.from,
      days: formData.days,
      travellers: formData.travellers,
      travelStyle: formData.style,
      budget: formData.budget,
      transportId: defaultTransportId,
      accommodationId: defaultAccId,
      places: [],
      expenses: [],
      itinerary: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Generate initial itinerary
    draftTrip.itinerary = regenerateItinerary(draftTrip);

    createTrip(draftTrip);
    toast('Trip created successfully!', 'success');
    navigate(`/trip/${draftTrip.id}`);
  };

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto min-h-[80vh] flex flex-col">
      {/* Progress */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-2">
          {['Origin', 'Destination', 'Dates', 'Travellers', 'Style', 'Budget'].map((label) => (
            <div key={label} className="hidden"></div>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm font-medium text-muted dark:text-gray-400 mb-2">
          <span>Step {step} of 6</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full relative">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-charcoal dark:text-white mb-2">Where are you travelling from?</h2>
            <p className="text-muted dark:text-gray-400 mb-8">Enter your starting location to help us calculate transport.</p>
            <Input 
              icon={<MapPin className="w-5 h-5" />} 
              placeholder="e.g. Delhi, Mumbai" 
              className="h-16 text-lg"
              value={formData.from}
              onChange={(e) => updateForm('from', e.target.value)}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {['Delhi', 'Mumbai', 'Bengaluru', 'Chandigarh'].map(place => (
                <button 
                  key={place}
                  onClick={() => updateForm('from', place)}
                  className={`px-4 py-2 rounded-full border transition-colors ${formData.from === place ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary'}`}
                >
                  {place}
                </button>
              ))}
            </div>
            
            {formData.from && !['Delhi', 'Mumbai', 'Bengaluru', 'Chandigarh'].includes(formData.from) && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-xl flex gap-3 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>Transport estimate is currently available for Delhi, Mumbai, Bengaluru and Chandigarh.</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <h2 className="text-3xl font-bold text-charcoal dark:text-white mb-2">Where do you want to go?</h2>
            <p className="text-muted dark:text-gray-400 mb-8">Search for a city, state, or leave empty for suggestions.</p>
            <div className="relative">
              <Input 
                icon={<Search className="w-5 h-5" />} 
                placeholder="e.g. Kullu, Manali, Goa, Darjeeling..." 
                className="h-16 text-lg"
                value={formData.to}
                onChange={(e) => {
                  updateForm('to', e.target.value);
                  updateForm('destinationId', ''); // clear selection on typing
                }}
                onFocus={() => setDestSearchFocus(true)}
                onBlur={() => setTimeout(() => setDestSearchFocus(false), 200)}
              />
              
              {(destSearchFocus || formData.to) && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-64 overflow-y-auto">
                  {filteredDestinations.length > 0 ? (
                    <div className="p-2">
                      <p className="px-3 py-2 text-xs font-bold text-muted uppercase">Suggestions</p>
                      {filteredDestinations.map(dest => (
                        <button
                          key={dest.id}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center justify-between"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevents input blur before click registers
                            updateForm('to', dest.name);
                            updateForm('destinationId', dest.id);
                            setDestSearchFocus(false);
                          }}
                        >
                          <span className="font-semibold text-charcoal dark:text-white flex items-center">
                            {dest.name}
                            {formData.destinationId === dest.id && (
                              <span className="ml-2 text-green-500 text-sm">✓</span>
                            )}
                          </span>
                          <span className="text-xs text-muted">{dest.state}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted">No destinations found.</div>
                  )}
                </div>
              )}
            </div>
            {selectedDestination && (
              <div className="mt-8 flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl items-center animate-in fade-in">
                <img src={selectedDestination.image} className="w-16 h-16 rounded-lg object-cover shrink-0 shadow-sm" />
                <div>
                  <p className="font-bold text-charcoal dark:text-white flex items-center">
                    {selectedDestination.name}
                    <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Selected</span>
                  </p>
                  <p className="text-sm text-muted line-clamp-2 mt-1">{selectedDestination.description}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-charcoal dark:text-white mb-2">How many days?</h2>
            <p className="text-muted dark:text-gray-400 mb-8">How long is your trip?</p>
            <div className="flex items-center space-x-6">
              <Button variant="outline" size="icon" className="w-16 h-16 text-2xl rounded-full" onClick={() => updateForm('days', Math.max(1, formData.days - 1))}>-</Button>
              <div className="text-5xl font-bold w-24 text-center">{formData.days}</div>
              <Button variant="outline" size="icon" className="w-16 h-16 text-2xl rounded-full" onClick={() => updateForm('days', Math.min(30, formData.days + 1))}>+</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-charcoal dark:text-white mb-2">How many travellers?</h2>
            <p className="text-muted dark:text-gray-400 mb-8">Who's coming with you?</p>
            <div className="flex items-center space-x-6">
              <Button variant="outline" size="icon" className="w-16 h-16 text-2xl rounded-full" onClick={() => updateForm('travellers', Math.max(1, formData.travellers - 1))}>-</Button>
              <div className="text-5xl font-bold w-24 text-center">{formData.travellers}</div>
              <Button variant="outline" size="icon" className="w-16 h-16 text-2xl rounded-full" onClick={() => updateForm('travellers', Math.min(20, formData.travellers + 1))}>+</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-charcoal dark:text-white mb-2">Travel style</h2>
            <p className="text-muted dark:text-gray-400 mb-8">This helps us recommend the right accommodation and activities.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['Budget', 'Balanced', 'Comfort', 'Premium'] as TravelStyle[]).map(style => (
                <Card 
                  key={style}
                  onClick={() => updateForm('style', style)}
                  className={`cursor-pointer transition-all border-2 ${formData.style === style ? 'border-primary bg-primary/5' : 'border-transparent hover:border-gray-200 dark:border-gray-700'}`}
                >
                  <CardContent className="p-6 text-center">
                    <Briefcase className={`w-8 h-8 mx-auto mb-3 ${formData.style === style ? 'text-primary' : 'text-muted dark:text-gray-400'}`} />
                    <h3 className="font-bold text-lg">{style}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-charcoal dark:text-white mb-2">Approximate budget</h2>
            <p className="text-muted dark:text-gray-400 mb-8">Total trip budget (all travellers combined).</p>
            
            {formData.budget < minimumBudget && (
              <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-xl flex gap-3 text-sm animate-in fade-in">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <div>
                  <p className="font-bold mb-1">Estimated budget too low</p>
                  <p>Based on your selected days and travellers, this trip may require at least ₹{minimumBudget.toLocaleString()}.</p>
                </div>
              </div>
            )}

            <div className="text-center mb-8">
              <div className={`text-5xl font-bold mb-2 ${formData.budget < minimumBudget ? 'text-yellow-600 dark:text-yellow-400' : 'text-primary'}`}>₹{formData.budget.toLocaleString()}</div>
            </div>
            
            <input 
              type="range" 
              min="2000" 
              max="200000" 
              step="1000"
              value={formData.budget}
              onChange={(e) => updateForm('budget', parseInt(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${formData.budget < minimumBudget ? 'bg-yellow-200 dark:bg-yellow-800 accent-yellow-500' : 'bg-gray-200 dark:bg-gray-700 accent-primary'}`}
            />
            <div className="flex justify-between text-sm text-muted dark:text-gray-400 mt-2">
              <span>₹2,000</span>
              <span className="font-semibold">Min: ₹{minimumBudget.toLocaleString()}</span>
              <span>₹200,000+</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 flex justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
        <Button 
          variant="ghost" 
          onClick={prevStep}
          disabled={step === 1}
          className="flex items-center"
        >
          <ChevronLeft className="w-5 h-5 mr-1" /> Back
        </Button>
        
        {step < 6 ? (
          <Button onClick={nextStep} className="flex items-center px-8">
            Next <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleBuildTrip} className="flex items-center px-8 shadow-float bg-accent hover:bg-accent-light text-white border-0">
            Build My Trip
          </Button>
        )}
      </div>
    </div>
  );
}
