
import React from 'react';
import { CheckCircle2, Loader2, Circle, Mic2, MessageCircle, Gavel } from 'lucide-react';
import { SimulationStep } from '../types';

interface StepProgressProps {
  currentStep: SimulationStep;
  labels: { [key: string]: string | string[] };
  onStepClick?: (stepKey: string) => void;
  topic?: string;
}

// Visual Steps (Detailed CEDA Order)
// Merged rebuttal_con and rebuttal_pro into 'rebuttal'
const steps = [
  { key: 'framing', match: ['framing', 'waiting_confirmation', 'refining'], icon: MessageCircle, labelKey: 'framing' },
  { key: 'researching', match: ['researching', 'research_completed'], icon: Circle, labelKey: 'researching' },
  { key: 'pro_constructive', match: ['pro_constructive'], icon: Mic2, labelKey: 'arguing_pro' },
  { key: 'con_cx', match: ['con_cx'], icon: MessageCircle, labelKey: 'cx_con' },
  { key: 'con_constructive', match: ['con_constructive'], icon: Mic2, labelKey: 'arguing_con' },
  { key: 'pro_cx', match: ['pro_cx'], icon: MessageCircle, labelKey: 'cx_pro' },
  { key: 'rebuttal', match: ['rebuttal'], icon: Gavel, labelKey: 'rebuttal_con' }, // Using rebuttal_con label as generic or we can map it
  { key: 'analyzing', match: ['analyzing', 'complete'], icon: CheckCircle2, labelKey: 'analyzing' },
];

const StepProgress: React.FC<StepProgressProps> = ({ currentStep, labels, onStepClick, topic }) => {
  // Helper to determine active index based on current simulation step
  const getCurrentIndex = () => {
    if (currentStep === 'complete') return steps.length - 1;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].match.includes(currentStep as string)) return i;
    }
    return -1;
  };

  const activeIndex = getCurrentIndex();

  const getLabel = (key: string): string => {
    const val = labels[key];
    if (Array.isArray(val)) return val[0] || key;
    return val || key;
  };

  return (
    <div className="w-full sticky top-16 z-40 bg-slate-50/95 backdrop-blur-sm transition-all">
       {/* Optional Topic Header for Scrolling Context */}
       <div className={`overflow-hidden transition-all duration-500 ease-in-out ${topic ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
             <h3 className="text-sm font-bold text-slate-800 truncate text-center font-serif leading-tight">
                {topic}
             </h3>
          </div>
       </div>

      <div className="overflow-x-auto no-scrollbar py-3">
        <div className="flex items-start justify-between relative min-w-[600px] px-6 max-w-5xl mx-auto">
          {/* Connecting Line */}
          <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-0.5 bg-slate-200 -z-10" />
          
          {steps.map((step, index) => {
            const isActive = index === activeIndex;
            const isCompleted = index < activeIndex;
            const Icon = step.icon;
            const isClickable = isCompleted || isActive;
            
            return (
              <div 
                key={step.key} 
                onClick={() => isClickable && onStepClick && onStepClick(step.key)}
                className={`group flex flex-col items-center gap-2 bg-slate-50 px-2 z-10 min-w-[80px] ${isClickable ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
              >
                <div className={`transition-transform duration-300 ease-out origin-center ${isClickable ? 'group-hover:scale-125' : ''}`}>
                  {isCompleted ? (
                     <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm border border-indigo-200">
                       <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                     </div>
                  ) : isActive ? (
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border-2 border-indigo-500 animate-pulse shadow-sm">
                      <Icon className="w-4 h-4 text-indigo-700" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                      <Circle className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-medium text-center leading-tight transition-colors duration-200 ${isActive ? 'text-indigo-700 font-bold' : 'text-slate-500 group-hover:text-indigo-600'}`}>
                  {getLabel(step.labelKey)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepProgress;
