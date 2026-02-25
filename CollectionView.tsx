import React, { useState } from 'react';
import { Collection, Note, Folder as FolderType } from '../types';
import { Button } from './Button';
import { ArrowLeft, FileText, Plus, Trash2, AlertCircle, Clock, Folder, ChevronRight, FolderPlus, Pencil, Check, X } from 'lucide-react';

interface CollectionViewProps {
  collection: Collection;
  folders: FolderType[];
  notes: Note[];
  activeFolderId: string | null;
  onBack: () => void;
  onSelectNote: (note: Note) => void;
  onNewNote: () => void;
  onDeleteNote: (id: string) => void;
  onCreateFolder: (name: string, collectionId: string) => void;
  onUpdateFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onEnterFolder: (id: string) => void;
  onExitFolder: () => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({
  collection,
  folders,
  notes,
  activeFolderId,
  onBack,
  onSelectNote,
  onNewNote,
  onDeleteNote,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onEnterFolder,
  onExitFolder
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Editing Folder State
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  const currentFolder = activeFolderId ? folders.find(f => f.id === activeFolderId) : null;

  // Filter content based on current view (Root vs Folder)
  const visibleFolders = activeFolderId 
    ? [] // No nested folders inside folders for now (1 level depth)
    : [...folders].sort((a, b) => a.name.localeCompare(b.name));

  const visibleNotes = notes
    .filter(n => activeFolderId ? n.folderId === activeFolderId : !n.folderId)
    .sort((a, b) => a.title.localeCompare(b.title));

  const handleDeleteClick = (e: React.MouseEvent, id: string, type: 'note' | 'folder') => {
    e.stopPropagation();
    if (deleteConfirmId === id) {
      if (type === 'note') onDeleteNote(id);
      else onDeleteFolder(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(prev => prev === id ? null : prev), 3000);
    }
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName, collection.id);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleStartEdit = (e: React.MouseEvent, folder: FolderType) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditFolderName(folder.name);
    // Reset any delete confirmation
    setDeleteConfirmId(null);
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editFolderName.trim() && editingFolderId) {
        onUpdateFolder(editingFolderId, editFolderName);
        setEditingFolderId(null);
        setEditFolderName('');
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(null);
    setEditFolderName('');
  };

  const handleBack = () => {
    if (activeFolderId) {
      onExitFolder();
    } else {
      onBack();
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-paper-50 custom-scrollbar">
      <div className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
        <header className="mb-10">
          <Button variant="ghost" onClick={handleBack} className="mb-6 pl-0 hover:bg-transparent hover:text-paper-600 group text-gray-500">
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
            {activeFolderId ? `Back to ${collection.name}` : 'Back to Library'}
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-paper-200 pb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                 <span className="h-6 w-1 bg-paper-900 rounded-full"></span>
                 <div className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    Collection 
                    {currentFolder && (
                        <>
                            <ChevronRight size={12} />
                            Folder
                        </>
                    )}
                 </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-paper-900 flex items-center gap-3">
                 {currentFolder ? (
                     <>
                        <span className="opacity-50 font-normal text-3xl">{collection.name} /</span>
                        {currentFolder.name}
                     </>
                 ) : (
                     collection.name
                 )}
              </h1>
              <p className="text-gray-500 mt-3 font-medium flex items-center gap-2">
                <span className="bg-paper-200 px-2 py-0.5 rounded text-paper-900 text-xs">{visibleNotes.length}</span>
                {visibleNotes.length === 1 ? 'Note' : 'Notes'}
                {!activeFolderId && visibleFolders.length > 0 && (
                    <>
                        <span className="w-1 h-1 bg-gray-400 rounded-full mx-1"></span>
                        <span className="bg-paper-200 px-2 py-0.5 rounded text-paper-900 text-xs">{visibleFolders.length}</span>
                        {visibleFolders.length === 1 ? 'Folder' : 'Folders'}
                    </>
                )}
              </p>
            </div>
            
            <div className="flex gap-2">
                {!activeFolderId && !isCreatingFolder && (
                     <Button onClick={() => setIsCreatingFolder(true)} variant="secondary" className="flex items-center gap-2">
                        <FolderPlus size={18} /> New Folder
                    </Button>
                )}
                <Button onClick={onNewNote} variant="primary" className="flex items-center gap-2 shadow-lg shadow-paper-900/10">
                    <Plus size={18} /> Add Note
                </Button>
            </div>
          </div>
        </header>

        {/* Create Folder Form */}
        {isCreatingFolder && (
            <form onSubmit={handleCreateFolderSubmit} className="mb-8 p-6 bg-white rounded-2xl border border-paper-200 shadow-sm animate-fade-in">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2 block">Folder Name</label>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        autoFocus
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        className="w-full sm:flex-1 bg-paper-50 border border-paper-200 rounded-lg px-4 py-2 font-serif focus:outline-none focus:border-paper-900 transition-colors"
                        placeholder="e.g. Chapter 1, Assignments..."
                    />
                    <div className="flex gap-2 justify-end sm:justify-start">
                        <Button type="button" variant="ghost" onClick={() => setIsCreatingFolder(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Create</Button>
                    </div>
                </div>
            </form>
        )}

        {visibleFolders.length === 0 && visibleNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-white rounded-3xl border border-paper-200 border-dashed text-center animate-fade-in">
            <div className="w-20 h-20 bg-paper-50 rounded-full flex items-center justify-center mb-6 text-paper-300">
              <FileText size={40} />
            </div>
            <h3 className="text-2xl font-serif font-bold text-paper-900 mb-2">Empty {activeFolderId ? 'Folder' : 'Collection'}</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">This space is waiting for your thoughts.</p>
            <div className="flex gap-3">
                 {!activeFolderId && (
                     <Button onClick={() => setIsCreatingFolder(true)} variant="secondary">Create Folder</Button>
                 )}
                 <Button onClick={onNewNote} variant="primary">Create Note</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Folders Section */}
            {visibleFolders.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleFolders.map(folder => (
                        <div 
                            key={folder.id}
                            onClick={() => !editingFolderId && onEnterFolder(folder.id)}
                            className="group relative bg-white hover:bg-paper-50 border border-paper-200 hover:border-paper-300 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all hover:shadow-md h-20"
                        >
                            <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                                <div className="bg-amber-50 text-amber-600 p-2 rounded-lg shrink-0">
                                    <Folder size={20} />
                                </div>
                                
                                {editingFolderId === folder.id ? (
                                    <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editFolderName}
                                            onChange={(e) => setEditFolderName(e.target.value)}
                                            className="w-full bg-paper-50 border-b border-paper-900 focus:outline-none font-serif font-bold text-lg text-paper-900 px-1 py-0.5"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit(e as any);
                                                if (e.key === 'Escape') handleCancelEdit(e as any);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <span className="font-serif font-bold text-lg text-paper-900 truncate">{folder.name}</span>
                                )}
                            </div>
                            
                            {editingFolderId === folder.id ? (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleSaveEdit}
                                        className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                        title="Save Name"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                        title="Cancel Edit"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleStartEdit(e, folder)}
                                        className="p-2 rounded-lg text-gray-300 hover:bg-paper-100 hover:text-paper-900 transition-colors"
                                        title="Rename Folder"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteClick(e, folder.id, 'folder')}
                                        className={`p-2 rounded-lg transition-all duration-200 ${
                                            deleteConfirmId === folder.id 
                                                ? 'bg-red-500 text-white shadow-md' 
                                                : 'text-gray-300 hover:bg-red-50 hover:text-red-500'
                                        }`}
                                        title="Delete Folder"
                                    >
                                        {deleteConfirmId === folder.id ? <AlertCircle size={16} /> : <Trash2 size={16} />}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Notes Section */}
            {visibleNotes.length > 0 && (
                <div className="space-y-3">
                     {visibleFolders.length > 0 && (
                         <div className="text-xs font-bold uppercase text-gray-400 tracking-wider mt-6 mb-2">Notes</div>
                     )}
                    {visibleNotes.map((note) => (
                    <div
                        key={note.id}
                        onClick={() => onSelectNote(note)}
                        className="group relative w-full bg-white hover:bg-paper-50 border border-paper-200 hover:border-paper-300 rounded-2xl p-5 md:p-6 text-left transition-all cursor-pointer hover:shadow-lg hover:shadow-paper-900/5 hover:-translate-y-0.5"
                    >
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="flex-1 pr-12">
                                <h3 className="font-serif font-bold text-xl text-paper-900 group-hover:text-blue-900 mb-2 transition-colors">{note.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 font-serif opacity-70 leading-relaxed max-w-2xl">
                                    {note.content.substring(0, 200).replace(/\n/g, ' ')}...
                                </p>
                            </div>

                            <div className="flex items-center gap-6 text-xs text-gray-400 font-mono w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-paper-100 pt-3 md:pt-0 mt-2 md:mt-0">
                                <div className="flex items-center gap-1.5 bg-paper-50 px-2 py-1 rounded">
                                    <Clock size={12} />
                                    {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="absolute top-4 right-4 md:top-1/2 md:-translate-y-1/2 flex items-center gap-2">
                            <button
                                onClick={(e) => handleDeleteClick(e, note.id, 'note')}
                                className={`p-2 rounded-full transition-all duration-200 ${
                                    deleteConfirmId === note.id 
                                        ? 'bg-red-500 text-white shadow-md' 
                                        : 'bg-transparent text-gray-300 hover:bg-red-50 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100'
                                }`}
                                title="Delete Note"
                            >
                                {deleteConfirmId === note.id ? <AlertCircle size={16} /> : <Trash2 size={16} />}
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};