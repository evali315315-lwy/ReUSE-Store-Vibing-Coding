import { createContext, useContext, useState, useEffect } from 'react';

const VersionContext = createContext();

export const useVersion = () => {
  const context = useContext(VersionContext);
  if (!context) {
    throw new Error('useVersion must be used within VersionProvider');
  }
  return context;
};

export const VersionProvider = ({ children }) => {
  // Version types: 'public', 'worker', 'admin'
  const [version, setVersion] = useState(() => {
    // Get from localStorage or default to public
    return localStorage.getItem('platformVersion') || 'public';
  });

  // Save to localStorage whenever version changes
  useEffect(() => {
    localStorage.setItem('platformVersion', version);
  }, [version]);

  const changeVersion = (newVersion) => {
    setVersion(newVersion);
  };

  return (
    <VersionContext.Provider value={{ version, changeVersion }}>
      {children}
    </VersionContext.Provider>
  );
};
