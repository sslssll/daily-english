import React from 'react';
import { UserHistory, AppView } from '../types';
import { Calendar, CheckCircle2, BookOpen, PanelLeftClose, BookA, Newspaper } from 'lucide-react';

interface SidebarLeftProps {
  history: UserHistory;
  selectedDate: string;
  currentView: AppView;
  onSelectDate: (date: string) => void;
  onNavigate: (view: AppView) => void;
  onClose?: () => void;
  className?: string;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({ 
  history, 
  selectedDate, 
  currentView,
  onSelectDate, 
  onNavigate,
  onClose, 
  className 
}) => {
  const dates = Object.keys(history).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={`bg-white border-r border-gray-200 h-full flex flex-col ${className}`}>
      
      {/* Brand / Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl">
            D
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800 leading-tight">Daily English</h2>
            <p className="text-[10px] text-gray-400 font-medium tracking-wide">LEARNING FLOW</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="p-3 space-y-1 border-b border-gray-100">
        <button
          onClick={() => onNavigate('READING')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'READING' 
              ? 'bg-indigo-50 text-indigo-700' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          Reading
        </button>
        <button
          onClick={() => onNavigate('NOTEBOOK')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'NOTEBOOK' 
              ? 'bg-amber-50 text-amber-700' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <BookA className="w-4 h-4" />
          Notebook
        </button>
      </div>

      {/* History Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-3 flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <Calendar className="w-3 h-3" />
          <span>Reading History</span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {dates.length === 0 && (
            <div className="text-center text-gray-400 mt-8 px-4">
              <p className="text-sm">No history yet.</p>
              <p className="text-xs mt-1">Start your first article!</p>
            </div>
          )}

          {dates.map((date) => {
            const isSelected = date === selectedDate && currentView === 'READING';
            const article = history[date];
            
            return (
              <button
                key={date}
                onClick={() => onSelectDate(date)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 group border ${
                  isSelected 
                    ? 'bg-white border-indigo-200 shadow-sm' 
                    : 'bg-transparent border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {date === today ? 'Today' : date}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-indigo-600" />}
                </div>
                <h3 className={`font-serif text-sm leading-snug line-clamp-2 ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                  {article.title}
                </h3>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Total Reads</span>
          </div>
          <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">
            {dates.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SidebarLeft;