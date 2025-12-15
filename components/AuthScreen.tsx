import React, { useState } from 'react';
import { Moon } from 'lucide-react';

interface AuthScreenProps {
  onLogin: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // Simple hardcoded password for demo purposes. 
  // In a real app, verify against a backend or hash.
  const ACCESS_CODE = "AURA";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ACCESS_CODE) {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000); // Reset error shake
    }
  };

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambient Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md space-y-8 text-center">
        
        {/* Logo / Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full border border-gold/30 flex items-center justify-center bg-surface/50 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
            <Moon size={32} className="text-gold" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-serif text-gold tracking-[0.2em] mb-2">LUNA</h1>
          <p className="text-zinc-500 text-sm font-light tracking-wide">SECURE LINK ESTABLISHED</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ENTER ACCESS CODE"
              className={`
                w-full bg-surface/30 border-b ${error ? 'border-red-500 text-red-400' : 'border-gold/30 text-gold'} 
                py-3 text-center tracking-[0.3em] font-serif placeholder-zinc-700 outline-none 
                focus:border-gold transition-colors duration-500 uppercase
              `}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-none border border-gold/20 hover:bg-gold/10 hover:border-gold/50 text-gold/80 hover:text-gold transition-all duration-300 font-serif tracking-widest text-xs uppercase"
          >
            Initiate Sequence
          </button>
        </form>
        
        {error && (
            <p className="text-red-500/50 text-xs tracking-widest animate-pulse">ACCESS DENIED</p>
        )}
      </div>
      
      <div className="absolute bottom-8 text-[10px] text-zinc-800 tracking-[0.5em]">AURA HERITAGE SYSTEM</div>
    </div>
  );
};

export default AuthScreen;