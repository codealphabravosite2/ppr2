import React, { useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[slideIn_0.3s_ease-out]">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${
        type === 'success' 
          ? 'bg-paper-900 text-white border-paper-800' 
          : 'bg-red-50 text-red-900 border-red-100'
      }`}>
        {type === 'success' ? <Check size={18} className="text-green-400" /> : <AlertCircle size={18} className="text-red-500" />}
        <p className="font-medium text-sm">{message}</p>
        <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
          <X size={14} />
        </button>
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};