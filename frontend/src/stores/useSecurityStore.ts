/**
 * Security Store (Zustand)
 * Global state management for security analysis
 *
 * This store manages:
 * - Current analysis state and results
 * - Chat message history
 * - Analysis actions (analyze, clear, etc.)
 *
 * USAGE:
 * ```tsx
 * import { useSecurityStore } from '@/stores/useSecurityStore'
 *
 * function MyComponent() {
 *   const { analyzePrompt, currentAnalysis, analysisState } = useSecurityStore()
 *
 *   const handleSubmit = async () => {
 *     await analyzePrompt("Can I share customer data?")
 *   }
 *
 *   return <div>{currentAnalysis?.explanation}</div>
 * }
 * ```
 */

import { create } from 'zustand'
import { analyzePrompt as apiAnalyzePrompt } from '@/api/client'
import type {
  SecurityStoreState,
  AnalysisResponse,
  ChatMessage,
  AnalysisState,
} from '@/types'

/**
 * Create the Zustand store
 */
export const useSecurityStore = create<SecurityStoreState>((set, get) => ({
  // State
  currentAnalysis: null,
  analysisState: 'idle',
  error: null,
  messages: [],

  // Actions
  analyzePrompt: async (prompt: string) => {
    // Set state to analyzing
    set({
      analysisState: 'analyzing',
      error: null,
      currentAnalysis: null,
    })

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    }
    get().addMessage(userMessage)

    try {
      // Call API
      const result = await apiAnalyzePrompt({
        prompt,
        context: {
          session_id: generateSessionId(),
        },
      })

      // Update state with results
      set({
        currentAnalysis: result,
        analysisState: 'completed',
      })

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.is_safe
          ? '✅ Prompt is safe. No policy violations detected.'
          : `❌ ${result.explanation}`,
        timestamp: new Date(),
        analysis: result,
      }
      get().addMessage(assistantMessage)
    } catch (error) {
      // Handle error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      set({
        analysisState: 'error',
        error: errorMessage,
      })

      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      }
      get().addMessage(errorChatMessage)
    }
  },

  clearAnalysis: () => {
    set({
      currentAnalysis: null,
      analysisState: 'idle',
      error: null,
    })
  },

  addMessage: (message: ChatMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },

  clearMessages: () => {
    set({
      messages: [],
      currentAnalysis: null,
      analysisState: 'idle',
      error: null,
    })
  },
}))

/**
 * Helper function to generate a session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
