import React, { useState, useEffect, useRef } from 'react';
import { Message, RewriteStyle } from '../types';
import { chatAboutDocument, rewriteSection } from '../services/geminiService';
import { Button } from './Button';
import { Send, Sparkles, X, MessageSquare, BookOpen, User, Bot, RefreshCw } from 'lucide-react';

interface AISidebarProps {
  documentText: string;
  isOpen: boolean;
  onClose: () => void;
  selectedText?: string;
}

export const AISidebar: React.FC<AISidebarProps> = ({ documentText, isOpen, onClose, selectedText }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'tools'>('tools');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: "Hi! I'm Lexicon. Ask me anything about the text or select a section to rewrite it!" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Switch to tools tab if text is selected
  useEffect(() => {
    if (selectedText) {
      setActiveTab('tools');
      setRewriteResult(null); 
    }
  }, [selectedText]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const responseText = await chatAboutDocument(documentText, history, input);
      
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content: responseText };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRewrite = async (style: RewriteStyle) => {
    if (!selectedText && !documentText) return;
    
    setIsRewriting(true);
    // If no text selected, maybe grab the first 2000 chars as a demo or ask user to select.
    // For this MVP, we will rewrite the Selection if exists, otherwise prompt.
    const textToProcess = selectedText || "Please select some text to rewrite first!";
    
    if (!selectedText) {
        setRewriteResult("Please highlight a section of the text you found boring, and I'll spice it up!");
        setIsRewriting(false);
        return;
    }

    try {
      const result = await rewriteSection(textToProcess, style);
      setRewriteResult(result);
    } catch (err) {
      setRewriteResult("Something went wrong while rewriting.");
    } finally {
      setIsRewriting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-paper-200 z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-paper-200 flex justify-between items-center bg-paper-50">
        <h2 className="font-serif font-bold text-lg text-paper-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            AI Companion
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-paper-200 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-paper-200">
        <button 
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'tools' ? 'border-b-2 border-paper-900 text-paper-900' : 'text-gray-500 hover:text-paper-900'}`}
        >
          Magic Tools
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'chat' ? 'border-b-2 border-paper-900 text-paper-900' : 'text-gray-500 hover:text-paper-900'}`}
        >
          Chat
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-paper-50/50 p-4">
        {activeTab === 'chat' ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 mb-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-paper-200' : 'bg-paper-900 text-white'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                   </div>
                   <div className={`p-3 rounded-lg text-sm max-w-[85%] leading-relaxed ${
                     msg.role === 'user' 
                       ? 'bg-white border border-paper-200 shadow-sm' 
                       : 'bg-paper-100 text-paper-900 border border-paper-200'
                   }`}>
                     {msg.content}
                   </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-paper-900 text-white flex items-center justify-center">
                     <Bot size={16} />
                   </div>
                   <div className="bg-paper-100 p-3 rounded-lg flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-paper-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                    {selectedText ? 'Selected Text Action' : 'Select text to activate'}
                </h3>
                
                {selectedText && (
                    <div className="mb-4 p-2 bg-paper-100 rounded text-xs text-gray-600 font-mono line-clamp-3 italic border-l-2 border-paper-400">
                        "{selectedText}"
                    </div>
                )}

                <div className="grid grid-cols-1 gap-2">
                    <Button onClick={() => handleRewrite('engaging')} variant="secondary" size="sm" className="w-full justify-start gap-2" disabled={!selectedText || isRewriting}>
                        <Sparkles size={16} className="text-purple-600" /> Make it Exciting
                    </Button>
                    <Button onClick={() => handleRewrite('simplify')} variant="secondary" size="sm" className="w-full justify-start gap-2" disabled={!selectedText || isRewriting}>
                        <BookOpen size={16} className="text-blue-600" /> Explain Like I'm 5
                    </Button>
                    <Button onClick={() => handleRewrite('sarcastic')} variant="secondary" size="sm" className="w-full justify-start gap-2" disabled={!selectedText || isRewriting}>
                        <MessageSquare size={16} className="text-orange-600" /> Roast This Text
                    </Button>
                     <Button onClick={() => handleRewrite('pirate')} variant="secondary" size="sm" className="w-full justify-start gap-2" disabled={!selectedText || isRewriting}>
                        <span className="text-lg">🏴‍☠️</span> Pirate Mode
                    </Button>
                </div>
            </div>

            {rewriteResult && (
                <div className="bg-white p-4 rounded-xl border border-paper-200 shadow-md animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-serif font-bold text-paper-900">Result</h3>
                        <Button variant="ghost" size="sm" onClick={() => setRewriteResult(null)}>
                            <RefreshCw size={14} />
                        </Button>
                    </div>
                    <div className="prose prose-sm text-paper-800 font-serif leading-relaxed">
                        {rewriteResult}
                    </div>
                </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area (Only for Chat) */}
      {activeTab === 'chat' && (
        <div className="p-4 bg-white border-t border-paper-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about the text..."
              className="flex-1 px-4 py-2 border border-paper-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-paper-800 focus:border-transparent bg-paper-50"
            />
            <Button onClick={handleSendMessage} variant="primary" disabled={!input.trim() || isTyping}>
              <Send size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};