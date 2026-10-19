export type Category = 
  | 'Sustainability & Cleantech'
  | 'Campus Life & Mobility'
  | 'EdTech & Productivity'
  | 'Health & Wellness'
  | 'Social Impact'
  | 'FinTech & Commerce'
  | 'AI & DeepTech';

export interface Idea {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: Category;
  problem_statement?: string;
  target_users?: string;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  is_demo?: boolean;
}

export interface Vote {
  id: string;
  idea_id: string;
  user_id: string;
  created_at: string;
}

export interface FeedbackItem {
  id: string;
  idea_id: string;
  user_id: string;
  promising_options: string[];
  beneficiary_options: string[];
  improvement_options: string[];
  knowledge_options: string[];
  written_suggestion?: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackReport {
  id: string;
  feedback_id: string;
  reporter_id: string;
  reason: 'Offensive' | 'Spam' | 'Irrelevant' | 'Personal attack' | 'Other';
  created_at: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export type AssessmentType = 'self' | 'peer';

export interface ReadinessAssessment {
  id: string;
  idea_id: string;
  assessor_id: string;
  assessment_type: AssessmentType;
  problem_clarity: number; // 1-5
  user_value: number;      // 1-5
  feasibility: number;     // 1-5
  sustainability: number;  // 1-5
  validation: number;      // 1-5
  created_at: string;
  updated_at: string;
}

export interface AssessmentScores {
  problem_clarity: number;
  user_value: number;
  feasibility: number;
  sustainability: number;
  validation: number;
}

export interface IdeaVersion {
  id: string;
  idea_id: string;
  version_number: number;
  title: string;
  description: string;
  evidence: string;
  created_at: string;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

export interface ImprovementTask {
  id: string;
  idea_id: string;
  task: string;
  priority: number;
  status: TaskStatus;
  created_at: string;
  category?: string;
}

export interface IdeaWithStats extends Idea {
  vote_count: number;
  feedback_count: number;
  has_voted: boolean;
  self_assessment?: ReadinessAssessment;
  peer_assessments_count: number;
  peer_average_scores?: AssessmentScores;
  overall_readiness_percentage: number;
  is_creator: boolean;
  user_feedback?: FeedbackItem;
  user_peer_assessment?: ReadinessAssessment;
}

export interface FeedbackAggregates {
  totalCount: number;
  promising: Record<string, { count: number; percentage: number }>;
  beneficiaries: Record<string, { count: number; percentage: number }>;
  improvements: Record<string, { count: number; percentage: number }>;
  knowledge: Record<string, { count: number; percentage: number }>;
}
