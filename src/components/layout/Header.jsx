import { NavLink, useNavigate } from 'react-router-dom';
import { Leaf, LogIn, LogOut, Shield, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import squirrelLogo from '../../assets/squirrel.svg';
import { useAuth } from '../../contexts/AuthContext';

function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      toast.success('Logged out successfully');
      navigate('/');
    } else {
      toast.error('Failed to logout');
    }
  };

  return (
    <header className="bg-gradient-to-r from-eco-primary-600 via-eco-teal to-eco-primary-700 text-white shadow-lg">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand with Squirrel */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-white rounded-full blur-md opacity-20"></div>
              <img src={squirrelLogo} alt="Black Squirrel Mascot" className="w-12 h-12 relative z-10" />
            </div>
            <Leaf className="w-8 h-8" />
            <h1 className="text-2xl font-bold font-display">ReUSE Store</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-4">
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

            {isAuthenticated ? (
              <>
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

                {/* Role Badge */}
                <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                  {isAdmin ? (
                    <>
                      <Shield className="w-4 h-4" />
                      <span className="font-semibold">Admin</span>
                    </>
                  ) : (
                    <>
                      <UserCircle className="w-4 h-4" />
                      <span className="font-semibold">Worker</span>
                    </>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md font-semibold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors ${
                    isActive
                      ? 'bg-white text-eco-primary-600'
                      : 'bg-white/10 hover:bg-white/20'
                  }`
                }
              >
                <LogIn className="w-4 h-4" />
                Login
              </NavLink>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
