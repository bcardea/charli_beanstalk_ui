'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Copy,
  CornerDownLeft,
  MessageSquare,
  RotateCcw,
  Trash2,
  X,
  XCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useLocation } from '@/contexts/LocationContext';

interface DocumentPoint {
  title: string;
  content: string;
  timestamp: string;
}

export default function ChatArea() {
  const { locationId } = useLocation();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentPoint[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          locationId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const data = await response.json();
      
      setDocuments(prev => [...prev, {
        title: input,
        content: data.response,
        timestamp: new Date().toISOString()
      }]);
      
      setInput('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white/10 backdrop-blur-md">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {documents.map((doc, index) => (
          <div key={index} className="bg-white/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">{doc.title}</h3>
              <div className="flex items-center space-x-2">
                <button className="text-white/70 hover:text-white">
                  <Copy size={16} />
                </button>
                <button className="text-white/70 hover:text-white">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-white/90">{doc.content}</p>
            <div className="text-white/50 text-sm">
              {new Date(doc.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10">
        {error && (
          <div className="mb-4 flex items-center space-x-2 text-red-500 bg-red-500/10 p-2 rounded">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-white/5 text-white placeholder-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin">
                <RotateCcw size={16} />
              </div>
            ) : (
              <CornerDownLeft size={16} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
