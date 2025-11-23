import React, { useState, useRef, useEffect } from 'react';
import { VocabItem, ChatMessage } from '../types';
import { Trash2, Plus, Loader2, MessageCircle, Play, Sparkles, X, ChevronRight, RotateCw, Send, Search, LayoutGrid, Layers, BookOpen } from 'lucide-react';
import { AudioPlayerService } from '../services/audioUtils';
import { generateAudio, generateStoryFromWords, chatAboutWord, generateWordImage } from '../services/geminiService';

interface NotebookViewProps {
  vocabList: VocabItem[];
  onRemoveWord: (id: string) => void;
  onManualAdd: (text: string) => Promise<void>;
}

const NotebookView: React.FC<NotebookViewProps> = ({ vocabList, onRemoveWord, onManualAdd }) => {
  const [activeTab, setActiveTab] = useState<'notebook' | 'flashcards' | 'story'>('notebook');
  
  // --- List State ---
  const [inputValue, setInputValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [filterText, setFilterText] = useState("");
  
  // --- Chat State ---
  const [chatWord, setChatWord] = useState<VocabItem | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Story State ---
  const [story, setStory] = useState<{title: string, content: string} | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  // --- Flashcard State ---
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const sortedList = [...vocabList]
    .filter(v => v.word.toLowerCase().includes(filterText.toLowerCase()) || v.translation.includes(filterText))
    .sort((a, b) => b.addedAt - a.addedAt);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatWord]);

  // Reset states when switching tabs
  useEffect(() => {
    if (activeTab === 'flashcards') {
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setCardImage(null);
    }
  }, [activeTab]);

  // -- Handlers --

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isAdding) return;
    setIsAdding(true);
    await onManualAdd(inputValue.trim());
    setInputValue("");
    setIsAdding(false);
  };

  const playAudio = async (text: string) => {
    const audio = await generateAudio(text);
    if (audio) {
      AudioPlayerService.playPCM(audio);
    }
  };

  const handleOpenChat = (item: VocabItem) => {
    setChatWord(item);
    setChatHistory([{ role: 'model', text: `Hi! I'm here to help you with "${item.word}". What would you like to know?` }]);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatWord || isChatting) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatting(true);

    try {
      const responseText = await chatAboutWord(chatWord.word, chatWord, chatHistory, userMsg.text);
      setChatHistory(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatting(false);
    }
  };

  const handleGenerateStory = async () => {
    if (sortedList.length < 3) return;
    setIsGeneratingStory(true);
    const words = sortedList.slice(0, 10).map(v => v.word);
    const res = await generateStoryFromWords(words);
    setStory(res);
    setIsGeneratingStory(false);
  };

  const handleFlipCard = async () => {
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setCardImage(null);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % sortedList.length);
    }, 200);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCardImage(null);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + sortedList.length) % sortedList.length);
    }, 200);
  };

  const handleGenerateImage = async (item: VocabItem) => {
    if (isGeneratingImage || cardImage) return;
    setIsGeneratingImage(true);
    const b64 = await generateWordImage(item.visualPrompt || item.word);
    if (b64) setCardImage(`data:image/png;base64,${b64}`);
    setIsGeneratingImage(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900">My Notebook</h1>
            <p className="text-gray-500 mt-1">Manage your vocabulary and review your progress.</p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl">
             <button 
               onClick={() => setActiveTab('notebook')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'notebook' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <LayoutGrid className="w-4 h-4" /> Collection
             </button>
             <button 
               onClick={() => setActiveTab('flashcards')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'flashcards' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <Layers className="w-4 h-4" /> Flashcards
             </button>
             <button 
               onClick={() => setActiveTab('story')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'story' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <BookOpen className="w-4 h-4" /> Story Mode
             </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto h-full">
          
          {/* === LIST VIEW === */}
          {activeTab === 'notebook' && (
            <div className="space-y-8">
              {/* Controls */}
              <div className="flex flex-col md:flex-row gap-4">
                 <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Search your words..." 
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
                    />
                 </div>
                 <form onSubmit={handleManualSubmit} className="relative flex-1 max-w-md">
                    <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Add a new word manually..."
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                      disabled={isAdding}
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || isAdding}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-300 transition-colors p-1.5 rounded-lg"
                    >
                      {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </form>
              </div>

              {/* Grid */}
              {sortedList.length === 0 ? (
                 <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-lg">No words found.</p>
                    <p className="text-sm">Start adding words from your reading or manually!</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedList.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 group flex flex-col h-full">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-bold text-gray-900 font-serif">{item.word}</h3>
                          <button onClick={() => playAudio(item.word)} className="text-gray-400 hover:text-amber-500 p-1.5 rounded-full hover:bg-amber-50 transition-colors">
                            <Play className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenChat(item)} className="text-gray-300 hover:text-blue-500 p-2 rounded-full hover:bg-blue-50 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => onRemoveWord(item.id)} className="text-gray-300 hover:text-red-400 p-2 rounded-full hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-amber-700 font-bold mb-2">{item.translation}</p>
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed flex-grow">{item.explanation}</p>
                      
                      <div className="space-y-3 pt-4 border-t border-gray-100 bg-gray-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                        {item.examples.map((ex, idx) => (
                          <div key={idx} className="flex gap-3 items-start group/ex">
                             <button onClick={() => playAudio(ex.english)} className="mt-1 text-gray-300 hover:text-indigo-500 opacity-0 group-hover/ex:opacity-100 transition-opacity">
                                <Play className="w-3 h-3 fill-current" />
                             </button>
                             <div className="text-sm">
                               <p className="text-gray-800 font-medium">{ex.english}</p>
                               <p className="text-gray-400 text-xs mt-0.5">{ex.chinese}</p>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === FLASHCARDS VIEW === */}
          {activeTab === 'flashcards' && (
            <div className="h-full flex flex-col items-center justify-center min-h-[600px]">
               {sortedList.length === 0 ? (
                  <div className="text-center text-gray-400">Add words to list first.</div>
               ) : (
                 <div className="relative w-full max-w-lg aspect-[3/4] md:aspect-[4/3] perspective-1000 group">
                   
                   {/* Navigation Controls */}
                   <button 
                      onClick={(e) => { e.stopPropagation(); handlePrevCard(); }}
                      className="absolute left-[-60px] top-1/2 -translate-y-1/2 p-4 bg-white rounded-full shadow-lg text-gray-400 hover:text-indigo-600 hover:scale-110 transition-all z-20 hidden md:block"
                   >
                     <ChevronRight className="w-6 h-6 rotate-180" />
                   </button>
                   <button 
                      onClick={(e) => { e.stopPropagation(); handleNextCard(); }}
                      className="absolute right-[-60px] top-1/2 -translate-y-1/2 p-4 bg-white rounded-full shadow-lg text-gray-400 hover:text-indigo-600 hover:scale-110 transition-all z-20 hidden md:block"
                   >
                     <ChevronRight className="w-6 h-6" />
                   </button>

                   <div 
                      onClick={handleFlipCard}
                      className={`relative w-full h-full duration-700 transform-style-3d transition-transform cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                    >
                      
                      {/* FRONT */}
                      <div className="absolute w-full h-full bg-white rounded-3xl shadow-2xl border border-gray-100 p-12 flex flex-col items-center justify-center backface-hidden z-10">
                         <div className="absolute top-6 right-8 text-sm font-bold text-gray-300 bg-gray-50 px-3 py-1 rounded-full">
                            {currentCardIndex + 1} / {sortedList.length}
                         </div>
                         
                         <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
                            {cardImage ? (
                               <img src={cardImage} alt="concept" className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-2xl mb-8 border-4 border-amber-50 shadow-inner" />
                            ) : (
                               <div className="w-48 h-48 md:w-64 md:h-64 bg-amber-50 rounded-2xl flex items-center justify-center mb-8 relative overflow-hidden group/img transition-colors hover:bg-amber-100"
                                    onClick={(e) => { e.stopPropagation(); handleGenerateImage(sortedList[currentCardIndex]); }}
                               >
                                  {isGeneratingImage ? (
                                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                                  ) : (
                                    <div className="flex flex-col items-center gap-2">
                                       <Sparkles className="w-12 h-12 text-amber-300" />
                                       <span className="text-xs font-bold text-amber-600/70 uppercase tracking-widest">Generate Visual</span>
                                    </div>
                                  )}
                               </div>
                            )}
                            <h2 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6">{sortedList[currentCardIndex].word}</h2>
                            <button 
                              onClick={(e) => { e.stopPropagation(); playAudio(sortedList[currentCardIndex].word); }}
                              className="p-4 bg-indigo-50 rounded-full text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-md"
                            >
                               <Play className="w-6 h-6 fill-current" />
                            </button>
                         </div>
                         <p className="text-sm text-gray-400 mt-4 font-medium uppercase tracking-wide">Click card to reveal meaning</p>
                      </div>

                      {/* BACK */}
                      <div className="absolute w-full h-full bg-gray-900 rounded-3xl shadow-2xl p-12 flex flex-col backface-hidden rotate-y-180 text-white">
                          <div className="flex-1 flex flex-col justify-center">
                             <div className="text-center mb-8">
                                <h3 className="text-4xl font-bold text-amber-400 mb-4">{sortedList[currentCardIndex].translation}</h3>
                                <p className="text-lg text-gray-300 italic font-light leading-relaxed max-w-lg mx-auto">"{sortedList[currentCardIndex].explanation}"</p>
                             </div>
                             
                             <div className="space-y-4 bg-gray-800/50 p-6 rounded-2xl">
                                {sortedList[currentCardIndex].examples.map((ex, i) => (
                                  <div key={i} className="flex gap-4 items-start">
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); playAudio(ex.english); }}
                                        className="mt-1 text-indigo-400 hover:text-white transition-colors"
                                     >
                                        <Play className="w-4 h-4 fill-current" />
                                     </button>
                                     <div>
                                       <p className="text-lg text-white font-medium leading-snug">{ex.english}</p>
                                       <p className="text-sm text-gray-500 mt-1">{ex.chinese}</p>
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                      </div>

                   </div>
                 </div>
               )}
            </div>
          )}

          {/* === STORY VIEW === */}
          {activeTab === 'story' && (
             <div className="h-full flex flex-col items-center justify-center min-h-[500px]">
                <div className="max-w-3xl w-full">
                  {!story ? (
                     <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <BookOpen className="w-10 h-10 text-amber-500" />
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Magic Story Generator</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">Turn your vocabulary list into a unique, personalized story to help you memorize words in context.</p>
                        
                        {sortedList.length < 3 ? (
                          <div className="inline-block bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium">
                            Please add at least 3 words to your notebook first.
                          </div>
                        ) : (
                          <button 
                             onClick={handleGenerateStory}
                             disabled={isGeneratingStory}
                             className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none flex items-center gap-3 mx-auto"
                          >
                             {isGeneratingStory ? <Loader2 className="animate-spin w-6 h-6"/> : <Sparkles className="w-6 h-6" />}
                             Create My Story
                          </button>
                        )}
                     </div>
                  ) : (
                     <div className="bg-white rounded-3xl overflow-hidden shadow-xl animate-fade-in border border-gray-100">
                        <div className="bg-amber-50 p-8 border-b border-amber-100 flex justify-between items-start">
                           <div>
                             <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">{story.title}</h2>
                             <p className="text-amber-700 font-medium">Generated from {Math.min(10, sortedList.length)} of your words</p>
                           </div>
                           <button onClick={() => setStory(null)} className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm hover:shadow">
                              <RotateCw className="w-5 h-5" />
                           </button>
                        </div>
                        <div className="p-10">
                           <div className="prose prose-lg prose-indigo max-w-none mb-8">
                              <p className="leading-loose text-gray-700 whitespace-pre-line">{story.content}</p>
                           </div>
                           <div className="flex justify-center">
                             <button 
                                onClick={() => playAudio(story.content)} 
                                className="flex items-center gap-3 bg-indigo-50 text-indigo-700 px-6 py-3 rounded-full font-bold hover:bg-indigo-100 transition-colors"
                             >
                                <Play className="w-5 h-5 fill-current" /> Listen to Story
                             </button>
                           </div>
                        </div>
                     </div>
                  )}
                </div>
             </div>
          )}

        </div>
      </div>

      {/* === CHAT OVERLAY === */}
      {chatWord && (
        <div className="fixed bottom-0 right-0 md:bottom-8 md:right-8 w-full md:w-96 h-[500px] z-50 bg-white shadow-2xl rounded-t-2xl md:rounded-2xl flex flex-col border border-gray-200 animate-slide-up">
           <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
              <h3 className="font-bold text-white flex items-center gap-2">
                 <MessageCircle className="w-5 h-5" /> 
                 Chat: {chatWord.word}
              </h3>
              <button onClick={() => setChatWord(null)} className="p-1 hover:bg-white/20 rounded-full text-white transition-colors">
                 <X className="w-5 h-5" />
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {chatHistory.map((msg, i) => (
                 <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm shadow-sm ${
                       msg.role === 'user' 
                       ? 'bg-blue-600 text-white rounded-br-none' 
                       : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}>
                       {msg.text}
                    </div>
                 </div>
              ))}
              {isChatting && (
                 <div className="flex justify-start">
                    <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-200 rounded-bl-none">
                       <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                       </div>
                    </div>
                 </div>
              )}
              <div ref={chatEndRef} />
           </div>

           <form onSubmit={handleSendChat} className="p-3 border-t border-gray-100 bg-white flex gap-2 rounded-b-2xl">
              <input
                 type="text"
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 placeholder="Ask about this word..."
                 className="flex-1 bg-gray-100 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <button type="submit" disabled={!chatInput.trim() || isChatting} className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                 <Send className="w-4 h-4" />
              </button>
           </form>
        </div>
      )}
    </div>
  );
};

export default NotebookView;