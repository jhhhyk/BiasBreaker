
import React from 'react';
import { MessageCircle, Activity, Send, Bot, Check, FileText } from 'lucide-react';
import { SimulationState, ChatMessage } from '../types';

interface FramingSectionProps {
  state: SimulationState;
  t: any;
  chatInput: string;
  setChatInput: (val: string) => void;
  handleRefineIssue: () => void;
  proceedToDebate: () => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  renderSafe: (content: any) => string;
}

const FramingSection: React.FC<FramingSectionProps> = ({ 
  state, t, chatInput, setChatInput, handleRefineIssue, proceedToDebate, chatEndRef, renderSafe 
}) => {
  // Only show this section during the setup phases
  const isFramingPhase = ['framing', 'waiting_confirmation', 'refining'].includes(state.status);

  if (!state.framedIssue || !isFramingPhase) return null;

  return (
    <div id="step-framing" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 mb-20 items-start scroll-mt-48">
      {/* Left: Chat Interface - Sticky & Fixed Height */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col overflow-hidden h-[500px] lg:h-[600px] lg:sticky lg:top-24">
         <div className="p-4 bg-slate-50 border-b border-slate-200 flex-shrink-0">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
               <MessageCircle className="w-5 h-5 text-indigo-600"/> {t.framingTitle}
            </h4>
            <p className="text-xs text-slate-500">{t.framingDesc}</p>
         </div>
         <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {state.framingChat.map((msg: ChatMessage, idx: number) => (
               <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                     msg.role === 'user' 
                     ? 'bg-indigo-600 text-white rounded-tr-none' 
                     : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                  }`}>
                     {msg.text}
                  </div>
               </div>
            ))}
            {state.status === 'refining' && (
               <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                     <Activity className="w-4 h-4 animate-spin"/> Agent is thinking...
                  </div>
               </div>
            )}
            <div ref={chatEndRef} />
         </div>
         <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
            <div className="flex gap-2">
               <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRefineIssue()}
                  placeholder={t.chatPlaceholder}
                  className="flex-grow px-4 py-2 border border-slate-300 rounded-full text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                  disabled={state.status === 'refining'}
               />
               <button 
                  onClick={handleRefineIssue}
                  disabled={!chatInput.trim() || state.status === 'refining'}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  <Send className="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>

      {/* Right: Live Draft Preview - Auto Height but Min Height matching left */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col text-slate-800 h-auto min-h-[500px] lg:min-h-[600px]">
         <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h4 className="font-bold flex items-center gap-2">
               <FileText className="w-5 h-5 text-indigo-600"/> {t.liveDraft}
            </h4>
         </div>
         
         <div className="p-6 space-y-6 flex-grow">
            <div>
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t.definition}</span>
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-slate-800 font-medium leading-relaxed">
                     {renderSafe(state.framedIssue.definition || "No definition provided.")}
                  </p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t.runningIn}</span>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-800">
                     {renderSafe(state.framedIssue.scope.country)}
                  </div>
               </div>
               <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t.timeframe}</span>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-800">
                     {renderSafe(state.framedIssue.scope.timeframe)}
                  </div>
               </div>
            </div>
            
            {state.framedIssue.positions && (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col">
                     <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">{t.proStance}</span>
                     <p className="text-sm text-slate-800 leading-relaxed">
                        {renderSafe(state.framedIssue.positions.pro)}
                     </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex flex-col">
                     <span className="text-xs font-bold text-red-600 uppercase tracking-wider block mb-2">{t.conStance}</span>
                     <p className="text-sm text-slate-800 leading-relaxed">
                        {renderSafe(state.framedIssue.positions.con)}
                     </p>
                  </div>
               </div>
            )}
         </div>
         
         <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
            <button 
               onClick={proceedToDebate}
               className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
               <span className="flex items-center gap-2"><Check className="w-5 h-5" /> {t.btnStart}</span>
            </button>
         </div>
      </div>
    </div>
  );
};

export default FramingSection;
