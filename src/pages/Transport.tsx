import { useState } from 'react';
import { Bus, Train, Car, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { mockRoutes } from '@/data/transport';

const iconMap: Record<string, React.ReactNode> = {
  'BUS': <Bus className="w-8 h-8" />,
  'TRAIN + BUS': <Train className="w-8 h-8" />,
  'PRIVATE CAB': <Car className="w-8 h-8" />,
  'OWN VEHICLE': <Navigation className="w-8 h-8" />,
};

export function Transport() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto pb-20">
      <div className="mb-10 text-center">
        <Badge variant="accent" className="mb-4">Delhi → Kullu</Badge>
        <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2">How do you want to travel?</h1>
        <p className="text-muted dark:text-gray-400">Compare options and pick what suits you best.</p>
      </div>

      <div className="space-y-4">
        {mockRoutes[0]?.options.map((option: any) => (
          <Card 
            key={option.id} 
            className={`cursor-pointer transition-all border-2 ${selectedId === option.id ? 'border-primary shadow-float' : 'border-transparent hover:border-gray-200 dark:border-gray-700 shadow-sm'}`}
            onClick={() => setSelectedId(option.id)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-xl ${selectedId === option.id ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-charcoal dark:text-white'}`}>
                    {iconMap[option.mode.toUpperCase()] || <Navigation className="w-8 h-8" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-charcoal dark:text-white">{option.mode}</h3>
                      {option.recommended && (
                        <Badge variant="primary" className="text-[10px] px-2 py-0">RECOMMENDED</Badge>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-muted dark:text-gray-400">
                      <span>{option.duration}</span>
                      <span>•</span>
                      <span>Comfort: {option.comfort}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-4 sm:mt-0">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {option.pricingType === 'fixed' ? `Total ₹${option.price}` : `₹${option.price}/person`}
                  </div>
                  <Button variant={selectedId === option.id ? 'primary' : 'outline'}>
                    {selectedId === option.id ? 'Selected' : 'Select'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
