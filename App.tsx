
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import StepProgress from './components/StepProgress';
import EvidenceSidebar from './components/EvidenceSidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import HeroSection from './components/HeroSection';
import FramingSection from './components/FramingSection';
import DebateTimeline from './components/DebateTimeline';
import AnalysisView from './components/AnalysisView';
import ControlBar from './components/ControlBar';
import ResearchView from './components/ResearchView';
import EvidenceSectorTable from './components/EvidenceSectorTable';
import FollowUpInput from './components/FollowUpInput';
import { Language } from './types';
import { RefreshCcw, AlertTriangle, BookOpen, MessageSquare, Activity, Sidebar, X } from 'lucide-react';
import { getUIText } from './constants';
import { getTimelineItems } from './utils/timeline';
import { useDebateSimulation } from './hooks/useDebateSimulation';

const AppContent: React.FC = () => {
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<'debate' | 'analysis'>('debate');
  const [isEvidenceSidebarOpen, setIsEvidenceSidebarOpen] = useState(false);
  const [isEvidenceTableModalOpen, setIsEvidenceTableModalOpen] = useState(false); // New State for Modal
  const [showStickyTitle, setShowStickyTitle] = useState(false);
  
  const [chatInput, setChatInput] = useState('');
  const [followUpInput, setFollowUpInput] = useState('');

  // Floating UI positioning state
  const [isFooterNear, setIsFooterNear] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const debateEndRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const footerSentinelRef = useRef<HTMLDivElement>(null);

  const t = getUIText(language);

  // Use the custom hook for all simulation logic
  const { 
    state, 
    setState,
    researchStatus, 
    visibleEvidence, 
    isAutoPlay, 
    isPaused, 
    stepReady, 
    actions 
  } = useDebateSimulation(language);

  useEffect(() => {
    try {
       if (!process.env.API_KEY) {
         setApiKeyMissing(true);
       }
    } catch (e) {
       console.error("Env check failed", e);
       setApiKeyMissing(true);
    }
  }, []);

  // Footer proximity detection for floating UI
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterNear(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "0px 0px 100px 0px" // Trigger slightly before reaching the very bottom
      }
    );

    if (footerSentinelRef.current) {
      observer.observe(footerSentinelRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-scroll framing chat
  useEffect(() => {
    if (chatEndRef.current && (state.status === 'framing' || state.status === 'waiting_confirmation' || state.status === 'refining')) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.framingChat]);

  // Auto-scroll debate stream
  useEffect(() => {
    if (!debateEndRef.current || activeTab !== 'debate') return;

    const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
    // Check if user is near bottom
    // Reduced threshold from 600 to 150 to allow users to read previous content without being forced down
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const isUserAtBottom = distanceFromBottom < 150; 

    // Always scroll if it's the start of the debate (no arguments yet)
    const isJustStarted = !state.arguments;

    if (isUserAtBottom || isJustStarted) {
      requestAnimationFrame(() => {
        debateEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [state.arguments, state.rebuttals, state.crossExam, state.additionalRounds, state.isGeneratingRound, activeTab, state.status]);

  // Intersection Observer for sticky title
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyTitle(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );

    if (titleRef.current) {
      observer.observe(titleRef.current);
    }

    return () => observer.disconnect();
  }, [state.status]);

  const handleReset = () => {
    actions.reset();
    setActiveTab('debate');
    setIsEvidenceSidebarOpen(false);
    setIsEvidenceTableModalOpen(false);
    setChatInput('');
    setFollowUpInput('');
  };

  const handleRefineWrapper = () => {
    actions.handleRefineIssue(chatInput);
    setChatInput('');
  };

  const handleFollowUpWrapper = () => {
    actions.handleFollowUp(followUpInput);
    setFollowUpInput('');
  };

  const renderSafe = (content: any) => {
    if (content === null || content === undefined) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'number') return String(content);
    if (Array.isArray(content)) return content.join(', ');
    if (typeof content === 'object') return JSON.stringify(content);
    return String(content);
  };

  const handleEvidenceClick = (evidenceId: string) => {
    setIsEvidenceSidebarOpen(true);
    setTimeout(() => {
        const element = document.getElementById(`evidence-${evidenceId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-indigo-400');
            setTimeout(() => {
                element.classList.remove('ring-4', 'ring-indigo-400');
            }, 2000);
        }
    }, 350);
  };

  const handleStepClick = (stepKey: string) => {
    let targetId = '';
    
    switch(stepKey) {
      case 'framing': targetId = 'step-framing'; break;
      case 'researching': 
        // If we are currently researching, do nothing or scroll to research view
        if (state.status === 'researching' || state.status === 'research_completed') return;
        // If we are past research phase, open the Evidence Table Modal
        setIsEvidenceTableModalOpen(true);
        return; 
      case 'pro_constructive': targetId = 'step-pro_constructive'; break;
      case 'con_cx': targetId = 'step-con_cx'; break;
      case 'con_constructive': targetId = 'step-con_constructive'; break;
      case 'pro_cx': targetId = 'step-pro_cx'; break;
      case 'rebuttal': targetId = 'step-rebuttal'; break;
      case 'analyzing': targetId = 'step-analyzing'; break;
      default: return;
    }

    if (!targetId) return;

    if (stepKey === 'analyzing' && activeTab !== 'analysis') {
       setActiveTab('analysis');
       setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }, 100);
       return;
    } else if (stepKey !== 'analyzing' && activeTab !== 'debate') {
       setActiveTab('debate');
       setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }, 100);
       return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (apiKeyMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center border-l-4 border-red-500">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-slate-800">API Key Missing</h2>
          <p className="text-slate-600 mb-6">
            Please configure your Google Gemini API key in the environment variables (process.env.API_KEY).
          </p>
        </div>
      </div>
    );
  }

  // Pre-calculate timeline items
  const timelineItems = getTimelineItems(state, stepReady, isPaused, t);
  const isDebateStarted = state.status !== 'idle' && state.status !== 'framing' && state.status !== 'waiting_confirmation' && state.status !== 'refining';
  
  const showControlBar = isDebateStarted && 
                         state.status !== 'researching' && 
                         state.status !== 'research_completed' && 
                         state.status !== 'complete' &&
                         state.status !== 'analyzing' &&
                         state.status !== 'error';

  return (
    <Layout 
      language={language} 
      setLanguage={setLanguage} 
      labels={t}
      showHeader={state.status === 'idle'} 
    >
      <EvidenceSidebar 
        isOpen={isEvidenceSidebarOpen} 
        onClose={() => setIsEvidenceSidebarOpen(false)} 
        evidenceBoard={state.evidenceBoard} 
        language={language}
        labels={t} 
      />
      
      {/* Evidence Table Modal (Accessible via Step Click) */}
      {isEvidenceTableModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
                 <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    {t.researchComplete || "Evidence Board"}
                 </h3>
                 <button 
                   onClick={() => setIsEvidenceTableModalOpen(false)}
                   className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                 >
                   <X className="w-6 h-6" />
                 </button>
              </div>
              <div className="p-6">
                 <EvidenceSectorTable 
                   sectorStatuses={state.sectorStatuses}
                   visibleEvidence={visibleEvidence.length > 0 ? visibleEvidence : (state.evidenceBoard?.evidence_board || [])}
                   language={language}
                 />
                 <p className="text-center text-slate-500 text-sm mt-4">
                   {language === 'ko' ? "오른쪽 하단 버튼을 클릭하여 개별 증거 카드를 확인할 수 있습니다." : "Click the bottom right button to view individual evidence cards."}
                 </p>
              </div>
           </div>
        </div>
      )}

      {state.status !== 'idle' && state.status !== 'framing' && state.status !== 'waiting_confirmation' && state.status !== 'refining' && !isEvidenceSidebarOpen && state.status !== 'researching' && state.status !== 'research_completed' && (
        <button
          onClick={() => setIsEvidenceSidebarOpen(true)}
          className={`fixed right-8 z-40 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center ${isFooterNear ? 'bottom-24' : 'bottom-8'}`}
          aria-label="Open Evidence Board"
          title={t.toggleEvidence}
        >
          <BookOpen className="w-6 h-6" />
        </button>
      )}

      {showControlBar && (
        <div className={`fixed left-1/2 -translate-x-1/2 z-[90] transition-all duration-300 ${isFooterNear ? 'bottom-24' : 'bottom-6'}`}>
          <ControlBar 
            stepReady={stepReady}
            isPaused={isPaused}
            isAutoPlay={isAutoPlay}
            onToggleAutoPlay={actions.toggleAutoPlay}
            onNext={actions.triggerNext}
            onPauseToggle={actions.togglePause}
            labels={t}
          />
        </div>
      )}

      {/* Floating FollowUpInput */}
      {activeTab === 'debate' && state.status === 'complete' && (
        <FollowUpInput 
          value={followUpInput}
          onChange={setFollowUpInput}
          onSend={handleFollowUpWrapper}
          isGenerating={state.isGeneratingRound}
          t={t}
          className={isFooterNear ? 'bottom-24' : 'bottom-6'}
        />
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ${state.status === 'idle' ? 'h-[calc(100vh-140px)] flex items-center justify-center' : 'py-8'}`}>
        
        {state.status === 'idle' && (
          <HeroSection 
            t={t} 
            originalTopic={state.originalTopic} 
            setOriginalTopic={(val) => setState(prev => ({...prev, originalTopic: val}))} 
            startSimulation={actions.startSimulation}
          />
        )}

        {state.status !== 'idle' && (
          <div className="animate-fade-in transition-all duration-300">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <h3 ref={titleRef} className="text-2xl font-bold serif text-slate-900">{renderSafe(state.framedIssue ? state.framedIssue.refined_issue : state.originalTopic)}</h3>
                  {state.framedIssue && (
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-1">
                       <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{t.runningIn} <strong>{renderSafe(state.framedIssue.scope.country)}</strong></span>
                       <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{t.timeframe} <strong>{renderSafe(state.framedIssue.scope.timeframe)}</strong></span>
                    </div>
                  )}
               </div>
               {state.status !== 'complete' && state.status !== 'error' && state.status !== 'waiting_confirmation' && state.status !== 'refining' && (
                  <button onClick={handleReset} className="text-sm text-red-500 hover:text-red-700 underline whitespace-nowrap">{t.stopBtn}</button>
               )}
               {(state.status === 'complete' || state.status === 'error') && (
                 <button onClick={handleReset} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm whitespace-nowrap">
                   <RefreshCcw className="w-4 h-4" /> {t.newTopicBtn}
                 </button>
               )}
            </div>
            <div className="sticky top-0 z-50 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-8 transition-all duration-300">
              <StepProgress 
                currentStep={state.status === 'refining' ? 'waiting_confirmation' : state.status} 
                labels={t} 
                onStepClick={handleStepClick}
                topic={showStickyTitle ? renderSafe(state.framedIssue ? state.framedIssue.refined_issue : state.originalTopic) : undefined}
              />
            </div>
            
            {state.status === 'error' && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 my-8 rounded-r-lg">
                <p className="text-red-700">{state.error}</p>
              </div>
            )}

            <FramingSection 
              state={state} 
              t={t} 
              chatInput={chatInput} 
              setChatInput={setChatInput} 
              handleRefineIssue={handleRefineWrapper} 
              proceedToDebate={actions.handleStartResearch} 
              chatEndRef={chatEndRef}
              renderSafe={renderSafe}
            />

            {isDebateStarted && (
              <div className="mt-8 pb-32">
                {state.status === 'researching' || state.status === 'research_completed' ? (
                   <ResearchView 
                      status={state.status}
                      researchStatus={researchStatus}
                      visibleEvidence={visibleEvidence}
                      sectorStatuses={state.sectorStatuses}
                      language={language}
                      onStartDebate={actions.handleStartDebate}
                      onViewEvidence={() => setIsEvidenceSidebarOpen(true)}
                      t={t}
                   />
                ) : (
                  <>
                  <div className="border-b border-slate-200 flex justify-between items-center mb-6">
                    <div className="flex gap-8 overflow-x-auto">
                       <button 
                        onClick={() => setActiveTab('debate')} 
                        className={`pb-3 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'debate' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                       >
                         <MessageSquare className="w-4 h-4"/> {t.tabDebate}
                       </button>
                       <button 
                        onClick={() => setActiveTab('analysis')} 
                        disabled={state.status !== 'complete'}
                        className={`pb-3 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'analysis' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800 disabled:opacity-50'}`}
                       >
                         <Activity className="w-4 h-4"/> {t.tabAnalysis}
                       </button>
                    </div>
                    
                    <button 
                      onClick={() => setIsEvidenceSidebarOpen(!isEvidenceSidebarOpen)} 
                      className={`hidden md:flex pb-3 text-sm font-medium items-center gap-2 transition-colors ${isEvidenceSidebarOpen ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                       <Sidebar className="w-4 h-4"/> 
                       {isEvidenceSidebarOpen ? (language === 'ko' ? t.toggleEvidence.replace('Open', 'Close') : (isEvidenceSidebarOpen ? 'Close Evidence' : t.toggleEvidence)) : t.toggleEvidence}
                    </button>
                  </div>

                  {activeTab === 'debate' && (
                    <DebateTimeline 
                      timelineItems={timelineItems} 
                      t={t} 
                      language={language}
                      handleEvidenceClick={handleEvidenceClick} 
                      isGeneratingRound={state.isGeneratingRound} 
                      debateEndRef={debateEndRef} 
                    />
                  )}
                  
                  {activeTab === 'debate' && state.status === 'complete' && (
                    <div className="flex justify-center mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
                      <button
                        onClick={() => {
                           setActiveTab('analysis');
                           setTimeout(() => {
                              document.getElementById('step-analyzing')?.scrollIntoView({ behavior: 'smooth' });
                           }, 100);
                        }}
                        className="flex items-center gap-2 pl-3 pr-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95"
                      >
                        <Activity className="w-3 h-3" />
                        {language === 'ko' ? '메타 분석 보고서 확인하기' : 'View Analysis Report'}
                      </button>
                    </div>
                  )}

                  {activeTab === 'analysis' && state.analysis && (
                    <AnalysisView analysis={state.analysis} t={t} language={language} />
                  )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Sentinel element to detect bottom of scroll */}
      <div ref={footerSentinelRef} className="h-1 w-full pointer-events-none opacity-0" />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
