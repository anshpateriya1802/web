"use client"

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, UIMessage as Message } from 'ai'
import { useRoomStore } from '@/stores/roomStore'
import { Send, Bot, User, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEffect, useRef, useState } from 'react'

export default function AIChatPanel() {
  const activeFileId = useRoomStore(state => state.activeFileId)
  const openTabs = useRoomStore(state => state.openTabs)
  const activeTab = openTabs.find(t => t.id === activeFileId)

  const [input, setInput] = useState('')

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        codeContext: activeTab ? activeTab.content : null,
      }
    })
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-[#111111] border-l border-gray-800 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-purple-400" />
          <h2 className="text-sm font-semibold text-white">Gemini Assistant</h2>
        </div>
        <button 
          onClick={() => setMessages([])} 
          title="Clear Chat"
          className="text-gray-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
            <Bot size={48} className="text-purple-500/20" />
            <div>
              <p className="text-sm font-medium text-gray-400">How can I help you code?</p>
              <p className="text-xs mt-2">I automatically read your active file context.</p>
            </div>
          </div>
        ) : (
          messages.map((m: Message) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-6 h-6 rounded-md bg-purple-600/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={14} className="text-purple-400" />
                </div>
              )}
              
              <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-gray-800/60 text-gray-200 border border-gray-700/50 rounded-tl-none'
              }`}>
                {m.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">
                    {m.parts?.filter(p => p.type === 'text').map((p: any) => p.text).join('\n')}
                  </p>
                ) : (
                  <div className="text-sm prose prose-invert max-w-none prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-gray-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.parts?.filter(p => p.type === 'text').map((p: any) => p.text).join('\n')}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                  <User size={14} className="text-indigo-400" />
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-6 h-6 rounded-md bg-purple-600/20 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-purple-400" />
            </div>
            <div className="bg-gray-800/60 px-4 py-3 rounded-lg rounded-tl-none border border-gray-700/50">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0a0a0a] border-t border-gray-800 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            className="flex-1 bg-[#111111] border border-gray-700 focus:border-purple-500 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition-colors"
            value={input}
            placeholder="Ask anything..."
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white p-2 rounded-md transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
        {activeTab && (
          <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
            Context: {activeTab.name}
          </p>
        )}
      </div>
    </div>
  )
}
