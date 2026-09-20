import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Copy, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTrips } from '@/context/TripContext';
import { mockDestinations } from '@/data/destinations';
import { budgetService } from '@/services/budgetService';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';

export function MyTrips() {
  const navigate = useNavigate();
  const { trips, deleteTrip, duplicateTrip } = useTrips();
  const { toast } = useToast();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);

  const confirmDelete = () => {
    if (tripToDelete) {
      deleteTrip(tripToDelete);
      toast('Trip deleted.', 'info');
      setIsDeleteModalOpen(false);
      setTripToDelete(null);
    }
  };

  return (
    <div className="pt-24 px-4 max-w-7xl mx-auto pb-20 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2">My Trips</h1>
          <p className="text-muted dark:text-gray-400">Manage your planned and saved trips.</p>
        </div>
        <Button onClick={() => navigate('/plan')}>+ Plan a New Trip</Button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-xl text-muted mb-6">You haven't planned a trip yet.</p>
          <Button onClick={() => navigate('/plan')}>Plan Your First Trip</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map(trip => {
            const dest = mockDestinations.find(d => d.id === trip.destinationId);
            if (!dest) return null;
            const summary = budgetService.calculateTripTotal(trip);

            return (
              <Card key={trip.id} className="group overflow-hidden">
                <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => navigate(`/trip/${trip.id}`)}>
                  <img src={dest.image} alt={dest.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Badge variant={trip.status === 'Saved' ? 'primary' : 'default'} className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-sm">
                      {trip.status}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-xl font-bold text-charcoal dark:text-white mb-1">{dest.name}</h3>
                  <p className="text-sm text-muted dark:text-gray-400 mb-4">{trip.source} → {dest.name}</p>
                  
                  <div className="grid grid-cols-2 gap-y-3 mb-6 text-sm text-charcoal dark:text-white font-medium">
                    <div className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-muted dark:text-gray-400" /> {trip.days} Days</div>
                    <div className="flex items-center"><Users className="w-4 h-4 mr-2 text-muted dark:text-gray-400" /> {trip.travellers} People</div>
                    <div className="flex items-center col-span-2 text-muted dark:text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      {trip.places.length} places
                    </div>
                    <div className="flex items-center text-primary font-bold col-span-2 mt-1 text-lg">
                      ₹{summary.total.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 text-xs" onClick={() => navigate(`/trip/${trip.id}`)}>View</Button>
                    <Button variant="outline" className="flex-1 text-xs px-2" onClick={() => { duplicateTrip(trip.id); toast('Trip duplicated!', 'success'); }}><Copy className="w-4 h-4" /></Button>
                    <Button variant="outline" className="flex-1 text-xs px-2" onClick={() => navigate(`/plan`)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="outline" className="flex-1 text-xs px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 border-gray-200" onClick={() => { setTripToDelete(trip.id); setIsDeleteModalOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Trip">
        <p className="text-charcoal dark:text-gray-300 mb-6">Are you sure you want to delete this trip? This action cannot be undone.</p>
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
          <Button className="flex-1 bg-red-500 hover:bg-red-600 border-none" onClick={confirmDelete}>Delete Trip</Button>
        </div>
      </Modal>
    </div>
  );
}
