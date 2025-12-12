
import React from 'react';
import { Play, Pause, FastForward, ToggleLeft, ToggleRight } from 'lucide-react';

interface ControlBarProps {
  stepReady: boolean;
  isPaused: boolean;
  isAutoPlay: boolean;
  onToggleAutoPlay: () => void;
  onNext: () => void;
  onPauseToggle: () => void;
  labels: any;
  className?: string;
}

const ControlBar: React.FC<ControlBarProps> = ({
  stepReady,
  isPaused,
  isAutoPlay,
  onToggleAutoPlay,
  onNext,
  onPauseToggle,
  labels,
  className = ""
}) => {
  // Determine button state based on priority
  // 1. If Paused -> Resume
  // 2. If AutoPlay is active -> Pause (Even if stepReady, we are "playing" the countdown)
  // 3. If Step is Ready (Manual Mode) -> Next
  // 4. Otherwise (Running) -> Pause

  const showResume = isPaused;
  // Show Next only if we are waiting for user input (stepReady), NOT in auto-play, and NOT paused
  const showNext = stepReady && !isAutoPlay && !isPaused;
  // Show Pause if we are running (auto-play OR not ready yet) and NOT paused
  // Effectively: !isPaused && (isAutoPlay || !stepReady)
  const showPause = !isPaused && !showNext && !showResume;

  const handleClick = () => {
    if (showNext) {
      onNext();
    } else {
      onPauseToggle();
    }
  };

  return (
    <div className={`flex items-center gap-4 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-xl border border-slate-200 animate-in slide-in-from-bottom-10 fade-in duration-500 ${className}`}>
      
      {/* Main Action Button */}
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white shadow-lg transition-all active:scale-95 ${
          showNext
            ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' 
            : showResume
              ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' // Resume
              : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' // Pause
        }`}
      >
        {showNext ? (
          <>
            <span>{labels.nextStep}</span>
            <FastForward className="w-5 h-5 fill-current" />
          </>
        ) : showResume ? (
          <>
            <span>{labels.resume}</span>
            <Play className="w-5 h-5 fill-current" />
          </>
        ) : (
          <>
            <span>{labels.pause}</span>
            <Pause className="w-5 h-5 fill-current" />
          </>
        )}
      </button>

      {/* Auto-Play Toggle */}
      <div 
        className="flex items-center gap-2 cursor-pointer group" 
        onClick={onToggleAutoPlay}
      >
        <div className={`transition-colors ${isAutoPlay ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
          {isAutoPlay ? (
            <ToggleRight className="w-8 h-8" />
          ) : (
            <ToggleLeft className="w-8 h-8" />
          )}
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider ${isAutoPlay ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
          {labels.autoPlay}
        </span>
      </div>

    </div>
  );
};

export default ControlBar;
