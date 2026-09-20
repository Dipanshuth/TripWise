import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Building, Map, X } from 'lucide-react';
import { mockDestinations } from '@/data/destinations';
import { mockPlaces } from '@/data/places';
import { mockAccommodations } from '@/data/accommodations';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSelectDestination = (slug: string) => {
    navigate(`/destinations/${slug}`);
    onClose();
  };

  const handleSelectPlaceOrAcc = (destinationId: string) => {
    const dest = mockDestinations.find(d => d.id === destinationId);
    if (dest) {
      navigate(`/destinations/${dest.slug}`);
      onClose();
    }
  };

  const lowerQuery = query.toLowerCase();

  const destResults = query 
    ? mockDestinations.filter(d => d.name.toLowerCase().includes(lowerQuery) || d.state.toLowerCase().includes(lowerQuery))
    : mockDestinations.slice(0, 4); // Popular destinations when empty

  const placeResults = query
    ? mockPlaces.filter(p => p.name.toLowerCase().includes(lowerQuery) || p.category.toLowerCase().includes(lowerQuery))
    : [];

  const accResults = query
    ? mockAccommodations.filter(a => a.name.toLowerCase().includes(lowerQuery))
    : [];

  const hasResults = destResults.length > 0 || placeResults.length > 0 || accResults.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-charcoal/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search destinations, places, accommodations..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-charcoal dark:text-white"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && hasResults) {
                if (destResults.length > 0) handleSelectDestination(destResults[0].slug);
                else if (placeResults.length > 0) handleSelectPlaceOrAcc(placeResults[0].destinationId);
                else if (accResults.length > 0) handleSelectPlaceOrAcc(accResults[0].destinationId);
              }
            }}
          />
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-2">
          {!query && (
            <div className="p-3 text-xs font-bold text-muted uppercase tracking-wider">Popular Destinations</div>
          )}
          
          {destResults.length > 0 && (
            <div className="mb-4">
              {query && <div className="px-3 py-2 text-xs font-bold text-primary uppercase tracking-wider">Destinations</div>}
              {destResults.map(dest => (
                <button
                  key={dest.id}
                  className="w-full flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-left"
                  onClick={() => handleSelectDestination(dest.slug)}
                >
                  <Map className="w-5 h-5 text-accent mr-4 shrink-0" />
                  <div>
                    <div className="font-semibold text-charcoal dark:text-white">{dest.name}</div>
                    <div className="text-xs text-muted">{dest.state}, {dest.country}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {placeResults.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs font-bold text-primary uppercase tracking-wider">Places & Activities</div>
              {placeResults.map(place => {
                const dest = mockDestinations.find(d => d.id === place.destinationId);
                return (
                  <button
                    key={place.id}
                    className="w-full flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-left"
                    onClick={() => handleSelectPlaceOrAcc(place.destinationId)}
                  >
                    <MapPin className="w-5 h-5 text-red-500 mr-4 shrink-0" />
                    <div>
                      <div className="font-semibold text-charcoal dark:text-white">{place.name}</div>
                      <div className="text-xs text-muted">{dest?.name} • {place.category}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {accResults.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs font-bold text-primary uppercase tracking-wider">Accommodations</div>
              {accResults.map(acc => {
                const dest = mockDestinations.find(d => d.id === acc.destinationId);
                return (
                  <button
                    key={acc.id}
                    className="w-full flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-left"
                    onClick={() => handleSelectPlaceOrAcc(acc.destinationId)}
                  >
                    <Building className="w-5 h-5 text-purple-500 mr-4 shrink-0" />
                    <div>
                      <div className="font-semibold text-charcoal dark:text-white">{acc.name}</div>
                      <div className="text-xs text-muted">{dest?.name} • {acc.type}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {query && !hasResults && (
            <div className="p-8 text-center text-muted">
              No results found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
