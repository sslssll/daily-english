import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onUnlock: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = localStorage.getItem('english_app_pin');
    
    if (pin === storedPin) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-serif font-bold text-center text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-500 text-center mb-8 text-sm">Please enter your passcode to access your learning notebook.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                 // Only allow numbers
                 const val = e.target.value;
                 if (/^\d*$/.test(val) && val.length <= 6) {
                   setPin(val);
                   setError(false);
                 }
              }}
              placeholder="Enter PIN"
              className={`w-full text-center text-2xl tracking-[0.5em] py-3 border-2 rounded-xl outline-none transition-all font-bold ${
                error 
                  ? 'border-red-500 bg-red-50 text-red-600 placeholder-red-300' 
                  : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
              }`}
              autoFocus
            />
          </div>
          
          {error && (
            <div className="flex items-center justify-center gap-2 text-red-500 text-sm animate-shake">
              <AlertCircle className="w-4 h-4" />
              <span>Incorrect passcode</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!pin}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Unlock <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;