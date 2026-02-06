/**
 * TypeScript Type Definitions
 * Central location for all TypeScript interfaces and types
 */

/**
 * Analysis Step
 * Represents a single step in the security analysis pipeline
 */
export interface AnalysisStep {
  name: 'pattern_check' | 'rag_retrieval' | 'llm_judge'
  passed: boolean
  duration_ms: number
  details?: Record<string, any>
}

/**
 * Analysis Request
 * Data sent to the backend API for analysis
 */
export interface AnalysisRequest {
  prompt: string
  context?: {
    user_id?: string
    session_id?: string
    metadata?: Record<string, any>
  }
  config?: {
    strict_mode?: boolean
    skip_cache?: boolean
  }
}

/**
 * Retrieved Document
 * A policy document retrieved by the RAG system
 */
export interface RetrievedDocument {
  source: string       // e.g., "Data_Privacy_Policy.pdf"
  section: string      // e.g., "4.2"
  content: string      // The actual text content
  score: number        // Similarity score (0.0 - 1.0)
}

/**
 * Analysis Response
 * Response from the backend API
 */
export interface AnalysisResponse {
  is_safe: boolean
  confidence: number
  processing_time_ms: number
  steps: AnalysisStep[]

  // Only present if unsafe
  threat_type?: 'policy_violation' | 'pattern_match' | 'jailbreak' | 'data_leak'
  explanation?: string
  violated_policies?: string[]
  retrieved_documents?: RetrievedDocument[]
}

/**
 * Chat Message
 * A message in the chat interface
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  analysis?: AnalysisResponse  // Attached if this was an analyzed prompt
}

/**
 * Analysis State
 * Current state of the analysis process
 */
export type AnalysisState =
  | 'idle'           // No analysis in progress
  | 'analyzing'      // Analysis in progress
  | 'completed'      // Analysis completed
  | 'error'          // Analysis failed

/**
 * Security Store State
 * Global state managed by Zustand
 */
export interface SecurityStoreState {
  // Current analysis
  currentAnalysis: AnalysisResponse | null
  analysisState: AnalysisState
  error: string | null

  // Chat history
  messages: ChatMessage[]

  // Actions
  analyzePrompt: (prompt: string) => Promise<void>
  clearAnalysis: () => void
  addMessage: (message: ChatMessage) => void
  clearMessages: () => void
}
