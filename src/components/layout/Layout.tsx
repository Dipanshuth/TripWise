import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      {/* Simple Footer for now */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/60">© 2024 TripWise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
