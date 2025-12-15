import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import AuthScreen from './components/AuthScreen';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session persistence
    const session = localStorage.getItem('luna_session');
    if (session === 'active') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    localStorage.setItem('luna_session', 'active');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('luna_session');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <div className="bg-[#050505] min-h-screen"></div>;
  }

  return (
    <React.StrictMode>
      {isAuthenticated ? (
        <ChatInterface onLogout={handleLogout} />
      ) : (
        <AuthScreen onLogin={handleLogin} />
      )}
    </React.StrictMode>
  );
};

export default App;