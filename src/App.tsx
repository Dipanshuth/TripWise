import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Plan } from './pages/Plan';
import { DestinationDetails } from './pages/DestinationDetails';
import { TripResult } from './pages/TripResult';
import { MyTrips } from './pages/MyTrips';
import { Saved } from './pages/Saved';
import { Profile } from './pages/Profile';
import { Accommodation } from './pages/Accommodation';
import { Transport } from './pages/Transport';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Placeholder Pages

import { motion } from 'framer-motion';

import { TripProvider } from './context/TripContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
    <ToastProvider>
      <TripProvider>
        <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="explore" element={<Explore />} />
              <Route path="plan" element={<Plan />} />
              <Route path="trip/:id" element={<TripResult />} />
              <Route path="destinations/:slug" element={<DestinationDetails />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="my-trips" element={<MyTrips />} />
              <Route path="saved" element={<Saved />} />
              <Route path="profile" element={<Profile />} />
              <Route path="accommodation" element={<Accommodation />} />
              <Route path="transport" element={<Transport />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </motion.div>
    </TripProvider>
    </ToastProvider>
    </AuthProvider>
  );
}

export default App;
