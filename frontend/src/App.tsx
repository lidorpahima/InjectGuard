/**
 * App.tsx
 * Main application component
 *
 * This is the root component that renders the entire application.
 * It contains the split-screen layout: Chat (left) + Analysis (right)
 */

import { useState } from 'react'

function App() {
  return (
    <div className="h-screen flex flex-col bg-dark-bg text-dark-text">
      {/* Header */}
      <header className="border-b border-dark-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🛡️</div>
            <div>
              <h1 className="text-xl font-bold text-white">LLM-Shield</h1>
              <p className="text-sm text-gray-400">Dynamic RAG Security Gateway</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Status: <span className="text-safe">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Chat Interface */}
        <div className="flex-1 border-r border-dark-border flex flex-col">
          <div className="px-6 py-4 border-b border-dark-border">
            <h2 className="text-lg font-semibold text-white">Chat Interface</h2>
            <p className="text-sm text-gray-400">Test prompts against your security policies</p>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl mx-auto">
              <div className="bg-dark-panel rounded-lg p-6 border border-dark-border">
                <p className="text-gray-400 text-center">
                  TODO: Implement Chat component
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Analysis Visualization */}
        <div className="flex-1 flex flex-col bg-dark-panel">
          <div className="px-6 py-4 border-b border-dark-border">
            <h2 className="text-lg font-semibold text-white">Under the Hood</h2>
            <p className="text-sm text-gray-400">Real-time analysis visualization</p>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl mx-auto">
              <div className="bg-dark-bg rounded-lg p-6 border border-dark-border">
                <p className="text-gray-400 text-center">
                  TODO: Implement Analysis component
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-dark-border px-6 py-3 text-center text-sm text-gray-500">
        LLM-Shield v0.1.0 | Built with React + FastAPI + LangChain
      </footer>
    </div>
  )
}

export default App
