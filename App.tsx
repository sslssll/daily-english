import React, { useState, useEffect } from 'react';
import { Article, Topic, UserHistory, VocabItem, AppState, AppView, ArticleAnalysis, DifficultyLevel } from './types';
import { fetchDailyTopics, generateArticleContent, defineWord, generateArticleAnalysis } from './services/geminiService';
import TopicSelector from './components/TopicSelector';
import ArticleReader from './components/ArticleReader';
import SidebarLeft from './components/SidebarLeft';
import NotebookView from './components/NotebookView';
import AnalysisView from './components/AnalysisView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import AccessGate from './components/AccessGate';
import { Menu, Check } from 'lucide-react';

const STORAGE_KEY_HISTORY = 'english_app_history';
const STORAGE_KEY_VOCAB = 'english_app_vocab';
const SESSION_ACCESS_KEY = 'site_access_granted';

const App: React.FC = () => {
  const [hasSiteAccess, setHasSiteAccess] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [currentView, setCurrentView] = useState<AppView>('READING');
  const [isLocked, setIsLocked] = useState(false);
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>('B1'); // Default Intermediate
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  
  // Analysis Data
  const [currentAnalysis, setCurrentAnalysis] = useState<ArticleAnalysis | null>(null);

  // Persistence
  const [history, setHistory] = useState<UserHistory>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
    return saved ? JSON.parse(saved) : {};
  });
  
  const [vocabList, setVocabList] = useState<VocabItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VOCAB);
    return saved ? JSON.parse(saved) : [];
  });

  // Mobile Toggles
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VOCAB, JSON.stringify(vocabList));
  }, [vocabList]);

  // Initial Load & Security Check
  useEffect(() => {
    // 1. Check Site Access (Session based)
    const accessGranted = sessionStorage.getItem(SESSION_ACCESS_KEY);
    if (accessGranted === 'true') {
      setHasSiteAccess(true);
      initAppData();
    }
  }, []);

  const initAppData = async () => {
    // 2. Check User PIN (Local storage based)
    const storedPin = localStorage.getItem('english_app_pin');
    if (storedPin) {
      setIsLocked(true);
    }

    // 3. Check Article History
    // We access state inside this async function, but history comes from closure or ref
    // For safety, we use the initial load logic here mostly for side effects or API calls
    // However, since we need `history` which is already loaded from useState initializer,
    // we can check local storage directly or trust the state if this runs once.
    
    // Check if user already has an article for today
    const savedHistoryStr = localStorage.getItem(STORAGE_KEY_HISTORY);
    const savedHistory = savedHistoryStr ? JSON.parse(savedHistoryStr) : {};
    
    if (savedHistory[today]) {
      setCurrentArticle(savedHistory[today]);
      setSelectedLevel(savedHistory[today].difficulty);
      setAppState(AppState.READING);
    } else {
      setAppState(AppState.LOADING);
      try {
        const fetchedTopics = await fetchDailyTopics();
        setTopics(fetchedTopics);
        setAppState(AppState.TOPIC_SELECTION);
      } catch (e) {
        console.error("Failed to init", e);
        setAppState(AppState.ERROR);
      }
    }
  };

  const handleSiteUnlock = () => {
    sessionStorage.setItem(SESSION_ACCESS_KEY, 'true');
    setHasSiteAccess(true);
    initAppData();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTopicSelect = async (topic: Topic) => {
    setAppState(AppState.LOADING);
    try {
      const article = await generateArticleContent(topic, today, selectedLevel);
      setCurrentArticle(article);
      setHistory(prev => ({ ...prev, [today]: article }));
      setAppState(AppState.READING);
    } catch (error) {
      console.error("Error creating article", error);
      setAppState(AppState.ERROR);
    }
  };

  const handleDateSelect = (date: string) => {
    if (history[date]) {
      setCurrentArticle(history[date]);
      setSelectedLevel(history[date].difficulty);
      setAppState(AppState.READING);
      setCurrentView('READING');
      setCurrentAnalysis(null); // Reset analysis on article change
      setIsSidebarOpen(false);
    }
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  const handleAddVocab = (item: VocabItem) => {
    if (!vocabList.find(v => v.word.toLowerCase() === item.word.toLowerCase())) {
      setVocabList(prev => [item, ...prev]);
      showToast(`Added "${item.word}" to notebook`);
    } else {
      showToast(`"${item.word}" is already in your notebook`);
    }
  };

  const handleManualAddVocab = async (text: string) => {
    try {
      if (vocabList.find(v => v.word.toLowerCase() === text.toLowerCase())) {
        showToast(`"${text}" is already in your notebook`);
        return;
      }
      const item = await defineWord(text);
      handleAddVocab(item);
    } catch (error) {
      console.error("Failed to add manual vocab", error);
      showToast("Failed to add word");
    }
  };

  const handleRemoveVocab = (id: string) => {
    setVocabList(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateVocab = (updatedItem: VocabItem) => {
    setVocabList(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleAnalyzeArticle = async () => {
    if (!currentArticle) return;
    
    // If we already have it for this session, just switch
    if (currentAnalysis) {
      setCurrentView('ANALYSIS');
      return;
    }

    setAppState(AppState.ANALYZING);
    try {
      const analysis = await generateArticleAnalysis(currentArticle.content);
      setCurrentAnalysis(analysis);
      setAppState(AppState.READING); // Stop loading spinner
      setCurrentView('ANALYSIS');
    } catch (error) {
      console.error("Analysis error", error);
      setAppState(AppState.READING); // Revert
      showToast("Failed to analyze article");
    }
  };

  const handleBackFromAnalysis = () => {
    setCurrentView('READING');
  };

  // Data Import Logic
  const handleImportData = (newHistory: UserHistory, newVocab: VocabItem[]) => {
    setHistory(newHistory);
    setVocabList(newVocab);
    
    // Refresh state if current day is affected
    if (newHistory[today]) {
      setCurrentArticle(newHistory[today]);
      setSelectedLevel(newHistory[today].difficulty);
      if (appState === AppState.TOPIC_SELECTION || appState === AppState.ERROR) {
        setAppState(AppState.READING);
      }
    }
  };

  const handleClearData = () => {
    setHistory({});
    setVocabList([]);
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    localStorage.removeItem(STORAGE_KEY_VOCAB);
    // Reload to reset
    window.location.reload();
  };

  // 1. Global Site Gate
  if (!hasSiteAccess) {
    return <AccessGate onUnlock={handleSiteUnlock} />;
  }

  // 2. Personal Data Lock
  if (isLocked) {
    return <LoginView onUnlock={() => setIsLocked(false)} />;
  }

  // 3. API Key Check
  if (!process.env.API_KEY) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-600 p-4">
        <div className="bg-white p-8 rounded shadow text-center">
           <h2 className="text-xl font-bold mb-2">Configuration Missing</h2>
           <p>Please provide a Gemini API Key in the environment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-paper font-sans text-ink">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Navigation Sidebar */}
      <div className={`
        fixed md:relative z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
         <SidebarLeft 
            history={history} 
            selectedDate={currentArticle?.date || ''} 
            currentView={currentView === 'ANALYSIS' ? 'READING' : currentView}
            onSelectDate={handleDateSelect}
            onNavigate={handleNavigate}
            onClose={() => setIsSidebarOpen(false)}
          />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-white">
        
        {/* Mobile Header */}
        <header className="md:hidden h-14 bg-white border-b flex items-center justify-between px-4 z-10 sticky top-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-600">
            <Menu size={20} />
          </button>
          <span className="font-serif font-bold text-gray-800">
            {currentView === 'READING' ? 'Daily Reading' : currentView === 'NOTEBOOK' ? 'Notebook' : currentView === 'SETTINGS' ? 'Settings' : 'Analysis'}
          </span>
          <div className="w-8" /> {/* Spacer */}
        </header>

        {/* Content Router */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* VIEW: READING */}
          {currentView === 'READING' && (
            <div className="h-full overflow-y-auto">
              
              {/* Loading States */}
              {(appState === AppState.LOADING || appState === AppState.ANALYZING) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
                   <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                   <p className="text-gray-500 font-medium animate-pulse">
                     {appState === AppState.ANALYZING 
                       ? 'Analyzing sentence structure & grammar...' 
                       : currentArticle ? 'Generating content...' : 'Preparing topics...'}
                   </p>
                </div>
              )}

              {appState === AppState.TOPIC_SELECTION && (
                 <TopicSelector 
                    topics={topics} 
                    selectedLevel={selectedLevel}
                    onSelectLevel={setSelectedLevel}
                    onSelectTopic={handleTopicSelect} 
                    isLoading={false} 
                 />
              )}

              {(appState === AppState.READING || appState === AppState.ANALYZING) && currentArticle && (
                <ArticleReader 
                  article={currentArticle} 
                  onAddVocab={handleAddVocab} 
                  onAnalyze={handleAnalyzeArticle}
                  isAnalyzing={appState === AppState.ANALYZING}
                />
              )}
              
              {appState === AppState.ERROR && (
                <div className="h-full flex items-center justify-center text-red-500">
                  Something went wrong. Please refresh the page.
                </div>
              )}
            </div>
          )}

          {/* VIEW: ANALYSIS */}
          {currentView === 'ANALYSIS' && currentAnalysis && (
            <AnalysisView 
              analysis={currentAnalysis} 
              onBack={handleBackFromAnalysis} 
            />
          )}

          {/* VIEW: NOTEBOOK */}
          {currentView === 'NOTEBOOK' && (
            <NotebookView 
              vocabList={vocabList}
              onRemoveWord={handleRemoveVocab}
              onManualAdd={handleManualAddVocab}
              onUpdateWord={handleUpdateVocab}
            />
          )}

          {/* VIEW: SETTINGS */}
          {currentView === 'SETTINGS' && (
            <SettingsView
              history={history}
              vocabList={vocabList}
              onImportData={handleImportData}
              onClearData={handleClearData}
            />
          )}

        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-slide-up z-50">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;