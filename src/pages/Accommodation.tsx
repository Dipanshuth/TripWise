import { MapPin, Wifi, Car, Coffee, Utensils, Mountain } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { mockAccommodations } from '@/data/accommodations';
import { Accommodation as AccType } from '@/types';

const iconMap: Record<string, React.ReactNode> = {
  'WiFi': <Wifi className="w-4 h-4" />,
  'Parking': <Car className="w-4 h-4" />,
  'Breakfast': <Coffee className="w-4 h-4" />,
  'Kitchen': <Utensils className="w-4 h-4" />,
  'Mountain View': <Mountain className="w-4 h-4" />,
};

export function Accommodation() {
  return (
    <div className="pt-24 px-4 max-w-7xl mx-auto pb-20">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2">Where should you stay?</h1>
        <p className="text-muted dark:text-gray-400">Compare and choose the best accommodation for your trip.</p>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto hide-scrollbar pb-2">
        <Button variant="outline" className="whitespace-nowrap">Price</Button>
        <Button variant="outline" className="whitespace-nowrap">Rating</Button>
        <Button variant="outline" className="whitespace-nowrap">Area</Button>
        <Button variant="outline" className="whitespace-nowrap">Type</Button>
        <Button variant="outline" className="whitespace-nowrap">Amenities</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockAccommodations.map((hotel: AccType) => (
          <Card key={hotel.id} className="group overflow-hidden">
            <div className="relative h-56 overflow-hidden">
              <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute top-4 right-4">
                <Badge variant="primary" className="bg-white/90 backdrop-blur-sm text-charcoal dark:text-white shadow-sm">
                  <span className="text-yellow-500 mr-1 font-bold">★</span> {hotel.rating}
                </Badge>
              </div>
            </div>
            <CardContent className="p-5 flex flex-col h-[calc(100%-14rem)]">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-bold text-charcoal dark:text-white">{hotel.name}</h3>
                  <p className="text-sm text-muted dark:text-gray-400">{hotel.type}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">₹{hotel.pricePerNight}</div>
                  <div className="text-xs text-muted dark:text-gray-400">Estimated price / night</div>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-charcoal dark:text-white mb-4">
                <MapPin className="w-4 h-4 mr-1 text-muted dark:text-gray-400" />
                {hotel.distanceFromCenter}
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                {hotel.amenities.map((amenity: string) => (
                  <div key={amenity} className="flex items-center text-xs text-muted dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md" title={amenity}>
                    {iconMap[amenity]} <span className="ml-1 hidden sm:inline">{amenity}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                <Button className="w-full">Select Hotel</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
