/**
 * Analysis View Component
 * The right side of the split screen - visualizes the analysis process
 *
 * FEATURES:
 * - Shows each step of the analysis pipeline
 * - Real-time progress indicators
 * - Detailed step information
 * - Retrieved documents display
 * - Final verdict with explanation
 *
 * VISUALIZATION:
 * ┌─────────────────────────────┐
 * │ Step 1: Pattern Check    ✓  │
 * │ - No SQL injection          │
 * │ - No jailbreak patterns     │
 * │ Duration: 5ms               │
 * ├─────────────────────────────┤
 * │ Step 2: RAG Retrieval    ⏳ │
 * │ - Searching policies...     │
 * │ - Found 3 documents         │
 * ├─────────────────────────────┤
 * │ Step 3: LLM Judge        ⏳ │
 * │ - Evaluating...             │
 * └─────────────────────────────┘
 *
 * TODO: Implement
 * - Animated step transitions (Framer Motion)
 * - Collapsible step details
 * - Document preview on hover
 */

import React from 'react'
import { useSecurityStore } from '@/stores/useSecurityStore'
import type { AnalysisStep } from '@/types'

export const AnalysisView: React.FC = () => {
  const { currentAnalysis, analysisState } = useSecurityStore()

  if (analysisState === 'idle') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-lg">No analysis yet</p>
          <p className="text-sm">Submit a prompt to see the analysis process</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analysis Steps */}
      <div className="space-y-4">
        {currentAnalysis?.steps.map((step, idx) => (
          <StepCard key={idx} step={step} />
        ))}

        {/* Show loading for incomplete steps */}
        {analysisState === 'analyzing' && (
          <div className="bg-dark-bg rounded-lg p-6 border border-dark-border">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              <div>
                <p className="font-medium text-white">Analyzing...</p>
                <p className="text-sm text-gray-400">Running security checks</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Final Verdict */}
      {currentAnalysis && analysisState === 'completed' && (
        <div
          className={`rounded-lg p-6 border-2 ${
            currentAnalysis.is_safe
              ? 'bg-safe/10 border-safe'
              : 'bg-unsafe/10 border-unsafe'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">
              {currentAnalysis.is_safe ? '✅' : '❌'}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">
                {currentAnalysis.is_safe ? 'Safe' : 'Unsafe'}
              </h3>

              <p className="text-sm text-gray-300 mb-4">
                {currentAnalysis.explanation ||
                  'No policy violations detected.'}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Confidence</p>
                  <p className="text-white font-medium">
                    {(currentAnalysis.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Processing Time</p>
                  <p className="text-white font-medium">
                    {currentAnalysis.processing_time_ms}ms
                  </p>
                </div>
              </div>

              {/* Violated Policies */}
              {currentAnalysis.violated_policies &&
                currentAnalysis.violated_policies.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-white mb-2">
                      Violated Policies:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                      {currentAnalysis.violated_policies.map((policy, idx) => (
                        <li key={idx}>{policy}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Retrieved Documents */}
              {currentAnalysis.retrieved_documents &&
                currentAnalysis.retrieved_documents.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-white mb-2">
                      Referenced Documents:
                    </p>
                    <div className="space-y-2">
                      {currentAnalysis.retrieved_documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="bg-dark-bg rounded p-3 border border-dark-border"
                        >
                          <p className="text-sm font-medium text-white">
                            {doc.source} - Section {doc.section}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {doc.content.substring(0, 100)}...
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Similarity: {(doc.score * 100).toFixed(1)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {analysisState === 'error' && (
        <div className="bg-red-900/20 rounded-lg p-6 border border-red-500">
          <div className="flex items-start gap-4">
            <div className="text-3xl">⚠️</div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Error</h3>
              <p className="text-sm text-red-200">
                An error occurred during analysis. Please try again.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Individual Step Card Component
 */
const StepCard: React.FC<{ step: AnalysisStep }> = ({ step }) => {
  const stepNames: Record<string, string> = {
    pattern_check: 'Pattern Matching',
    rag_retrieval: 'RAG Retrieval',
    llm_judge: 'LLM Judge',
  }

  const stepIcons: Record<string, string> = {
    pattern_check: '🔍',
    rag_retrieval: '📚',
    llm_judge: '⚖️',
  }

  return (
    <div className="bg-dark-bg rounded-lg p-6 border border-dark-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{stepIcons[step.name]}</span>
          <div>
            <h4 className="font-medium text-white">
              {stepNames[step.name] || step.name}
            </h4>
            <p className="text-sm text-gray-400">
              {step.duration_ms}ms
            </p>
          </div>
        </div>
        <div className="text-2xl">{step.passed ? '✓' : '✗'}</div>
      </div>

      {step.details && (
        <div className="mt-3 pt-3 border-t border-dark-border">
          <pre className="text-xs text-gray-400 overflow-auto">
            {JSON.stringify(step.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
