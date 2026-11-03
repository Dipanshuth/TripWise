import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plane, Search, Bookmark, User, Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '../ui/Button';
import { SearchModal } from '../ui/SearchModal';

import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // If on home page, make navbar transparent initially
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Explore', path: '/explore' },
    { name: 'Plan a Trip', path: '/plan' },
    { name: 'My Trips', path: '/my-trips' },
  ];

  const navbarClasses = cn(
    'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent',
    {
      'bg-white/80 backdrop-blur-md border-gray-200/50 shadow-sm py-3': isScrolled || !isHome,
      'bg-transparent py-5': !isScrolled && isHome,
    }
  );

  const textClasses = cn(
    'font-medium transition-colors hover:text-accent',
    {
      'text-white': !isScrolled && isHome,
      'text-charcoal': isScrolled || !isHome,
    }
  );

  return (
    <>
      <nav className={navbarClasses}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className={cn("flex items-center space-x-2 text-xl font-bold", isScrolled || !isHome ? "text-primary" : "text-white")}>
              <Plane className={cn("w-6 h-6", isScrolled || !isHome ? "text-accent" : "text-white")} />
              <span>TripWise</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} className={textClasses}>
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className={cn("p-2 rounded-full hover:bg-black/5 transition-colors", textClasses)}
              >
                <Search className="w-5 h-5" />
              </button>
              <Link to="/saved" className={cn("p-2 rounded-full hover:bg-black/5 transition-colors", textClasses)}>
                <Bookmark className="w-5 h-5" />
              </Link>
              <Link to="/profile" className={cn("p-2 rounded-full hover:bg-black/5 transition-colors", textClasses)}>
                <User className="w-5 h-5" />
              </Link>
              {(!isScrolled && isHome) ? (
                <Button variant="secondary" className="ml-2" onClick={() => navigate('/plan')}>Get Started</Button>
              ) : null}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={textClasses}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-gray-100 py-4 px-4 flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className="text-charcoal font-medium py-2 border-b border-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex space-x-4 pt-4">
              {isAuthenticated ? (
                  <Button variant="outline" className="flex-1" onClick={() => navigate('/profile')}>Profile</Button>
              ) : (
                  <Button variant="outline" className="flex-1" onClick={() => navigate('/login')}>Log in</Button>
              )}
              <Button className="flex-1" onClick={() => navigate('/plan')}>Get Started</Button>
            </div>
          </div>
        )}
      </nav>
      
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
