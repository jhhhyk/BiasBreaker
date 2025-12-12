
export type Sector = "Statistics" | "PublicOpinion" | "DomesticCases" | "InternationalCases" | "Theories" | "Stakeholders";
export type Language = string; // Changed from "en" | "ko" to support all languages

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// Step 1: Issue Framer
export interface FramedIssue {
  refined_issue: string;
  definition?: string;
  scope: {
    country: string;
    timeframe: string;
  };
  positions: {
    pro: string;
    con: string;
  };
  clarification_needed: boolean;
}

export interface IssueRefinement {
  message: string;
  draft: FramedIssue;
}

// Step 2: Evidence
export interface EvidenceItem {
  id: string;
  content: string; // Serves as Headline/Summary
  detail?: string; // Detailed content
  sector: Sector;
  source_summary: string;
  reliability: "High" | "Medium" | "Low";
  url?: string; // URL of the source
  score?: number; // Quality score (0-100)
  score_breakdown?: {
    objectivity: number;
    relevance: number;
    significance: number;
  };
  // New InfoQ 4-Pillar Breakdown for Tooltips
  info_q_breakdown?: {
    resolution: number;
    temporal: number;
    reliability: number;
    context: number;
  };
  stakeholder_type?: "Benefit" | "Loss";
}

export interface EvidenceBoard {
  evidence_board: EvidenceItem[];
}

// Step 2.5: Additional Research (ResearchCoordinator)
export interface ResearchRequest {
  pro_query: string;
  pro_sector: Sector;
  con_query: string;
  con_sector: Sector;
  reasoning: string;
}

// Step 3: Arguments (Constructive Speech Structure)
export interface Contention {
  signpost: string; // "First", "Second"
  claim: string;
  reasoning: string;
  evidence_id: string[];
  sector: Sector;
}

export interface ConstructiveSpeech {
  introduction: {
    hook: string;
    definitions: string;
    value_criterion: string; // The standard (e.g. Efficiency, Equity)
    roadmap: string;
  };
  contentions: Contention[];
  conclusion: {
    summary: string;
    final_appeal: string;
  };
}

export interface ProConArguments {
  pro_speech: ConstructiveSpeech;
  con_speech: ConstructiveSpeech;
}

// Step 4: Rebuttals
export interface RebuttalItem {
  target_claim: string; // The specific claim being attacked
  sector: Sector;
  defense: string; // Response to the previous opponent's rebuttal
  rebuttal: string; // The attack/counter-argument
  evidence_used: string[];
  logical_issue_identified: string;
}

export interface RebuttalSet {
  pro_rebuttals: RebuttalItem[];
  con_rebuttals: RebuttalItem[];
}

// Step 5: Cross Exam
export interface CrossExamSet {
  pro_questions: string[];
  con_answers: string[];
  con_questions: string[];
  pro_answers: string[];
}

// Step 6: Meta Analysis
export interface AnalysisPoint {
  issue: string;          // The specific point of contention
  pro_argument: string;   // Summary of Pro's stance on this point
  con_argument: string;   // Summary of Con's stance on this point
  rebuttal_note: string;  // Summary of the clash/rebuttal regarding this point
}

export interface MetaAnalysis {
  issue_map: {
    [key: string]: AnalysisPoint[];
  };
  evidence_evaluation: {
    description: string;
    score: number;
  };
  key_agreements: string[];
  key_disagreements: string[];
  uncertainties: string[];
  reflection_prompts: string[];
}

// Continuous Debate
export interface DebateRound {
  id: string;
  type: 'debate' | 'qa'; // 'debate' for full cycle, 'qa' for simple answer
  focusTopic: string;
  
  // For Type 'debate'
  arguments?: ProConArguments;
  rebuttals?: RebuttalSet;
  crossExam?: CrossExamSet;

  // For Type 'qa'
  qa_response?: {
    pro_answer?: string; // Optional for progressive loading
    con_answer?: string; // Optional for progressive loading
  };

  timestamp: number;
}

// Application State
export type SimulationStep = 
  | 'idle' 
  | 'framing' 
  | 'waiting_confirmation' 
  | 'refining' 
  | 'researching' 
  | 'research_completed' // Added explicit step for user confirmation
  // CEDA Granular Steps - Explicitly separated
  | 'pro_constructive'
  | 'con_cx'
  | 'con_constructive'
  | 'pro_cx'
  | 'rebuttal' // Merged single phase
  | 'analyzing' 
  | 'complete'
  | 'error';

export type SectorStatus = 'pending' | 'loading' | 'completed' | 'error';

export interface SimulationState {
  status: SimulationStep;
  error?: string;
  originalTopic: string;
  framedIssue: FramedIssue | null;
  framingChat: ChatMessage[];
  evidenceBoard: EvidenceBoard | null;
  sectorStatuses: Record<Sector, SectorStatus>; // Track status per sector
  arguments: ProConArguments | null;
  rebuttals: RebuttalSet | null;
  crossExam: CrossExamSet | null;
  analysis: MetaAnalysis | null;
  additionalRounds: DebateRound[];
  isGeneratingRound: boolean;
  isTyping?: boolean;
}