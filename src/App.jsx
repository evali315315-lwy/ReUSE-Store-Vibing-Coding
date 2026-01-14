import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { VersionProvider } from './contexts/VersionContext';
import Layout from './components/layout/Layout';
import About from './pages/About';
import Shop from './pages/Shop';
import Statistics from './pages/Statistics';
import Donations from './pages/Donations';
import PhotoVerification from './pages/PhotoVerification';
import FridgeInventory from './pages/FridgeInventory';

function App() {
  return (
    <BrowserRouter>
      <VersionProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<About />} />
            <Route path="shop" element={<Shop />} />
            <Route path="statistics" element={<Statistics />} />

            {/* Student Worker Routes */}
            <Route path="donations" element={<Donations />} />

            {/* Admin Routes */}
            <Route path="verification" element={<PhotoVerification />} />
            <Route path="fridges" element={<FridgeInventory />} />
          </Route>
        </Routes>
      </VersionProvider>
    </BrowserRouter>
  );
}

export default App;
