import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share, Download, Bookmark, Clock, ChevronDown, Users, Calendar, Plus, X, Tag, MapPin, Trash2 } from 'lucide-react';
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

import { calculateTrip, downloadTripPDF, downloadTripCSV, getDestination, getPlaces, getAccommodations, getTransport } from '@/services/apiService';

export function TripResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trips, updateTrip, addPlaceToTrip, removePlaceFromTrip, addExpense, removeExpense, applyDiscount, removeDiscount, createTrip, deleteTrip } = useTrips();
  const { toast } = useToast();
  
  const trip = trips.find(t => String(t.id) === String(id));
  const [dest, setDest] = useState<any>(null);
  const [destPlaces, setDestPlaces] = useState<any[]>([]);
  const [route, setRoute] = useState<any>(null);
  const [destAccs, setDestAccs] = useState<any[]>([]);
  const [isDestLoading, setIsDestLoading] = useState(true);

  useEffect(() => {
    if (!trip) {
      // Don't set loading to false immediately if trips are still loading from context
      if (trips.length > 0) {
        setIsDestLoading(false);
      }
      return;
    }
    
    const fetchDestInfo = async () => {
      setIsDestLoading(true);
      try {
        const destId = trip.destinationId;
        
        let destData, placesData, accsData, transportData;
        try {
          // Attempt API calls
          [destData, placesData, accsData, transportData] = await Promise.all([
            getDestination(destId),
            getPlaces(destId),
            getAccommodations(destId),
            getTransport(trip.source, String(destId))
          ]);
        } catch (apiError) {
          console.warn("API load failed, using mock data", apiError);
          // Fallback - handle both 'd1' and '1' formats
          const strDestId = String(destId);
          const mockDestId = strDestId.startsWith('d') ? strDestId : `d${strDestId}`;
          
          destData = mockDestinations.find(d => String(d.id) === mockDestId || String(d.id) === strDestId);
          placesData = { results: mockPlaces.filter(p => String(p.destinationId) === mockDestId || String(p.destinationId) === strDestId) };
          accsData = { results: mockAccommodations.filter(a => String(a.destinationId) === mockDestId || String(a.destinationId) === strDestId) };
          
          const safeSource = (trip.source || '').toLowerCase();
          transportData = { results: mockRoutes.find(rt => 
            (rt.origin || '').toLowerCase() === safeSource && 
            (String(rt.destinationId) === mockDestId || String(rt.destinationId) === strDestId)
          )?.options || [] };
        }
        
        setDest(destData);
        setDestPlaces(placesData?.results || placesData || []);
        setDestAccs(accsData?.results || accsData || []);
        setRoute({ options: transportData?.results || transportData || [] });
        
        // Auto-assign default transport if not set
        const availableTransports = transportData?.results || transportData || [];
        if (!trip.transportId && availableTransports.length > 0) {
          const defaultOpt = availableTransports.find((t: any) => t.recommended) || availableTransports[0];
          if (defaultOpt) {
            updateTrip(trip.id, { transportId: String(defaultOpt.id) });
          }
        }
        
        // Auto-assign default accommodation if not set
        const availableAccs = accsData?.results || accsData || [];
        if (!trip.accommodationId && availableAccs.length > 0) {
          const targetType = trip.travelStyle === 'Premium' ? 'Resort' : trip.travelStyle === 'Budget' ? 'Hostel' : 'Hotel';
          const defaultAcc = availableAccs.find((a: any) => (a.hotel_type || a.type || '').toLowerCase() === targetType.toLowerCase()) || availableAccs[0];
          if (defaultAcc) {
            updateTrip(trip.id, { accommodationId: String(defaultAcc.id) });
          }
        }
        
      } catch (err) {
        console.error("Failed to load destination info", err);
      } finally {
        setIsDestLoading(false);
      }
    };
    
    fetchDestInfo();
  }, [trip, trips.length]);

  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [discountCode, setDiscountCode] = useState('');

  const [summary, setSummary] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!trip || !dest) return;
    
    // Always use the robust frontend budget service to reflect real-time unsaved changes immediately
    setSummary(budgetService.calculateTripTotal(trip, dest, route, destPlaces, destAccs));
  }, [trip, dest, route, destPlaces, destAccs]);

  if (isDestLoading) {
    return (
      <div className="pt-32 text-center text-xl flex flex-col items-center gap-4 min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p>Loading trip details...</p>
      </div>
    );
  }

  if (!trip || !dest) {
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

  const handleDownload = async () => {
    toast('Generating PDF report...', 'info');
    try {
      const savedId = await handleSaveBackend();
      await downloadTripPDF(savedId);
      toast('Download complete!', 'success');
    } catch (e) {
      console.error(e);
      toast('Download failed. Ensure this is a backend-saved trip.', 'error');
    }
  };
  
  const handleDownloadCSV = async () => {
    toast('Preparing CSV...', 'info');
    try {
      const savedId = await handleSaveBackend();
      await downloadTripCSV(savedId);
      toast('Download complete!', 'success');
    } catch (e) {
      console.error(e);
      toast('Download failed.', 'error');
    }
  };

  const handleSaveBackend = async () => {
    let currentId = trip.id;
    if (typeof trip.id === 'string' && trip.id.toString().startsWith('trip-')) {
      toast('Saving trip to database...', 'info');
      try {
        const { createTrip: createTripApi, addPlaceToTrip: addPlaceApi, updateTrip: updateTripApi } = await import('@/services/apiService');
        const res = await createTripApi({
          source_name: trip.source,
          destination_id: trip.destinationId,
          days: trip.days,
          travellers: trip.travellers,
          travel_style: trip.travelStyle.toLowerCase()
        });
        
        // Add places
        for (const placeId of trip.places) {
          await addPlaceApi(res.id, placeId).catch(() => {});
        }

        // Set transport/accommodation if selected
        if (trip.transportId || trip.accommodationId || trip.discount) {
          const parseId = (val: any) => {
            if (!val) return null;
            const num = parseInt(String(val).replace(/\D/g, ''), 10);
            return isNaN(num) ? null : num;
          };
          await updateTripApi(res.id, {
            selected_transport_id: parseId(trip.transportId),
            selected_accommodation_id: parseId(trip.accommodationId),
            discount_code: trip.discount ? trip.discount.code : null,
          }).catch(() => {});
        }
        
        toast('Trip successfully saved to backend!', 'success');
        
        // Swap out the draft trip for the real one in local context
        const newTripId = res.id.toString();
        currentId = newTripId;
        createTrip({ ...trip, id: newTripId, status: 'Saved' });
        deleteTrip(trip.id);
        navigate(`/trip/${newTripId}`, { replace: true });
      } catch (e) {
        console.error(e);
        toast('Failed to save to backend. Are you logged in?', 'error');
        throw e;
      }
    } else {
      try {
        const parseId = (val: any) => {
          if (!val) return null;
          const num = parseInt(String(val).replace(/\D/g, ''), 10);
          return isNaN(num) ? null : num;
        };
        const { updateTrip: updateTripApi, addPlaceToTrip: addPlaceApi } = await import('@/services/apiService');
        await updateTripApi(trip.id, {
          selected_transport_id: parseId(trip.transportId),
          selected_accommodation_id: parseId(trip.accommodationId),
          discount_code: trip.discount ? trip.discount.code : null,
          status: 'Saved',
        });

        // Sync all places on existing trip
        for (const placeId of trip.places) {
          await addPlaceApi(trip.id, placeId).catch(() => {});
        }
      } catch (e) {
        console.error(e);
      }
      updateTrip(trip.id, { status: 'Saved' });
      toast('Changes saved ✓', 'success');
    }
    return currentId;
  };

  const handleAddExpense = () => {
    if (!expenseName || !expenseAmount) return;
    addExpense(trip.id, { id: `exp-${Date.now()}`, name: expenseName, amount: parseInt(expenseAmount), category: 'Other' });
    setExpenseName(''); setExpenseAmount(''); setIsExpenseModalOpen(false);
    toast('Custom expense added', 'success');
  };

  const handleApplyDiscount = async () => {
    const discount = mockDiscounts.find(d => d.code === discountCode.toUpperCase());
    if (discount) {
      applyDiscount(trip.id, discount);
      setIsDiscountModalOpen(false); setDiscountCode('');
      toast(`Discount applied!`, 'success');
      if (!String(trip.id).startsWith('trip-')) {
        try {
          const { updateTrip: updateTripApi } = await import('@/services/apiService');
          await updateTripApi(trip.id, { discount_code: discount.code });
        } catch (e) {}
      }
    } else {
      toast('Invalid or expired promo code', 'error');
    }
  };

  const togglePlace = async (placeId: string | number) => {
    const placesStr = (trip.places || []).map(String);
    const strPlaceId = String(placeId);
    const isBackendTrip = !String(trip.id).startsWith('trip-');
    if (placesStr.includes(strPlaceId)) {
      removePlaceFromTrip(trip.id, strPlaceId, destPlaces);
      if (isBackendTrip) {
        try {
          const { removePlaceFromTrip: removePlaceApi } = await import('@/services/apiService');
          await removePlaceApi(trip.id, placeId);
        } catch (e) {}
      }
      toast('Place removed from trip', 'info');
    } else {
      addPlaceToTrip(trip.id, strPlaceId, destPlaces);
      if (isBackendTrip) {
        try {
          const { addPlaceToTrip: addPlaceApi } = await import('@/services/apiService');
          await addPlaceApi(trip.id, placeId);
        } catch (e) {}
      }
      toast('Place added to trip!', 'success');
    }
  };

  const changeTransport = async (id: string | number) => {
    const strId = String(id);
    updateTrip(trip.id, { transportId: strId });
    setIsTransportModalOpen(false);
    toast('Transport option updated', 'success');
    if (!String(trip.id).startsWith('trip-')) {
      try {
        const { updateTrip: updateTripApi } = await import('@/services/apiService');
        const num = parseInt(strId.replace(/\D/g, ''), 10);
        await updateTripApi(trip.id, { selected_transport_id: isNaN(num) ? null : num });
      } catch (e) {}
    }
  };

  const changeAccommodation = async (id: string | number) => {
    const strId = String(id);
    updateTrip(trip.id, { accommodationId: strId });
    setIsAccModalOpen(false);
    toast('Accommodation updated', 'success');
    if (!String(trip.id).startsWith('trip-')) {
      try {
        const { updateTrip: updateTripApi } = await import('@/services/apiService');
        const num = parseInt(strId.replace(/\D/g, ''), 10);
        await updateTripApi(trip.id, { selected_accommodation_id: isNaN(num) ? null : num });
      } catch (e) {}
    }
  };

  const formatRange = (range: any) => {
    const min = Math.round(range.min);
    const max = Math.round(range.max);
    const typ = Math.round(range.typical);
    if (min === max) return `₹${typ.toLocaleString('en-IN')}`;
    return `₹${min.toLocaleString('en-IN')} – ₹${max.toLocaleString('en-IN')}`;
  };

  const categories = summary ? [
    { key: 'transportation', label: 'Transportation', color: 'bg-blue-500', range: summary.transportation, text: formatRange(summary.transportation) },
    { key: 'accommodation', label: 'Accommodation', color: 'bg-purple-500', range: summary.accommodation, text: formatRange(summary.accommodation) },
    { key: 'food', label: 'Food', color: 'bg-orange-500', range: summary.food, text: formatRange(summary.food) },
    { key: 'activities', label: 'Activities', color: 'bg-green-500', range: summary.activities, text: formatRange(summary.activities) },
    { key: 'localTravel', label: 'Local Travel', color: 'bg-yellow-500', range: summary.localTravel, text: formatRange(summary.localTravel) },
    { key: 'customExpenses', label: 'Custom', color: 'bg-gray-500', range: summary.customExpenses, text: formatRange(summary.customExpenses) }
  ] : [];

  const currentTransport = route?.options.find((t: any) => t.id === trip.transportId);
  const currentAcc = destAccs.find((a: any) => a.id === trip.accommodationId);

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
          <div className="flex gap-2 flex-1 md:flex-none">
            <Button variant="outline" className="flex-1 md:flex-none" onClick={handleDownload}><Download className="w-4 h-4 mr-2" /> PDF</Button>
            <Button variant="outline" className="flex-1 md:flex-none" onClick={handleDownloadCSV}><Download className="w-4 h-4 mr-2" /> CSV</Button>
          </div>
          <Button className="flex-1 md:flex-none bg-primary" onClick={handleSaveBackend}><Bookmark className="w-4 h-4 mr-2" /> Save Trip</Button>
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
                        {(activity.image && activity.image !== '') && (
                          <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                            <img 
                              src={activity.image} 
                              alt={activity.title} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMTUwIDE1MCI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjYWFhYWFhIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                              }}
                            />
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
                              <Button variant="ghost" size="sm" className="text-red-500 px-0 hover:bg-transparent" onClick={() => removePlaceFromTrip(trip.id, activity.placeId!, destPlaces)}>
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
              {isCalculating || !summary ? (
                <div className="py-8 text-center text-muted">Calculating costs...</div>
              ) : (
                <>
                  <div className="text-4xl font-bold text-primary mb-3 leading-snug break-words">
                    {formatRange(summary.total)}
                  </div>
                  
                  <div className="flex flex-col gap-1 text-muted dark:text-gray-400 mb-5 text-sm font-medium">
                    <span>{formatRange(summary.perPerson)} per person</span>
                    <span>{formatRange(summary.perDay)} per day</span>
                  </div>
                  
                  <div className="text-base font-semibold text-charcoal dark:text-gray-300 mb-6">
                    Typical estimate: ₹{Math.round(summary.total.typical).toLocaleString('en-IN')}
                  </div>

                  {trip.discount && (
                    <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-xl flex justify-between items-center mb-8">
                      <span className="flex items-center font-semibold"><Tag className="w-5 h-5 mr-2"/> {trip.discount.code}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">- {formatRange(summary.discountAmount)}</span>
                        <button 
                          onClick={() => {
                            removeDiscount(trip.id);
                            if (!String(trip.id).startsWith('trip-')) {
                              import('@/services/apiService').then(({ updateTrip: updateTripApi }) => {
                                updateTripApi(trip.id, { discount_code: null }).catch(() => {});
                              });
                            }
                            toast('Discount removed', 'info');
                          }}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="w-full h-3 rounded-full flex overflow-hidden mb-8 mt-2">
                    {categories.map(cat => {
                      if (summary.subtotal.typical === 0) return null;
                      const width = `${(cat.range.typical / summary.subtotal.typical) * 100}%`;
                      return <div key={cat.key} className={cat.color} style={{ width }} title={cat.label} />;
                    })}
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-y-4 gap-x-4 mb-8 text-sm">
                    {categories.map(cat => (
                      <React.Fragment key={cat.key}>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full shrink-0 ${cat.color}`}></div>
                          <div className="font-medium text-charcoal dark:text-white flex items-center flex-wrap gap-2">
                            <span>{cat.label}</span>
                            {cat.key === 'transportation' && (
                              <button onClick={() => setIsTransportModalOpen(true)} className="text-xs text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors">Edit</button>
                            )}
                            {cat.key === 'accommodation' && (
                              <button onClick={() => setIsAccModalOpen(true)} className="text-xs text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors">Edit</button>
                            )}
                          </div>
                        </div>
                        <div className="font-semibold text-charcoal dark:text-white text-right break-words max-w-[150px] sm:max-w-[200px] tabular-nums">
                          {cat.text}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4 mt-8">
                <Button variant="outline" className="w-full h-12 text-sm font-semibold rounded-xl" onClick={() => setIsExpenseModalOpen(true)}><Plus className="w-4 h-4 mr-2"/> Expense</Button>
                <Button variant="outline" className="w-full h-12 text-sm font-semibold rounded-xl" onClick={() => setIsDiscountModalOpen(true)}><Tag className="w-4 h-4 mr-2"/> Discount</Button>
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
              <img 
                src={place.image_url || place.image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMTUwIDE1MCI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjYWFhYWFhIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='} 
                className="w-20 h-20 rounded-lg object-cover bg-gray-100"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMTUwIDE1MCI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjYWFhYWFhIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                }}
              />
              <div className="flex-1">
                <h4 className="font-bold text-charcoal dark:text-white">{place.name}</h4>
                <p className="text-xs text-muted mb-1">
                  {place.category} • {place.distance ? `${place.distance} km` : ''} • {place.travel_time || `${place.recommendedTimeHours || 2}h`}
                </p>
                <p className="text-xs text-muted mb-2">
                  Entry: {place.entry_fee_raw ? `₹${place.entry_fee_raw}` : (place.entry_fee == 0 ? 'Free' : `₹${place.entry_fee}`)}
                  {place.local_transport_mode ? ` | Access: ${place.local_transport_mode} (${place.transport_estimate_raw})` : ''}
                </p>
                <Button 
                  size="sm" 
                  variant={trip.places.map(String).includes(String(place.id)) ? "outline" : "primary"} 
                  className="w-full text-xs h-8"
                  onClick={() => togglePlace(place.id)}
                >
                  {trip.places.map(String).includes(String(place.id)) ? 'Remove' : 'Add to Trip'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isTransportModalOpen} onClose={() => setIsTransportModalOpen(false)} title={`Transport: ${trip.source} to ${dest.name}`}>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {route && route.options && route.options.length > 0 ? route.options.map((opt: any) => (
            <button key={opt.id} onClick={() => changeTransport(opt.id)} className={`w-full p-4 rounded-xl flex justify-between items-center border-2 transition-all text-left ${String(trip.transportId) === String(opt.id) ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-300'}`}>
              <div>
                <p className="font-bold text-charcoal dark:text-white capitalize">{opt.mode || opt.transport_type}</p>
                <p className="text-sm text-muted">
                  {opt.duration || 'Flexible'} 
                  {opt.distance_km ? ` • ${opt.distance_km} km` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">₹{opt.typical_price || opt.price}</p>
                <p className="text-xs text-muted">{(opt.pricing_type || opt.pricingType) === 'per_vehicle' ? 'per vehicle' : 'per person'}</p>
                {opt.min_price && opt.max_price && (
                  <p className="text-[10px] text-muted">Range: ₹{opt.min_price}–{opt.max_price}</p>
                )}
              </div>
            </button>
          )) : <p className="text-muted p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-xl">No transport options available for this route.</p>}
        </div>
      </Modal>

      <Modal isOpen={isAccModalOpen} onClose={() => setIsAccModalOpen(false)} title={`Accommodation in ${dest.name}`}>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {destAccs.map(acc => (
            <button key={acc.id} onClick={() => changeAccommodation(acc.id)} className={`w-full p-4 rounded-xl flex justify-between items-center border-2 transition-all text-left ${String(trip.accommodationId) === String(acc.id) ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-300'}`}>
              <div>
                <p className="font-bold text-charcoal dark:text-white">{acc.name}</p>
                <p className="text-sm text-muted capitalize">{(acc.type || acc.hotel_type || '').replace(/_/g, ' ')} • <span className="text-yellow-500">★</span> {acc.rating ? Number(acc.rating).toFixed(1) : '4.5'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-primary">₹{acc.pricePerNight || acc.price_per_night}</p>
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
