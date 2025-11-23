import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, LockKeyhole } from 'lucide-react';

interface AccessGateProps {
  onUnlock: () => void;
}

const AccessGate: React.FC<AccessGateProps> = ({ onUnlock }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === 'sslssl') {
      onUnlock();
    } else {
      setError(true);
      setCode('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-gray-700">
            <LockKeyhole className="w-10 h-10 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Restricted Access</h1>
          <p className="text-gray-400">Please enter the site access code to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative group">
            <input
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(false);
              }}
              placeholder="Access Code"
              className={`w-full bg-gray-800 text-white placeholder-gray-500 px-6 py-4 rounded-xl border-2 outline-none transition-all font-mono text-lg tracking-widest text-center ${
                error 
                  ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                  : 'border-gray-700 focus:border-indigo-500 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)]'
              }`}
              autoFocus
            />
            <div className="absolute inset-y-0 right-3 flex items-center">
              <button
                type="submit"
                disabled={!code}
                className="p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 disabled:opacity-0 disabled:scale-75 transition-all duration-300"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {error && (
            <div className="absolute -bottom-8 left-0 w-full text-center text-red-500 text-sm font-medium animate-pulse flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Access Denied</span>
            </div>
          )}
        </form>

        <div className="mt-12 text-center">
          <p className="text-gray-600 text-xs uppercase tracking-widest">Secured Environment</p>
        </div>
      </div>
    </div>
  );
};

export default AccessGate;