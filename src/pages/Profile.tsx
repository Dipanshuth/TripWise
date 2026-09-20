import { useState, useEffect } from 'react';
import { Map, Heart, Plane } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { mockUser } from '@/data/user';
import { useTrips } from '@/context/TripContext';
import { storageService } from '@/services/storageService';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export function Profile() {
  const { trips, savedPlaces } = useTrips();
  const countriesExplored = new Set(trips.map(t => t.destinationId)).size;
  
  const [user, setUser] = useState(mockUser);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(mockUser);

  useEffect(() => {
    const savedProfile = storageService.getUserProfile();
    if (savedProfile) {
      setUser(savedProfile);
      setEditForm(savedProfile);
    }
  }, []);

  const handleSaveProfile = () => {
    setUser(editForm);
    storageService.saveUserProfile(editForm);
    setIsEditModalOpen(false);
  };

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
        <img 
          src={user.avatar} 
          alt={user.name} 
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-soft"
        />
        <div className="text-center md:text-left flex-1">
          <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2">{user.name}</h1>
          <p className="text-muted dark:text-gray-400 text-lg mb-6">{user.email}</p>
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>Edit Profile</Button>
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
              <p className="text-lg font-medium text-charcoal dark:text-white">{user.preferences.budgetStyle}</p>
            </div>
            <div>
              <p className="text-sm text-muted dark:text-gray-400 mb-1">Preferred Trip Length</p>
              <p className="text-lg font-medium text-charcoal dark:text-white">{user.preferences.preferredLength} days</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted dark:text-gray-400 mb-2">Favourite Destinations</p>
              <div className="flex gap-2 flex-wrap">
                {user.preferences.favouriteTypes.map(type => (
                  <span key={type} className="bg-gray-100 dark:bg-gray-800 text-charcoal dark:text-white px-3 py-1 rounded-full text-sm font-medium">
                    {type}
                  </span>
                ))}
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
              value={editForm.name} 
              onChange={e => setEditForm({...editForm, name: e.target.value})} 
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-charcoal dark:text-white mb-1 block">Email</label>
            <Input 
              type="email"
              value={editForm.email} 
              onChange={e => setEditForm({...editForm, email: e.target.value})} 
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-charcoal dark:text-white mb-1 block">Budget Style</label>
            <select 
              className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-primary focus:bg-white outline-none"
              value={editForm.preferences.budgetStyle} 
              onChange={e => setEditForm({...editForm, preferences: {...editForm.preferences, budgetStyle: e.target.value as any}})}
            >
              <option value="Budget">Budget</option>
              <option value="Balanced">Balanced</option>
              <option value="Comfort">Comfort</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-charcoal dark:text-white mb-1 block">Preferred Trip Length (days)</label>
            <Input 
              type="number"
              value={editForm.preferences.preferredLength} 
              onChange={e => setEditForm({...editForm, preferences: {...editForm.preferences, preferredLength: parseInt(e.target.value)}})} 
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-charcoal dark:text-white mb-1 block">Favourite Destinations (comma separated)</label>
            <Input 
              value={editForm.preferences.favouriteTypes.join(', ')} 
              onChange={e => setEditForm({...editForm, preferences: {...editForm.preferences, favouriteTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}})} 
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
