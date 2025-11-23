import React from 'react';
import { Topic, DifficultyLevel } from '../types';
import { Sparkles, ArrowRight, Gauge } from 'lucide-react';

interface TopicSelectorProps {
  topics: Topic[];
  selectedLevel: DifficultyLevel;
  onSelectLevel: (level: DifficultyLevel) => void;
  onSelectTopic: (topic: Topic) => void;
  isLoading: boolean;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ 
  topics, 
  selectedLevel,
  onSelectLevel,
  onSelectTopic, 
  isLoading 
}) => {
  
  const levels: { id: DifficultyLevel; label: string; desc: string }[] = [
    { id: 'A1', label: 'A1', desc: 'Beginner' },
    { id: 'A2', label: 'A2', desc: 'Elementary' },
    { id: 'B1', label: 'B1', desc: 'Intermediate' },
    { id: 'B2', label: 'B2', desc: 'Upper Int.' },
    { id: 'C1', label: 'C1', desc: 'Advanced' },
    { id: 'C2', label: 'C2', desc: 'Mastery' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-serif font-bold text-gray-800 mb-4">
          Today's Reading Selection
        </h1>
        <p className="text-gray-500 text-lg">
          Choose a level and a topic to generate your personalized daily news report.
        </p>
      </div>

      {/* Level Selector */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-10">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-bold">
          <Gauge className="w-5 h-5 text-indigo-600" />
          <span>Select Difficulty Level</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {levels.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => onSelectLevel(lvl.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                selectedLevel === lvl.id
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg font-bold">{lvl.label}</span>
              <span className="text-[10px] uppercase tracking-wide opacity-80">{lvl.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic)}
              className="bg-white group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-2xl p-6 border border-gray-100 text-left flex flex-col h-full shadow-sm"
            >
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold tracking-wide uppercase">
                  {topic.category}
                </span>
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-3 group-hover:text-indigo-700 transition-colors">
                {topic.title}
              </h3>
              <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed">
                {topic.description}
              </p>
              <div className="flex items-center text-indigo-600 font-medium text-sm mt-auto">
                <span>Start Reading</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicSelector;