import React, { useState, useRef } from 'react';
import { Shield, Key, Download, Upload, Trash2, Check, AlertTriangle, FileJson, Loader2 } from 'lucide-react';
import { UserHistory, VocabItem } from '../types';

interface SettingsViewProps {
  history: UserHistory;
  vocabList: VocabItem[];
  onImportData: (history: UserHistory, vocab: VocabItem[]) => void;
  onClearData: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ history, vocabList, onImportData, onClearData }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [hasPin, setHasPin] = useState(() => !!localStorage.getItem('english_app_pin'));
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      showMessage('error', 'PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      showMessage('error', 'PINs do not match');
      return;
    }
    localStorage.setItem('english_app_pin', pin);
    setHasPin(true);
    setPin('');
    setConfirmPin('');
    showMessage('success', 'Passcode protection enabled');
  };

  const handleRemovePin = () => {
    if (window.confirm("Are you sure you want to remove the security passcode?")) {
      localStorage.removeItem('english_app_pin');
      setHasPin(false);
      showMessage('success', 'Passcode removed');
    }
  };

  const handleExport = () => {
    const data = {
      history,
      vocabList,
      exportDate: new Date().toISOString(),
      version: 1
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-english-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('success', 'Data exported successfully');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.history && Array.isArray(json.vocabList)) {
          if (window.confirm(`Found ${Object.keys(json.history).length} articles and ${json.vocabList.length} words. This will REPLACE your current data. Continue?`)) {
            onImportData(json.history, json.vocabList);
            showMessage('success', 'Data restored successfully');
          }
        } else {
          showMessage('error', 'Invalid backup file format');
        }
      } catch (err) {
        showMessage('error', 'Failed to parse file');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Settings & Data</h1>
        <p className="text-gray-500 mt-1">Manage app security and synchronize your data.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Security Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Security</h2>
                <p className="text-gray-500 text-sm mt-1">Protect your learning progress with a passcode.</p>
              </div>
            </div>

            {hasPin ? (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-green-800">Passcode is enabled</span>
                </div>
                <button 
                  onClick={handleRemovePin}
                  className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline"
                >
                  Remove Passcode
                </button>
              </div>
            ) : (
              <form onSubmit={handleSetPin} className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Passcode</label>
                  <input 
                    type="password" 
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0,6))}
                    placeholder="Enter 4-6 digits"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Passcode</label>
                  <input 
                    type="password" 
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0,6))}
                    placeholder="Re-enter digits"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!pin || pin.length < 4 || pin !== confirmPin}
                  className="bg-gray-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Set Passcode
                </button>
              </form>
            )}
          </div>

          {/* Data Sync Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <FileJson className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Data Sync & Backup</h2>
                <p className="text-gray-500 text-sm mt-1">Export your data to transfer it to another device or keep a backup.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
               <button 
                 onClick={handleExport}
                 className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
               >
                 <Download className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 mb-3" />
                 <span className="font-bold text-gray-900">Export Backup</span>
                 <span className="text-xs text-gray-500 mt-1">Download .json file</span>
               </button>

               <button 
                 onClick={handleImportClick}
                 className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all group"
               >
                 <Upload className="w-8 h-8 text-gray-400 group-hover:text-amber-600 mb-3" />
                 <span className="font-bold text-gray-900">Import Data</span>
                 <span className="text-xs text-gray-500 mt-1">Restore from .json file</span>
               </button>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileChange} 
                 accept=".json" 
                 className="hidden" 
               />
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
               <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Database Stats: {Object.keys(history).length} articles, {vocabList.length} words.
                  </span>
                  <button 
                    onClick={() => {
                      if(window.confirm("DANGER: This will delete ALL your history and vocabulary. This cannot be undone. Are you sure?")) {
                        onClearData();
                        showMessage('success', 'All data cleared');
                      }
                    }}
                    className="text-red-500 text-sm hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear All Data
                  </button>
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* Toast Message */}
      {message && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-slide-up z-50 ${
           message.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}
    </div>
  );
};

export default SettingsView;