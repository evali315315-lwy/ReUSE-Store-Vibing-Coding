import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import About from './pages/About';
import Shop from './pages/Shop';
import Statistics from './pages/Statistics';
import Donations from './pages/Donations';
import Login from './pages/Login';
import PhotoVerification from './pages/PhotoVerification';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<About />} />
            <Route path="shop" element={<Shop />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="login" element={<Login />} />
            <Route
              path="donations"
              element={
                <ProtectedRoute>
                  <Donations />
                </ProtectedRoute>
              }
            />
            <Route
              path="verification"
              element={
                <ProtectedRoute>
                  <PhotoVerification />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
