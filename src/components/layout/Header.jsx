import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Leaf, ChevronDown, Users, Briefcase, Shield } from 'lucide-react';
import squirrelLogo from '../../assets/squirrel.svg';
import { useVersion } from '../../contexts/VersionContext';

function Header() {
  const { version, changeVersion } = useVersion();
  const [showDropdown, setShowDropdown] = useState(false);

  const versions = [
    { id: 'public', name: 'General Public', icon: Users, color: 'text-blue-500' },
    { id: 'worker', name: 'Student Worker', icon: Briefcase, color: 'text-green-500' },
    { id: 'admin', name: 'Administrator', icon: Shield, color: 'text-purple-500' }
  ];

  const currentVersion = versions.find(v => v.id === version);
  const CurrentIcon = currentVersion.icon;

  const handleVersionChange = (newVersion) => {
    changeVersion(newVersion);
    setShowDropdown(false);
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
            {/* Public Tabs - Always visible */}
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
              to="/shop"
              className={({ isActive }) =>
                `px-4 py-2 rounded-md font-semibold transition-colors ${
                  isActive
                    ? 'bg-white text-eco-primary-600'
                    : 'hover:bg-eco-primary-500'
                }`
              }
            >
              Shop
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

            {/* Student Worker Tab - Visible for worker and admin versions */}
            {(version === 'worker' || version === 'admin') && (
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
            )}

            {/* Admin Tabs - Only visible for admin version */}
            {version === 'admin' && (
              <>
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
                <NavLink
                  to="/database"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-md font-semibold transition-colors ${
                      isActive
                        ? 'bg-white text-eco-primary-600'
                        : 'hover:bg-eco-primary-500'
                    }`
                  }
                >
                  Database
                </NavLink>
              </>
            )}

            {/* Version Switcher Dropdown */}
            <div className="relative ml-4">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md font-semibold transition-colors border border-white/30"
              >
                <CurrentIcon className="w-4 h-4" />
                <span className="hidden md:inline">{currentVersion.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  {versions.map((v) => {
                    const Icon = v.icon;
                    const isSelected = version === v.id;

                    return (
                      <button
                        key={v.id}
                        onClick={() => handleVersionChange(v.id)}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors text-left ${
                          isSelected ? 'bg-eco-primary-50' : ''
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${v.color}`} />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{v.name}</div>
                        </div>
                        {isSelected && (
                          <div className="text-xs bg-eco-primary-600 text-white px-2 py-1 rounded-full">
                            ACTIVE
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  );
}

export default Header;
