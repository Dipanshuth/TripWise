import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Building, Map, X } from 'lucide-react';
import { searchDestinations, searchPlaces, searchAccommodations } from '@/services/apiService';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [destResults, setDestResults] = useState<any[]>([]);
  const [placeResults, setPlaceResults] = useState<any[]>([]);
  const [accResults, setAccResults] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setDestResults([]);
      setPlaceResults([]);
      setAccResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [dests, places, accs] = await Promise.all([
          searchDestinations(debouncedQuery),
          debouncedQuery ? searchPlaces(debouncedQuery) : Promise.resolve({ results: [] }),
          debouncedQuery ? searchAccommodations({ q: debouncedQuery }) : Promise.resolve({ results: [] })
        ]);
        setDestResults(dests.results || []);
        setPlaceResults(places.results || []);
        setAccResults(accs.results || []);
      } catch (err) {
        console.error('Search failed', err);
      }
    };
    if (isOpen) {
      fetchResults();
    }
  }, [debouncedQuery, isOpen]);

  if (!isOpen) return null;

  const handleSelectDestination = (slug: string) => {
    navigate(`/destinations/${slug}`);
    onClose();
  };

  const handleSelectPlaceOrAcc = (destinationSlug: string) => {
    navigate(`/destinations/${destinationSlug}`);
    onClose();
  };

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
                else if (placeResults.length > 0) handleSelectPlaceOrAcc(placeResults[0].destination_slug);
                else if (accResults.length > 0) handleSelectPlaceOrAcc(accResults[0].destination_slug);
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
                return (
                  <button
                    key={place.id}
                    className="w-full flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-left"
                    onClick={() => handleSelectPlaceOrAcc(place.destination_slug)}
                  >
                    <MapPin className="w-5 h-5 text-red-500 mr-4 shrink-0" />
                    <div>
                      <div className="font-semibold text-charcoal dark:text-white">{place.name}</div>
                      <div className="text-xs text-muted">{place.destination} • {place.category}</div>
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
                return (
                  <button
                    key={acc.id}
                    className="w-full flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-left"
                    onClick={() => handleSelectPlaceOrAcc(acc.destination_slug)}
                  >
                    <Building className="w-5 h-5 text-purple-500 mr-4 shrink-0" />
                    <div>
                      <div className="font-semibold text-charcoal dark:text-white">{acc.name}</div>
                      <div className="text-xs text-muted">{acc.destination} • {acc.hotel_type}</div>
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
