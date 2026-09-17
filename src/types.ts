export type UserRole = 'ADMIN' | 'PROCUREMENT_OFFICER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  created_at: string;
}

export interface Standard {
  id: string;
  is_number: string;
  title: string;
  category: string;
  scope: string;
  description: string;
  keywords: string[];
  status: 'ACTIVE' | 'REVISED' | 'UNDER_REVIEW' | 'WITHDRAWN';
  revision: string;
  source_reference: string;
  document_name: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  chunks_count?: number;
}

export interface StandardChunk {
  id: string;
  standard_id: string;
  chunk_text: string;
  page_number: number;
  section: string;
  chunk_index: number;
}

export interface ExtractedRequirements {
  product: string;
  category: string;
  material: string;
  application: string;
  environment: string;
  quantity: string;
  dimensions: string;
  power?: string;
  performance_requirements: string[];
  safety_requirements: string[];
  technical_specifications: string[];
  certifications: string[];
  other_constraints: string[];
  raw_input: string;
}

export type ApplicabilityType =
  | 'HIGHLY_APPLICABLE'
  | 'STRONG_CANDIDATE'
  | 'POTENTIALLY_APPLICABLE'
  | 'CONDITIONALLY_APPLICABLE'
  | 'RELATED'
  | 'LOW_RELEVANCE';

export type ReviewStatus = 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED';

export interface EvidenceItem {
  document: string;
  section: string;
  page: number;
  snippet: string;
}

export interface ScoreBreakdown {
  semantic: number;
  product: number;
  category: number;
  application: number;
  technical: number;
  safety: number;
  final: number;
}

export interface Recommendation {
  id: string;
  search_id: string;
  standard_id: string;
  standard?: Standard;
  relevance_score: number; // 0-100
  confidence_score: number; // 0.0-1.0
  applicability_type: ApplicabilityType;
  reason: string;
  reasons_breakdown: string[];
  matched_requirements: string[];
  conditions: string[];
  evidence: EvidenceItem[];
  score_breakdown: ScoreBreakdown;
  review_status: ReviewStatus;
  review_notes?: string;
  is_saved?: boolean;
  created_at: string;
}

export interface SearchHistoryItem {
  id: string;
  user_id: string;
  user_email?: string;
  query: string;
  extracted_requirements: ExtractedRequirements;
  recommendations_count: number;
  top_standard?: string;
  top_score?: number;
  processing_time_ms: number;
  ai_mode: 'AI' | 'FALLBACK';
  created_at: string;
  recommendations?: Recommendation[];
}

export interface RankingWeights {
  semantic_weight: number;
  product_weight: number;
  category_weight: number;
  application_weight: number;
  technical_weight: number;
  safety_weight: number;
  top_k: number;
}

export interface SystemStats {
  total_standards: number;
  total_chunks: number;
  searches_performed: number;
  total_recommendations: number;
  high_relevance_matches: number;
  pending_reviews: number;
  accepted_reviews: number;
  rejected_reviews: number;
  categories_distribution: { category: string; count: number }[];
  applicability_distribution: { type: string; count: number }[];
  searches_timeline: { date: string; searches: number }[];
}
