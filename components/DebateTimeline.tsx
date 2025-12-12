
import React from 'react';
import { User, Quote, MessageSquare, MessageCircle, Check, FileText, Shield, Activity, Sparkles } from 'lucide-react';
import { TimelineItem, getAnchorId } from '../utils/timeline';
import { Sector, Language } from '../types';
import { getSectorTranslation } from '../constants';

interface DebateTimelineProps {
  timelineItems: TimelineItem[];
  t: any;
  language: Language;
  handleEvidenceClick: (id: string) => void;
  isGeneratingRound: boolean;
  debateEndRef: React.RefObject<HTMLDivElement | null>;
}

const DebateTimeline: React.FC<DebateTimelineProps> = ({ 
  timelineItems, t, language, handleEvidenceClick, isGeneratingRound, debateEndRef 
}) => {
  const assignedStepIds = new Set<string>();

  const getSectorLabel = (sector: Sector) => {
    return getSectorTranslation(language, sector);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 transition-all duration-300">
       {timelineItems.length > 0 ? (
         timelineItems.map((item) => {
           const anchorId = getAnchorId(item, assignedStepIds, t);
           
           if (item.type === 'divider') {
              return (
                  <div id={anchorId} key={item.id} className="flex items-center justify-center my-12 opacity-80 animate-in fade-in slide-in-from-bottom-2 duration-500 scroll-mt-48">
                      <div className="h-px bg-slate-300 w-16 sm:w-32"></div>
                      <span className="mx-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">{item.content}</span>
                      <div className="h-px bg-slate-300 w-16 sm:w-32"></div>
                  </div>
              );
           }

           if (item.type === 'analyzing') {
              return (
                 <div id={anchorId} key={item.id} className="flex flex-col items-center justify-center mt-32 mb-16 animate-in fade-in zoom-in duration-700">
                    <div className="relative mb-4">
                       <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
                       <div className="absolute inset-0 flex items-center justify-center">
                          <Activity className="w-6 h-6 text-indigo-600" />
                       </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 animate-pulse">{item.content}...</h3>
                 </div>
              );
           }

           // --- Messenger Style Loading Bubble ---
           if (item.type === 'loading') {
             const isProLoading = item.side === 'pro';
             return (
               <div key={item.id} className={`flex ${isProLoading ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                 {isProLoading && (
                   <div className="flex-shrink-0 mr-3 mt-1">
                     <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 border border-blue-100">
                       <User size={16} />
                     </div>
                   </div>
                 )}
                 <div className={`p-4 rounded-2xl shadow-sm ${
                   isProLoading 
                   ? 'bg-white border border-blue-100 rounded-tl-none' 
                   : 'bg-white border border-red-100 rounded-tr-none'
                 }`}>
                    <div className="flex space-x-1 h-5 items-center">
                      <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s] ${isProLoading ? 'bg-blue-300' : 'bg-red-300'}`}></div>
                      <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s] ${isProLoading ? 'bg-blue-300' : 'bg-red-300'}`}></div>
                      <div className={`w-2 h-2 rounded-full animate-bounce ${isProLoading ? 'bg-blue-300' : 'bg-red-300'}`}></div>
                    </div>
                 </div>
                 {!isProLoading && (
                   <div className="flex-shrink-0 ml-3 mt-1">
                     <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 border border-red-100">
                       <User size={16} />
                     </div>
                   </div>
                 )}
               </div>
             );
           }

           const isUser = item.side === 'user';
           if (isUser) {
             return (
               <div key={item.id} className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-500 my-8">
                  <div className="max-w-[80%] bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md">
                    <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs font-bold uppercase">
                       <User size={12}/> {t.userQuestion}
                    </div>
                    <p className="text-sm">{item.content}</p>
                  </div>
               </div>
             );
           }

           const isPro = item.side === 'pro';
           return (
             <div id={anchorId} key={item.id} className={`flex ${isPro ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-500 scroll-mt-48`}>
               
               {isPro && (
                 <div className="flex-shrink-0 mr-3 mt-1">
                   <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                     <User size={16} />
                   </div>
                 </div>
               )}

               <div className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] flex flex-col ${isPro ? 'items-start' : 'items-end'}`}>
                 <div className="flex items-center gap-2 mb-1 px-1">
                   <span className={`text-[10px] font-bold uppercase tracking-wider ${isPro ? 'text-blue-600' : 'text-red-600'}`}>
                     {isPro ? 'Pro Agent' : 'Con Agent'}
                   </span>
                   {item.sector && (
                     <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                       {getSectorLabel(item.sector as Sector)}
                     </span>
                   )}
                   {item.label && (
                     <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.type === 'question' 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-emerald-100 text-emerald-700'
                     }`}>
                       {item.label}
                     </span>
                   )}
                   {item.type === 'intro' && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Intro</span>}
                   {item.type === 'conclusion' && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Conclusion</span>}
                 </div>

                 <div className={`relative p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                   isPro 
                   ? 'bg-white text-slate-800 border border-blue-100 rounded-tl-none' 
                   : 'bg-white text-slate-800 border border-red-100 rounded-tr-none'
                 }`}>
                    <div className={`absolute top-3 ${isPro ? '-left-8' : '-right-8'} opacity-0 sm:opacity-50`}>
                      {item.type === 'argument' && <Quote size={16} className={isPro ? "text-blue-300" : "text-red-300"} />}
                      {item.type === 'rebuttal' && <MessageSquare size={16} className={isPro ? "text-blue-300" : "text-red-300"} />}
                      {item.type === 'question' && <MessageCircle size={16} className="text-amber-300" />}
                      {item.type === 'answer' && <Check size={16} className="text-emerald-300" />}
                      {item.type === 'intro' && <FileText size={16} className="text-purple-300" />}
                      {item.type === 'conclusion' && <FileText size={16} className="text-purple-300" />}
                    </div>
                    
                    {item.title && <h5 className="font-bold text-slate-900 mb-1">{item.title}</h5>}
                    {item.meta && item.meta.value && <div className="mb-2 text-xs bg-slate-50 p-2 rounded border border-slate-100"><span className="font-bold">Value Criterion:</span> {item.meta.value}</div>}
                    
                    {item.defense && (
                      <div className={`mb-3 p-3 rounded-lg border-l-4 text-xs ${isPro ? 'bg-red-50 border-red-300 text-red-900' : 'bg-blue-50 border-blue-300 text-blue-900'}`}>
                         <div className="flex items-center gap-1 font-bold mb-1 opacity-70">
                           <Shield size={12}/> Reply to Opponent
                         </div>
                         {item.defense}
                      </div>
                    )}

                    <p className="whitespace-pre-wrap">{item.content}</p>

                    {item.refId && (
                      <div className="mt-2 text-xs text-slate-400 bg-slate-50 p-1.5 rounded inline-block">
                        Ref: #{item.refId}
                      </div>
                    )}

                    {Array.isArray(item.evidence) && item.evidence.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {item.evidence.map((evId, i) => (
                          <button 
                            key={i} 
                            onClick={() => handleEvidenceClick(evId)}
                            className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200 hover:bg-indigo-100 hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-pointer" 
                            title={`View Evidence: ${evId}`}
                          >
                            {evId}
                          </button>
                        ))}
                      </div>
                    )}
                 </div>
               </div>

               {!isPro && (
                 <div className="flex-shrink-0 ml-3 mt-1">
                   <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 border border-red-200">
                     <User size={16} />
                   </div>
                 </div>
               )}

             </div>
           );
         })
       ) : (
         <div className="text-center text-slate-400 py-12">
           <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse text-indigo-300" />
           <p>Generating debate content...</p>
         </div>
       )}

       <div ref={debateEndRef} />
    </div>
  );
};

export default DebateTimeline;
