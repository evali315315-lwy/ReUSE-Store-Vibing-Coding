import { NavLink } from 'react-router-dom';
import { Leaf } from 'lucide-react';

function Header() {
  return (
    <header className="bg-gradient-to-r from-eco-primary-600 to-eco-primary-700 text-white shadow-lg">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8" />
            <h1 className="text-2xl font-bold font-display">ReUSE Store</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-4 py-2 rounded-md font-semibold transition-colors ${
                  isActive
                    ? 'bg-white text-eco-primary-600'
                    : 'hover:bg-eco-primary-500'
                }`
              }
            >
              About
            </NavLink>
            <NavLink
              to="/statistics"
              className={({ isActive }) =>
                `px-4 py-2 rounded-md font-semibold transition-colors ${
                  isActive
                    ? 'bg-white text-eco-primary-600'
                    : 'hover:bg-eco-primary-500'
                }`
              }
            >
              Statistics
            </NavLink>
            <NavLink
              to="/donations"
              className={({ isActive }) =>
                `px-4 py-2 rounded-md font-semibold transition-colors ${
                  isActive
                    ? 'bg-white text-eco-primary-600'
                    : 'hover:bg-eco-primary-500'
                }`
              }
            >
              Log Donations
            </NavLink>
            <NavLink
              to="/verification"
              className={({ isActive }) =>
                `px-4 py-2 rounded-md font-semibold transition-colors ${
                  isActive
                    ? 'bg-white text-eco-primary-600'
                    : 'hover:bg-eco-primary-500'
                }`
              }
            >
              Photo Verification
            </NavLink>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
