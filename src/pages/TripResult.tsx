import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share, Download, Bookmark, Clock, ChevronDown, Users, Calendar, Plus, X, Tag, MapPin, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { mockDestinations } from '@/data/destinations';
import { mockPlaces } from '@/data/places';
import { mockAccommodations } from '@/data/accommodations';
import { mockRoutes } from '@/data/transport';
import { mockDiscounts } from '@/data/discounts';
import { useTrips } from '@/context/TripContext';
import { budgetService } from '@/services/budgetService';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';

export function TripResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trips, updateTrip, addPlaceToTrip, removePlaceFromTrip, addExpense, removeExpense, applyDiscount } = useTrips();
  const { toast } = useToast();
  
  const trip = trips.find(t => t.id === id);
  const dest = trip ? mockDestinations.find(d => d.id === trip.destinationId) : null;
  const destPlaces = trip ? mockPlaces.filter(p => p.destinationId === trip.destinationId) : [];
  const route = trip ? mockRoutes.find(r => r.origin.toLowerCase() === trip.source.toLowerCase() && r.destinationId === trip.destinationId) : null;
  const destAccs = trip ? mockAccommodations.filter(a => a.destinationId === trip.destinationId) : [];

  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [discountCode, setDiscountCode] = useState('');

  const summary = useMemo(() => {
    if (!trip) return null;
    return budgetService.calculateTripTotal(trip);
  }, [trip]);

  if (!trip || !dest || !summary) {
    return (
      <div className="pt-32 text-center text-xl flex flex-col items-center gap-4 min-h-[60vh]">
        <p>Trip not found</p>
        <Button onClick={() => navigate('/my-trips')}>Go to My Trips</Button>
      </div>
    );
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/trip/${trip.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `My Trip to ${dest.name}`, text: `Check out my itinerary for ${dest.name}!`, url });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(url);
      toast('Trip link copied to clipboard!', 'success');
    }
  };

  const handleDownload = () => {
    const text = `TRIP SUMMARY: ${trip.source} to ${dest.name}\nDays: ${trip.days}\nTravellers: ${trip.travellers}\nStyle: ${trip.travelStyle}\nTOTAL: ₹${summary.total}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Trip-${dest.name}.txt`;
    a.click();
    toast('Download started', 'info');
  };

  const handleAddExpense = () => {
    if (!expenseName || !expenseAmount) return;
    addExpense(trip.id, { id: `exp-${Date.now()}`, name: expenseName, amount: parseInt(expenseAmount), category: 'Other' });
    setExpenseName(''); setExpenseAmount(''); setIsExpenseModalOpen(false);
    toast('Custom expense added', 'success');
  };

  const handleApplyDiscount = () => {
    const discount = mockDiscounts.find(d => d.code === discountCode.toUpperCase());
    if (discount) {
      applyDiscount(trip.id, discount);
      setIsDiscountModalOpen(false); setDiscountCode('');
      toast(`Discount applied!`, 'success');
    } else {
      toast('Invalid or expired promo code', 'error');
    }
  };

  const togglePlace = (placeId: string) => {
    if (trip.places.includes(placeId)) {
      removePlaceFromTrip(trip.id, placeId);
      toast('Place removed from trip', 'info');
    } else {
      addPlaceToTrip(trip.id, placeId);
      toast('Place added to trip!', 'success');
    }
  };

  const changeTransport = (id: string) => {
    updateTrip(trip.id, { transportId: id });
    setIsTransportModalOpen(false);
    toast('Transport option updated', 'success');
  };

  const changeAccommodation = (id: string) => {
    updateTrip(trip.id, { accommodationId: id });
    setIsAccModalOpen(false);
    toast('Accommodation updated', 'success');
  };

  const minBudget = budgetService.calculateMinimumBudget(trip);

  const categories = [
    { key: 'transportation', label: 'Transportation', color: 'bg-blue-500', amount: summary.transportation },
    { key: 'accommodation', label: 'Accommodation', color: 'bg-purple-500', amount: summary.accommodation },
    { key: 'food', label: 'Food', color: 'bg-orange-500', amount: summary.food },
    { key: 'activities', label: 'Activities', color: 'bg-green-500', amount: summary.activities },
    { key: 'localTravel', label: 'Local Travel', color: 'bg-yellow-500', amount: summary.localTravel },
    { key: 'customExpenses', label: 'Custom', color: 'bg-gray-500', amount: summary.customExpenses }
  ];

  const currentTransport = route?.options.find(t => t.id === trip.transportId);
  const currentAcc = destAccs.find(a => a.id === trip.accommodationId);

  return (
    <div className="pt-24 px-4 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <Badge variant="accent" className="mb-4">{trip.source} → {dest.name}</Badge>
          <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2">Your Trip Overview</h1>
          <div className="flex flex-wrap gap-4 text-muted dark:text-gray-400 font-medium">
            <span className="flex items-center">{trip.days} Days</span>
            <span>•</span>
            <span className="flex items-center">{trip.travellers} Travellers</span>
            <span>•</span>
            <span>{trip.travelStyle} Style</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none" onClick={handleShare}><Share className="w-4 h-4 mr-2" /> Share</Button>
          <Button variant="outline" className="flex-1 md:flex-none" onClick={handleDownload}><Download className="w-4 h-4 mr-2" /> Download</Button>
          <Button className="flex-1 md:flex-none bg-primary" onClick={() => { updateTrip(trip.id, { status: 'Saved' }); toast('Changes saved ✓', 'success'); }}><Bookmark className="w-4 h-4 mr-2" /> Save Trip</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-charcoal dark:text-white">Your Itinerary</h2>
            <Button variant="outline" size="sm" onClick={() => setIsAddPlaceModalOpen(true)}>+ Add Places</Button>
          </div>
          
          <div className="space-y-8">
            {trip.itinerary.length === 0 ? (
              <div className="text-muted p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-xl">No activities added yet.</div>
            ) : trip.itinerary.map((day) => (
              <div key={day.dayNumber} className="relative">
                <div className="mb-6 flex items-center gap-4">
                  <div className="bg-primary text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-soft">
                    {day.dayNumber}
                  </div>
                  <h3 className="text-xl font-bold text-charcoal dark:text-white">{day.title}</h3>
                </div>

                <div className="relative pl-6 ml-6 border-l-2 border-gray-100 dark:border-gray-800 space-y-6 pb-6">
                  {day.activities.map((activity) => (
                    <Card key={activity.id} className="relative group overflow-visible">
                      <div className="absolute -left-[35px] top-6 w-4 h-4 bg-white dark:bg-gray-800 border-4 border-primary rounded-full"></div>
                      <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                        {activity.image && (
                          <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden shrink-0">
                            <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-primary font-bold">{activity.time}</span>
                            <span className="text-sm font-medium text-muted dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md flex items-center">
                              <Clock className="w-3 h-3 mr-1" /> {activity.duration}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-charcoal dark:text-white mb-2">{activity.title}</h4>
                          {activity.cost > 0 && (
                            <p className="text-sm font-semibold text-charcoal dark:text-white mt-2">Cost: ₹{activity.cost}</p>
                          )}
                          {activity.placeId && (
                            <div className="mt-4 flex gap-2">
                              <Button variant="ghost" size="sm" className="text-red-500 px-0 hover:bg-transparent" onClick={() => removePlaceFromTrip(trip.id, activity.placeId!)}>
                                <Trash2 className="w-4 h-4 mr-1" /> Remove
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-2">Estimated Cost</h2>
              <div className="text-4xl font-bold text-primary mb-1">₹{summary.total.toLocaleString()}</div>
              <p className="text-muted dark:text-gray-400 mb-2">₹{summary.perPerson.toLocaleString()} per person • ₹{summary.perDay.toLocaleString()} per day</p>
              
              <div className="mb-6">
                {summary.total < minBudget ? (
                  <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-md flex items-center w-fit"><AlertTriangle className="w-3 h-3 mr-1" /> Below estimated min. (₹{minBudget})</span>
                ) : (
                  <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-md flex items-center w-fit"><CheckCircle2 className="w-3 h-3 mr-1" /> Within recommended budget</span>
                )}
              </div>

              {trip.discount && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg flex justify-between items-center mb-6">
                  <span className="flex items-center text-sm font-medium"><Tag className="w-4 h-4 mr-2"/> {trip.discount.code}</span>
                  <span className="font-bold">-₹{summary.discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="w-full h-4 rounded-full flex overflow-hidden mb-6">
                {categories.map(cat => {
                  if (summary.subtotal === 0) return null;
                  const width = `${(cat.amount / summary.subtotal) * 100}%`;
                  return <div key={cat.key} className={cat.color} style={{ width }} title={cat.label} />;
                })}
              </div>

              <div className="space-y-4 mb-8">
                {categories.map(cat => (
                  <div key={cat.key} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                      <span className="font-medium text-charcoal dark:text-white">
                        {cat.label}
                        {cat.key === 'transportation' && <button onClick={() => setIsTransportModalOpen(true)} className="ml-2 text-xs text-primary underline">Edit</button>}
                        {cat.key === 'accommodation' && <button onClick={() => setIsAccModalOpen(true)} className="ml-2 text-xs text-primary underline">Edit</button>}
                      </span>
                    </div>
                    <span className="font-semibold text-charcoal dark:text-white">₹{cat.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mb-6">
                <Button variant="outline" className="flex-1 text-xs" onClick={() => setIsExpenseModalOpen(true)}><Plus className="w-3 h-3 mr-1"/> Expense</Button>
                <Button variant="outline" className="flex-1 text-xs" onClick={() => setIsDiscountModalOpen(true)}><Tag className="w-3 h-3 mr-1"/> Discount</Button>
              </div>

              {trip.expenses.length > 0 && (
                <div className="mb-6 space-y-2">
                  <h4 className="text-xs font-bold text-muted uppercase">Custom Expenses</h4>
                  {trip.expenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="font-medium">{exp.name}</span>
                      <div className="flex items-center gap-3">
                        <span>₹{exp.amount}</span>
                        <button onClick={() => removeExpense(trip.id, exp.id)} className="text-red-500 hover:text-red-700"><X className="w-3 h-3"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={isAddPlaceModalOpen} onClose={() => setIsAddPlaceModalOpen(false)} title={`Places in ${dest.name}`}>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {destPlaces.map(place => (
            <div key={place.id} className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <img src={place.image} className="w-20 h-20 rounded-lg object-cover" />
              <div className="flex-1">
                <h4 className="font-bold text-charcoal dark:text-white">{place.name}</h4>
                <p className="text-xs text-muted mb-2">{place.category} • {place.recommendedTimeHours}h • Entry: ₹{place.entryFee}</p>
                <Button 
                  size="sm" 
                  variant={trip.places.includes(place.id) ? "outline" : "primary"} 
                  className="w-full text-xs h-8"
                  onClick={() => togglePlace(place.id)}
                >
                  {trip.places.includes(place.id) ? 'Remove' : 'Add to Trip'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isTransportModalOpen} onClose={() => setIsTransportModalOpen(false)} title={`Transport: ${trip.source} to ${dest.name}`}>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {route ? route.options.map(opt => (
            <button key={opt.id} onClick={() => changeTransport(opt.id)} className={`w-full p-4 rounded-xl flex justify-between items-center border-2 transition-all text-left ${trip.transportId === opt.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-300'}`}>
              <div>
                <p className="font-bold text-charcoal dark:text-white">{opt.mode}</p>
                <p className="text-sm text-muted">{opt.duration} • {opt.comfort}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">₹{opt.price}</p>
                <p className="text-xs text-muted">{opt.pricingType === 'per_person' ? 'per person' : 'total'}</p>
              </div>
            </button>
          )) : <p>No transport options available.</p>}
        </div>
      </Modal>

      <Modal isOpen={isAccModalOpen} onClose={() => setIsAccModalOpen(false)} title={`Accommodation in ${dest.name}`}>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {destAccs.map(acc => (
            <button key={acc.id} onClick={() => changeAccommodation(acc.id)} className={`w-full p-4 rounded-xl flex gap-4 items-center border-2 transition-all text-left ${trip.accommodationId === acc.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-300'}`}>
              <img src={acc.image} className="w-16 h-16 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-bold text-charcoal dark:text-white">{acc.name}</p>
                <p className="text-sm text-muted">{acc.type} • ★ {acc.rating.toFixed(1)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-primary">₹{acc.pricePerNight}</p>
                <p className="text-xs text-muted">/ night</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Add Custom Expense">
        <div className="space-y-4">
          <div><label className="text-sm font-semibold mb-1 block">Name</label><input type="text" className="w-full p-3 border rounded-xl" value={expenseName} onChange={e => setExpenseName(e.target.value)} /></div>
          <div><label className="text-sm font-semibold mb-1 block">Amount</label><input type="number" className="w-full p-3 border rounded-xl" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} /></div>
          <Button className="w-full" onClick={handleAddExpense}>Add</Button>
        </div>
      </Modal>

      <Modal isOpen={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} title="Apply Promo Code">
        <div className="space-y-4">
          <input type="text" className="w-full p-3 border rounded-xl uppercase" placeholder="TRIP10" value={discountCode} onChange={e => setDiscountCode(e.target.value)} />
          <Button className="w-full" onClick={handleApplyDiscount}>Apply</Button>
        </div>
      </Modal>
    </div>
  );
}
