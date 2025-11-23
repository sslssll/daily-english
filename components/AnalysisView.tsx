import React, { useState } from 'react';
import { ArticleAnalysis } from '../types';
import { BookOpen, Layers, Info, ArrowLeft } from 'lucide-react';

interface AnalysisViewProps {
  analysis: ArticleAnalysis;
  onBack: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onBack }) => {
  const [activeTab, setActiveTab] = useState<'sentences' | 'grammar'>('sentences');

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Article Analysis</h1>
            <p className="text-xs text-gray-500">Deep dive into grammar & meaning</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('sentences')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'sentences' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Sentence Breakdown
          </button>
          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'grammar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4" /> Grammar Points
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          
          {/* SENTENCE TAB */}
          {activeTab === 'sentences' && (
            <div className="space-y-4">
              {analysis.sentences.map((sent, idx) => (
                <div key={idx} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-3">
                      <p className="font-serif text-lg text-gray-900 leading-relaxed">{sent.original}</p>
                      <div className="h-px bg-gray-50 w-full" />
                      <p className="text-gray-600 font-medium">{sent.translation}</p>
                      
                      {sent.isComplex && sent.grammarNotes && (
                        <div className="mt-3 bg-amber-50 rounded-lg p-3 text-sm text-amber-800 border border-amber-100 flex gap-2 items-start">
                           <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                           <div>
                             <span className="font-bold text-amber-700 block mb-1">Key Structure:</span>
                             {sent.grammarNotes}
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* GRAMMAR TAB */}
          {activeTab === 'grammar' && (
            <div className="grid gap-6">
               {analysis.grammarPoints.map((gp, idx) => (
                 <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="bg-indigo-50/50 p-4 border-b border-indigo-50 flex items-center gap-3">
                       <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                          <Layers className="w-5 h-5" />
                       </div>
                       <div>
                          <h3 className="font-bold text-gray-900 text-lg">{gp.point}</h3>
                          <p className="text-sm text-gray-500">{gp.explanation}</p>
                       </div>
                    </div>
                    <div className="p-5 bg-white space-y-3">
                       {gp.sentences.map((s, i) => (
                         <div key={i} className="pl-4 border-l-2 border-indigo-200 py-1">
                            <p className="text-gray-700 italic font-serif">"{s}"</p>
                         </div>
                       ))}
                    </div>
                 </div>
               ))}

               {analysis.grammarPoints.length === 0 && (
                 <div className="text-center py-12 text-gray-400">
                   No specific grammar points identified for this text.
                 </div>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AnalysisView;