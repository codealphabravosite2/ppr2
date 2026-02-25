import React, { useState } from 'react';
import { Collection } from '../types';
import { Button } from './Button';
import { Folder, Plus, Trash2, AlertCircle, Settings, Download, Upload } from 'lucide-react';

interface DashboardProps {
  collections: Collection[];
  onSelectCollection: (id: string) => void;
  onCreateCollection: (name: string) => void;
  onDeleteCollection: (id: string) => void;
  onNewNote: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  collections, 
  onSelectCollection, 
  onCreateCollection,
  onDeleteCollection,
  onNewNote,
  onExport,
  onImport
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      onCreateCollection(newCollectionName);
      setNewCollectionName('');
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deleteConfirmId === id) {
      onDeleteCollection(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      // Auto reset confirmation after 3 seconds
      setTimeout(() => setDeleteConfirmId(prev => prev === id ? null : prev), 3000);
    }
  };

  const colors = [
    'bg-amber-50 border-amber-200 text-amber-900 hover:border-amber-300',
    'bg-stone-50 border-stone-200 text-stone-900 hover:border-stone-300',
    'bg-orange-50 border-orange-200 text-orange-900 hover:border-orange-300',
    'bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300',
  ];

  return (
    <div className="h-screen w-full overflow-y-auto bg-paper-50 custom-scrollbar">
      <div className="max-w-6xl mx-auto p-6 md:p-12 pb-32">
        <header className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-paper-200 pb-6">
          <div>
            <h1 className="text-4xl font-serif font-bold text-paper-900 mb-2 tracking-tight">Library</h1>
            <p className="text-gray-500 font-sans">Your personal knowledge base.</p>
          </div>
          
          <div className="flex gap-3 items-center">
              {/* Settings Dropdown */}
              <div className="relative z-20 shrink-0">
                  <button 
                      onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                      className="h-11 w-11 flex items-center justify-center border border-paper-200 bg-white shadow-sm rounded-lg text-paper-900 hover:bg-paper-50 transition-colors focus:outline-none focus:ring-2 focus:ring-paper-900"
                      title="Data Settings"
                  >
                      <Settings size={20} />
                  </button>
                  
                  {isSettingsOpen && (
                      <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsSettingsOpen(false)}></div>
                      <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-paper-200 py-2 z-30 animate-fade-in origin-top-left sm:origin-top-right">
                          <button onClick={() => { onExport(); setIsSettingsOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-paper-50 flex items-center gap-2 text-sm font-medium text-paper-900 transition-colors">
                              <Download size={16} /> Export Data
                          </button>
                          <label className="w-full text-left px-4 py-2 hover:bg-paper-50 flex items-center gap-2 text-sm font-medium text-paper-900 cursor-pointer transition-colors">
                              <Upload size={16} /> Import Data
                              <input type="file" accept=".json" onChange={(e) => { onImport(e); setIsSettingsOpen(false); }} className="hidden" />
                          </label>
                      </div>
                      </>
                  )}
              </div>

              <Button onClick={onNewNote} variant="primary" className="h-11 shadow-lg shadow-paper-900/10 flex items-center gap-2 transform transition-transform active:scale-95">
                <Plus size={20} /> <span className="font-semibold">New Note</span>
              </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {collections.map((col, idx) => (
            <div
              key={col.id}
              onClick={() => onSelectCollection(col.id)}
              className={`group relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl flex flex-col h-56 justify-between ${colors[idx % colors.length]}`}
            >
              <div className="flex justify-between items-start w-full relative z-10">
                <div className="p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                    <Folder size={24} className="opacity-80" />
                </div>
                
                <button
                    onClick={(e) => handleDeleteClick(e, col.id)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                        deleteConfirmId === col.id 
                            ? 'bg-red-500 text-white shadow-lg scale-110' 
                            : 'bg-white/0 text-gray-400 hover:bg-white/50 hover:text-red-500 opacity-0 group-hover:opacity-100'
                    }`}
                    title="Delete Collection"
                >
                    {deleteConfirmId === col.id ? <AlertCircle size={18} /> : <Trash2 size={18} />}
                </button>
              </div>

              <div>
                <h3 className="font-serif font-bold text-2xl mb-2 line-clamp-2 leading-tight">{col.name}</h3>
                <div className="flex items-center gap-2">
                    <span className="bg-white/50 px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-tight">
                    {col.noteCount} {col.noteCount === 1 ? 'Note' : 'Notes'}
                    </span>
                    {deleteConfirmId === col.id && (
                        <span className="text-xs font-bold text-red-600 animate-pulse">Confirm delete?</span>
                    )}
                </div>
              </div>
              
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            </div>
          ))}

          {/* Create Collection Card */}
          {isCreating ? (
            <form onSubmit={handleCreate} className="p-6 rounded-2xl border-2 border-dashed border-paper-300 bg-white/50 flex flex-col justify-center gap-4 h-56 animate-fade-in">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1 block">New Collection</label>
                <input
                    autoFocus
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Name..."
                    className="w-full bg-transparent border-b-2 border-paper-300 focus:border-paper-900 outline-none px-1 py-1 font-serif text-xl placeholder:text-gray-300 transition-colors"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button type="submit" size="sm" variant="primary" className="flex-1">Create</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="p-6 rounded-2xl border-2 border-dashed border-paper-300 hover:border-paper-400 hover:bg-white/50 transition-all h-56 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-paper-900 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-paper-100 group-hover:bg-paper-200 group-hover:scale-110 flex items-center justify-center transition-all duration-300">
                <Plus size={28} />
              </div>
              <span className="font-medium font-serif text-lg">New Collection</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
