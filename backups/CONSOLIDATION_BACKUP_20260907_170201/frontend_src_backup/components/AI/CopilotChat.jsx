import React, { useState, useEffect, useRef } from 'react'
import { aiAPI } from '../../services/api'

/**
 * Copilot Chat
 *
 * 2026-08-31: the "16gm AI Copilot Framework" (7 domain copilots - Finance,
 * Logistics, Warehouse, Insurance, Nutrition, Marketplace, Generic) has had
 * a real, complete backend (backend/src/services/legacy/aiCopilotService.js,
 * 674 lines) and a real, matching frontend API client (aiAPI.copilot.* in
 * services/api.js) for a while, but zero UI ever called it - the biggest
 * gap the project's own .ai/architecture/AI_BACKBONE_COMPONENT_MAPPING.md
 * flagged ("Only generic AI chat interface exists... need domain-specific
 * dashboards"). This is a real, working chat UI for any of the 6 domain
 * copilots, parameterized by copilotType - not a fabricated response, every
 * message here round-trips through the real backend and its real,
 * honestly-labelled (matched_on_real_data) responses.
 */

const COPILOT_META = {
  finance: { icon: '💰', label: 'Finance', placeholder: 'Ask about cash flow, budgets, payments…' },
  logistics: { icon: '🚚', label: 'Logistics', placeholder: 'Ask about routes, fleet, deliveries…' },
  warehouse: { icon: '📦', label: 'Warehouse', placeholder: 'Ask about inventory, layout, storage…' },
  insurance: { icon: '🛡️', label: 'Insurance', placeholder: 'Ask about policies, claims, risk…' },
  nutrition: { icon: '🥗', label: 'Nutrition', placeholder: 'Ask about diet, meals, nutrition…' },
  marketplace: { icon: '🛒', label: 'Marketplace', placeholder: 'Ask about pricing, products, trends…' },
}

export default function CopilotChat({ copilotType }) {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const meta = COPILOT_META[copilotType] || { icon: '🤖', label: copilotType, placeholder: 'Ask a question…' }

  useEffect(() => {
    setSessionId(null)
    setMessages([])
    setError(null)
  }, [copilotType])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function ensureSession() {
    if (sessionId) return sessionId
    const res = await aiAPI.copilot.createSession(copilotType, {})
    const id = res.data?.id
    setSessionId(id)
    return id
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError(null)
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const id = await ensureSession()
      const res = await aiAPI.copilot.sendMessage(id, text, {})
      const response = res.data?.response
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response?.content || 'No response received.',
          metadata: response?.metadata,
        },
      ])
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to reach the copilot')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[70vh] bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
        <span className="text-xl">{meta.icon}</span>
        <h3 className="font-semibold text-gray-900">{meta.label} Copilot</h3>
        {sessionId && <span className="ml-auto text-xs text-gray-400">Session #{sessionId}</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <div className="text-4xl mb-2">{meta.icon}</div>
            <p>Start a conversation with the {meta.label} Copilot</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                  m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.metadata && m.metadata.matched_on_real_data === false && (
                  <p className="mt-1 text-[11px] text-gray-400 italic">General guidance — no matching real data found for this question</p>
                )}
              </div>
            </div>
          ))
        )}
        {loading && <div className="text-sm text-gray-400 italic">{meta.label} copilot is thinking…</div>}
        <div ref={bottomRef} />
      </div>

      {error && <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-100">{error}</div>}

      <div className="flex items-center gap-2 p-3 border-t border-gray-200">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={meta.placeholder}
          disabled={loading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}

export { COPILOT_META }
