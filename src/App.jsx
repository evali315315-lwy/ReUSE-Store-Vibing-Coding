import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import About from './pages/About';
import Statistics from './pages/Statistics';
import Donations from './pages/Donations';
import PhotoVerification from './pages/PhotoVerification';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<About />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="donations" element={<Donations />} />
          <Route path="verification" element={<PhotoVerification />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
