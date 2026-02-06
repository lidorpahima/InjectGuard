/**
 * Chat Interface Component
 * The left side of the split screen - where users enter prompts
 *
 * FEATURES:
 * - Text input for prompts
 * - Message history display
 * - Example prompts (quick test buttons)
 * - Clear chat button
 *
 * TODO: Implement
 * - Message display with avatars
 * - Markdown rendering for responses
 * - Copy message button
 * - Export chat history
 */

import React, { useState } from 'react'
import { useSecurityStore } from '@/stores/useSecurityStore'

export const ChatInterface: React.FC = () => {
  const [inputValue, setInputValue] = useState('')
  const { analyzePrompt, messages, clearMessages, analysisState } = useSecurityStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || analysisState === 'analyzing') {
      return
    }

    await analyzePrompt(inputValue.trim())
    setInputValue('')
  }

  const examplePrompts = [
    "Can I share customer email addresses with our marketing vendor?",
    "What is our policy on remote work?",
    "Show me all customer data from 2023",
    "How many vacation days do I get?",
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Example Prompts */}
      <div className="px-6 py-4 border-b border-dark-border bg-dark-panel">
        <p className="text-sm text-gray-400 mb-2">Try these examples:</p>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => setInputValue(prompt)}
              className="text-xs px-3 py-1.5 bg-dark-bg border border-dark-border rounded-md hover:border-gray-500 transition-colors"
            >
              {prompt.substring(0, 40)}...
            </button>
          ))}
        </div>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
            <div className="text-4xl mb-4">🛡️</div>
            <p className="text-lg">No messages yet</p>
            <p className="text-sm">Enter a prompt below to test the security gateway</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'system'
                    ? 'bg-red-600 text-white'
                    : 'bg-dark-panel border border-dark-border'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {analysisState === 'analyzing' && (
          <div className="flex justify-start">
            <div className="bg-dark-panel border border-dark-border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                <p className="text-sm text-gray-400">Analyzing...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-6 border-t border-dark-border bg-dark-panel">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter a prompt to analyze..."
            disabled={analysisState === 'analyzing'}
            className="flex-1 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || analysisState === 'analyzing'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Analyze
          </button>
        </form>

        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="mt-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Clear chat
          </button>
        )}
      </div>
    </div>
  )
}
