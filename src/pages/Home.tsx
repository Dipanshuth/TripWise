import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { MapPin, Calendar, Users, Briefcase, Search, Heart, Clock } from 'lucide-react';
import { mockDestinations } from '@/data/destinations';
import { Reveal } from '@/components/ui/Reveal';

export function Home() {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center pt-20">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0" 
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80)' }}
        >
          <div className="absolute inset-0 bg-primary/40"></div>
        </div>
        
        <Reveal><div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-[-100px]">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Travel planning,<br />without the research.
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Tell us where you're going and we'll help you figure out what to see, where to stay and how much your trip could cost.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/plan')} className="w-full sm:w-auto">Plan My Trip</Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/explore')} className="w-full sm:w-auto">Explore Destinations</Button>
          </div>
        </div></Reveal>
      </section>

      {/* Floating Planner Card */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 -mt-24 mb-16 w-full">
        <Reveal delay={0.2}><Card className="p-2 sm:p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 md:p-2 items-center">
            <div className="relative border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 pb-4 md:pb-0 md:pr-4">
              <label className="text-xs font-semibold text-muted uppercase mb-1 block">From</label>
              <div className="flex items-center text-charcoal dark:text-white font-medium">
                <MapPin className="w-4 h-4 mr-2 text-primary" />
                <input type="text" defaultValue="Delhi" className="w-full outline-none bg-transparent" />
              </div>
            </div>
            <div className="relative border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 pb-4 md:pb-0 md:pr-4 md:pl-4">
              <label className="text-xs font-semibold text-muted uppercase mb-1 block">To</label>
              <div className="flex items-center text-charcoal dark:text-white font-medium">
                <Search className="w-4 h-4 mr-2 text-primary" />
                <input type="text" placeholder="Search destination..." className="w-full outline-none bg-transparent" />
              </div>
            </div>
            <div className="relative border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 pb-4 md:pb-0 md:pr-4 md:pl-4">
              <label className="text-xs font-semibold text-muted uppercase mb-1 block">Travellers</label>
              <div className="flex items-center text-charcoal dark:text-white font-medium">
                <Users className="w-4 h-4 mr-2 text-primary" />
                <input type="number" defaultValue={2} className="w-full outline-none bg-transparent" />
              </div>
            </div>
            <div className="relative border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 pb-4 md:pb-0 md:pr-4 md:pl-4">
              <label className="text-xs font-semibold text-muted uppercase mb-1 block">Days</label>
              <div className="flex items-center text-charcoal dark:text-white font-medium">
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                <input type="number" defaultValue={4} className="w-full outline-none bg-transparent" />
              </div>
            </div>
            <div className="relative pt-4 md:pt-0 md:pl-4 flex justify-end">
              <Button onClick={() => navigate('/plan')} className="w-full h-12">Plan Trip</Button>
            </div>
          </CardContent>
        </Card></Reveal>
      </section>

      {/* Popular Destinations */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <Reveal><div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-charcoal mb-2">Popular destinations</h2>
            <p className="text-muted">Explore the most loved places by our travellers.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/explore')} className="hidden sm:inline-flex">View all</Button>
        </div></Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockDestinations.map((dest, index) => (
            <Reveal key={dest.id} delay={index * 0.1}>
<div  
              className="group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-float transition-all border border-gray-100 flex flex-col"
              onClick={() => navigate(`/destinations/${dest.slug}`)}
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={dest.image} 
                  alt={dest.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-red-500 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center text-sm font-bold text-charcoal">
                  <span className="text-yellow-500 mr-1">★</span> {dest.rating}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-charcoal">{dest.name}</h3>
                  <span className="text-sm font-semibold text-primary">₹{dest.dailyBudget}/day</span>
                </div>
                <p className="text-sm text-muted mb-4">{dest.state}, {dest.country}</p>
                <p className="text-sm text-charcoal line-clamp-2 mb-4 flex-1">{dest.description}</p>
                <Button variant="outline" className="w-full mt-auto group-hover:bg-primary group-hover:text-white transition-colors">
                  View Destination
                </Button>
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      </section>
      {/* Coming Soon Section */}
      <section className="bg-charcoal dark:bg-gray-900 py-24 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">New Places Coming Soon</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg md:text-xl">
                We're constantly exploring new horizons. Here's a sneak peek at the breathtaking destinations we're adding next to our platform.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Kyoto, Japan', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80', desc: 'Ancient temples and serene gardens.' },
              { name: 'Santorini, Greece', image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&q=80', desc: 'Whitewashed houses overlooking the Aegean sea.' },
              { name: 'Swiss Alps', image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&q=80', desc: 'Majestic peaks and pristine alpine lakes.' }
            ].map((place, i) => (
              <Reveal key={place.name} delay={i * 0.15}>
                <div className="group relative rounded-3xl overflow-hidden aspect-[4/5] cursor-not-allowed shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/90 transition-all z-10 duration-500" />
                  <img 
                    src={place.image} 
                    alt={place.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                    <div className="bg-white/20 backdrop-blur-md self-start px-3 py-1.5 rounded-full text-xs font-bold text-white mb-4 flex items-center gap-1.5 border border-white/30 shadow-sm">
                      <Clock className="w-3.5 h-3.5" /> COMING SOON
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{place.name}</h3>
                    <div className="overflow-hidden">
                      <p className="text-white/80 text-base opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 h-0 group-hover:h-auto mt-2">
                        {place.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
