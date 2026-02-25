import React, { useState } from 'react';
import { Button } from './Button';
import { Book, FileText, Sparkles, Upload, ArrowLeft, Folder } from 'lucide-react';
import { Collection, Folder as FolderType } from '../types';

interface LandingProps {
  onCancel: () => void;
  collections: Collection[];
  folders: FolderType[];
  preSelectedCollectionId?: string;
  preSelectedFolderId?: string;
  onCreateNote: (title: string, content: string, collectionId: string, folderId?: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ 
  onCancel, 
  collections, 
  folders, 
  preSelectedCollectionId, 
  preSelectedFolderId, 
  onCreateNote 
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  
  const [selectedCollectionId, setSelectedCollectionId] = useState(preSelectedCollectionId || collections[0]?.id || '');
  // Initialize selectedFolderId. If a collection is pre-selected, check if a folder is pre-selected and belongs to it.
  const [selectedFolderId, setSelectedFolderId] = useState<string>(preSelectedFolderId || '');

  // Filter folders available for the selected collection
  const availableFolders = folders.filter(f => f.collectionId === selectedCollectionId);

  const handleNext = () => {
    if (text.trim().length < 10) return;
    setStep(2);
  };

  const handleFinish = () => {
    if (!title.trim() || !selectedCollectionId) return;
    onCreateNote(title, text, selectedCollectionId, selectedFolderId || undefined);
  };

  const handleCollectionChange = (id: string) => {
    setSelectedCollectionId(id);
    setSelectedFolderId(''); // Reset folder when collection changes
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setText(content);
        // Try to guess title from filename
        const name = file.name.replace(/\.[^/.]+$/, "");
        setTitle(name);
      };
      reader.readAsText(file);
    }
  };

  const SAMPLE_TEXT = `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do...`;

  return (
    <div className="min-h-screen bg-paper-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8 animate-fade-in relative">
        <Button variant="ghost" className="absolute -top-16 left-0" onClick={onCancel}>
             <ArrowLeft size={18} className="mr-2"/> Cancel
        </Button>

        <div className="text-center space-y-4">
            <h1 className="text-3xl font-serif font-bold text-paper-900 tracking-tight">
                {step === 1 ? 'What are we reading?' : 'Final Touches'}
            </h1>
        </div>

        {step === 1 ? (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-paper-200 transition-all duration-300">
                <div className="mb-4 flex items-center justify-between">
                    <label className="text-sm font-bold uppercase text-gray-500 tracking-wider">Content Input</label>
                    <button onClick={() => setText(SAMPLE_TEXT)} className="text-xs text-blue-600 hover:underline">
                        Load Sample Text
                    </button>
                </div>
                
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your article, contract, or text here..."
                    className="w-full h-64 p-4 rounded-xl border border-paper-200 bg-paper-50 font-mono text-sm focus:ring-2 focus:ring-paper-900 focus:border-transparent outline-none resize-none transition-all placeholder:text-gray-400"
                />
                
                <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative overflow-hidden group">
                        <input 
                            type="file" 
                            onChange={handleFileChange} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept=".txt,.md" 
                        />
                        <Button variant="secondary" size="md" className="w-full sm:w-auto flex items-center gap-2 group-hover:bg-paper-300">
                            <Upload size={18} />
                            <span>Upload .txt</span>
                        </Button>
                    </div>

                    <Button 
                        onClick={handleNext} 
                        disabled={text.length < 10}
                        size="lg"
                        className="w-full sm:w-auto flex items-center gap-2"
                    >
                        <span>Next</span>
                    </Button>
                </div>
            </div>
        ) : (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-paper-200 transition-all duration-300 space-y-6">
                <div>
                    <label className="block text-sm font-bold uppercase text-gray-500 tracking-wider mb-2">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Weekly Report, Chapter 1"
                        autoFocus
                        className="w-full p-4 rounded-xl border border-paper-200 bg-paper-50 text-lg font-serif focus:ring-2 focus:ring-paper-900 focus:border-transparent outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold uppercase text-gray-500 tracking-wider mb-2">Collection</label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {collections.map(col => (
                            <button
                                key={col.id}
                                onClick={() => handleCollectionChange(col.id)}
                                className={`p-3 rounded-lg text-left border ${selectedCollectionId === col.id ? 'border-paper-900 bg-paper-900 text-white' : 'border-paper-200 bg-paper-50 text-paper-900 hover:border-paper-400'}`}
                            >
                                {col.name}
                            </button>
                        ))}
                    </div>
                </div>

                {availableFolders.length > 0 && (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-bold uppercase text-gray-500 tracking-wider mb-2">Folder (Optional)</label>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                             <button
                                onClick={() => setSelectedFolderId('')}
                                className={`p-3 rounded-lg text-left border flex items-center gap-2 ${!selectedFolderId ? 'border-paper-900 bg-paper-100 text-paper-900' : 'border-paper-200 bg-white text-gray-500 hover:border-paper-400'}`}
                            >
                                <span className="text-xs font-bold uppercase">Root</span>
                            </button>
                            {availableFolders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => setSelectedFolderId(folder.id)}
                                    className={`p-3 rounded-lg text-left border flex items-center gap-2 ${selectedFolderId === folder.id ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600' : 'border-paper-200 bg-paper-50 text-paper-900 hover:border-paper-400'}`}
                                >
                                    <Folder size={14} className="shrink-0" />
                                    <span className="truncate">{folder.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                     <Button onClick={() => setStep(1)} variant="secondary" className="flex-1">Back</Button>
                     <Button 
                        onClick={handleFinish} 
                        disabled={!title}
                        variant="primary" 
                        className="flex-[2] flex items-center justify-center gap-2"
                    >
                        <Sparkles size={18} className="text-yellow-400" />
                        <span>Create & Read</span>
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
