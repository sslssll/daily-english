import React, { useState, useEffect } from 'react';
import { Article, VocabItem } from '../types';
import { generateArticleAudio, defineWord } from '../services/geminiService';
import { AudioPlayerService } from '../services/audioUtils';
import { Play, Pause, Loader2, Plus, BrainCircuit, Download, FileText, Headphones } from 'lucide-react';

interface ArticleReaderProps {
  article: Article;
  onAddVocab: (item: VocabItem) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const ArticleReader: React.FC<ArticleReaderProps> = ({ article, onAddVocab, onAnalyze, isAnalyzing }) => {
  const [audioState, setAudioState] = useState<{ loading: boolean, playing: boolean }>({ loading: false, playing: false });
  const [audioData, setAudioData] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<{ word: string, sentence: string, x: number, y: number } | null>(null);
  const [definingWord, setDefiningWord] = useState(false);

  // Reset state when article changes
  useEffect(() => {
    setAudioData(null);
    setAudioState({ loading: false, playing: false });
    AudioPlayerService.stop();
  }, [article.id]);

  const handlePlayAudio = async () => {
    if (audioState.playing) {
      AudioPlayerService.stop();
      setAudioState(prev => ({ ...prev, playing: false }));
      return;
    }

    if (audioData) {
      setAudioState(prev => ({ ...prev, playing: true }));
      AudioPlayerService.playPCM(audioData, () => setAudioState(prev => ({ ...prev, playing: false })));
      return;
    }

    // Generate Audio
    setAudioState({ loading: true, playing: false });
    const data = await generateArticleAudio(article.content);
    
    if (data) {
      setAudioData(data);
      setAudioState({ loading: false, playing: true });
      AudioPlayerService.playPCM(data, () => setAudioState(prev => ({ ...prev, playing: false })));
    } else {
      setAudioState({ loading: false, playing: false });
      alert("无法生成音频，请稍后再试。");
    }
  };

  const handleDownloadText = () => {
    const textContent = `Title: ${article.title}\nDate: ${article.date}\nLevel: ${article.difficulty}\n\n${article.content}`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAudio = () => {
    if (!audioData) return;
    const blob = AudioPlayerService.getWavBlob(audioData);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleWordClick = (e: React.MouseEvent<HTMLParagraphElement>) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    
    // Filter for valid words or phrases (letters, spaces, hyphens)
    // Allow up to 5 words for a phrase
    if (!text || !/^[a-zA-Z\s-]+$/.test(text)) return;
    if (text.split(/\s+/).length > 5) return; 

    // Find containing sentence roughly
    const fullText = article.content;
    const index = fullText.indexOf(text); 
    let start = fullText.lastIndexOf('.', index) + 1;
    if (start < 0) start = 0;
    let end = fullText.indexOf('.', index + text.length);
    if (end === -1) end = fullText.length;
    const sentence = fullText.slice(start, end + 1).trim();

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    
    setSelectedWord({
      word: text,
      sentence,
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 40 // Position above
    });
  };

  const handleAddToVocab = async () => {
    if (!selectedWord) return;
    setDefiningWord(true);
    const vocabItem = await defineWord(selectedWord.word, selectedWord.sentence);
    onAddVocab(vocabItem);
    setDefiningWord(false);
    setSelectedWord(null);
    window.getSelection()?.removeAllRanges();
  };

  // Click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = () => setSelectedWord(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-8 relative">
      {/* Article Header & Controls */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 py-4 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wide">{article.difficulty} Level</span>
             <span className="text-xs text-gray-400">{article.date}</span>
           </div>
           <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 leading-tight">{article.title}</h1>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Download Text */}
          <button
            onClick={handleDownloadText}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Download Article Text"
          >
            <FileText className="w-5 h-5" />
          </button>

          {/* Download Audio */}
          <button
            onClick={handleDownloadAudio}
            disabled={!audioData}
            className={`p-2 rounded-full transition-colors ${
              audioData 
                ? 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50' 
                : 'text-gray-200 cursor-not-allowed'
            }`}
            title={audioData ? "Download Audio (WAV)" : "Generate audio first to download"}
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Analyze Button */}
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors font-medium text-sm ml-2"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            <span className="hidden sm:inline">Deep Analysis</span>
          </button>

          {/* Audio Button */}
          <button 
            onClick={handlePlayAudio}
            disabled={audioState.loading}
            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 disabled:bg-gray-300 ml-2"
          >
            {audioState.loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : audioState.playing ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* Article Content */}
      <div className="prose prose-lg prose-indigo max-w-none mb-20">
        {article.content.split('\n').map((para, idx) => (
          <p 
            key={idx} 
            className="mb-6 leading-8 font-serif text-gray-800 cursor-text selection:bg-indigo-100 selection:text-indigo-900"
            onMouseUp={(e) => {
              e.stopPropagation(); 
              handleWordClick(e);
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Floating Tooltip for Vocab */}
      {selectedWord && (
        <div 
          className="absolute z-50 bg-gray-900 text-white text-sm py-2 px-4 rounded shadow-xl flex items-center gap-3 transform -translate-x-1/2"
          style={{ top: selectedWord.y, left: selectedWord.x + (selectedWord.word.length * 4) }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="font-bold max-w-[150px] truncate">{selectedWord.word}</span>
          <div className="h-4 w-px bg-gray-600"></div>
          <button 
            onClick={handleAddToVocab}
            disabled={definingWord}
            className="flex items-center gap-1 hover:text-indigo-300 transition-colors font-medium whitespace-nowrap"
          >
            {definingWord ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            添加到生词本
          </button>
        </div>
      )}
    </div>
  );
};

export default ArticleReader;
