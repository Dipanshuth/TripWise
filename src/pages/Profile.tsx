import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Heart, Plane } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTrips } from '@/context/TripContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { updateProfile, logout } from '@/services/apiService';
import { useToast } from '@/context/ToastContext';

export function Profile() {
  const navigate = useNavigate();
  const { trips, savedPlaces } = useTrips();
  const { currentUser, isAuthenticated, loading, setCurrentUser } = useAuth();
  const { toast } = useToast();
  const countriesExplored = new Set(trips.map(t => t.destinationId)).size;
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    budget_style: 'balanced',
    preferred_trip_length: 7,
    favourite_destination: ''
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
        navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        display_name: currentUser.profile?.display_name || currentUser.username,
        budget_style: currentUser.profile?.budget_style || 'balanced',
        preferred_trip_length: currentUser.profile?.preferred_trip_length || 7,
        favourite_destination: currentUser.profile?.favourite_destination || ''
      });
    }
  }, [currentUser]);

  const handleSaveProfile = async () => {
    try {
      const res = await updateProfile(editForm);
      if (res.success && currentUser) {
        setCurrentUser({
            ...currentUser,
            profile: res.profile
        });
        toast('Profile updated', 'success');
      }
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setIsEditModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      toast('Logged out', 'success');
      navigate('/');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  if (loading || !currentUser) return <div className="pt-24 text-center">Loading...</div>;

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
        <img 
          src={currentUser.profile?.profile_image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} 
          alt={currentUser.username} 
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-soft"
        />
        <div className="text-center md:text-left flex-1">
          <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2">{currentUser.profile?.display_name || currentUser.username}</h1>
          <p className="text-muted dark:text-gray-400 text-lg mb-6">{currentUser.email}</p>
          <div className="flex gap-4 justify-center md:justify-start">
              <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>Edit Profile</Button>
              <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={handleLogout}>Log Out</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardContent className="p-6 text-center">
            <Plane className="w-8 h-8 mx-auto text-primary mb-3" />
            <h3 className="text-3xl font-bold text-charcoal dark:text-white mb-1">{trips.length}</h3>
            <p className="text-sm text-muted dark:text-gray-400 uppercase font-medium">Trips Planned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Heart className="w-8 h-8 mx-auto text-red-500 mb-3" />
            <h3 className="text-3xl font-bold text-charcoal dark:text-white mb-1">{savedPlaces.length}</h3>
            <p className="text-sm text-muted dark:text-gray-400 uppercase font-medium">Places Saved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Map className="w-8 h-8 mx-auto text-accent mb-3" />
            <h3 className="text-3xl font-bold text-charcoal dark:text-white mb-1">{countriesExplored}</h3>
            <p className="text-sm text-muted dark:text-gray-400 uppercase font-medium">Destinations Explored</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-6">Travel Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-muted dark:text-gray-400 mb-1">Budget Style</p>
              <p className="text-lg font-medium text-charcoal dark:text-white capitalize">{currentUser.profile?.budget_style}</p>
            </div>
            <div>
              <p className="text-sm text-muted dark:text-gray-400 mb-1">Preferred Trip Length</p>
              <p className="text-lg font-medium text-charcoal dark:text-white">{currentUser.profile?.preferred_trip_length} days</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted dark:text-gray-400 mb-2">Favourite Destinations</p>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-gray-100 dark:bg-gray-800 text-charcoal dark:text-white px-3 py-1 rounded-full text-sm font-medium">
                  {currentUser.profile?.favourite_destination || 'None'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Profile">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-charcoal dark:text-white mb-1 block">Name</label>
            <Input 
              value={editForm.display_name} 
              onChange={e => setEditForm({...editForm, display_name: e.target.value})} 
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-charcoal dark:text-white mb-1 block">Budget Style</label>
            <select 
              className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-primary focus:bg-white outline-none"
              value={editForm.budget_style} 
              onChange={e => setEditForm({...editForm, budget_style: e.target.value})}
            >
              <option value="budget">Budget</option>
              <option value="balanced">Balanced</option>
              <option value="comfort">Comfort</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-charcoal dark:text-white mb-1 block">Preferred Trip Length (days)</label>
            <Input 
              type="number"
              value={editForm.preferred_trip_length} 
              onChange={e => setEditForm({...editForm, preferred_trip_length: parseInt(e.target.value) || 7})} 
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-charcoal dark:text-white mb-1 block">Favourite Destination</label>
            <Input 
              value={editForm.favourite_destination} 
              onChange={e => setEditForm({...editForm, favourite_destination: e.target.value})} 
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSaveProfile}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
