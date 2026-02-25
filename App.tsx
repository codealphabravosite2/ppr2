import React, { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { Reader } from './components/Reader';
import { Dashboard } from './components/Dashboard';
import { CollectionView } from './components/CollectionView';
import { Toast, ToastProps } from './components/Toast';
import { AppState, Collection, Note, Folder } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD);
  const [toast, setToast] = useState<{ message: string; type: ToastProps['type'] } | null>(null);
  
  // Data State with LocalStorage Initialization
  const [collections, setCollections] = useState<Collection[]>(() => {
    try {
      const saved = localStorage.getItem('lexicon_collections');
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'General', color: 'bg-stone-100', noteCount: 0 },
        { id: '2', name: 'Work Documents', color: 'bg-amber-100', noteCount: 0 },
      ];
    } catch (e) {
      console.error("Failed to load collections", e);
      return [
        { id: '1', name: 'General', color: 'bg-stone-100', noteCount: 0 },
        { id: '2', name: 'Work Documents', color: 'bg-amber-100', noteCount: 0 },
      ];
    }
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem('lexicon_folders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load folders", e);
      return [];
    }
  });
  
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('lexicon_notes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load notes", e);
      return [];
    }
  });

  // Navigation State
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('lexicon_collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem('lexicon_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('lexicon_notes', JSON.stringify(notes));
  }, [notes]);

  // Helper for Toasts
  const showToast = (message: string, type: ToastProps['type'] = 'success') => {
    setToast({ message, type });
  };

  // Actions
  const handleCreateCollection = (name: string) => {
    const newCol: Collection = {
      id: Date.now().toString(),
      name,
      color: 'bg-paper-100',
      noteCount: 0
    };
    setCollections(prev => [...prev, newCol]);
    showToast(`Collection "${name}" created`);
  };

  const handleCreateFolder = (name: string, collectionId: string) => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      collectionId,
      createdAt: Date.now()
    };
    setFolders(prev => [...prev, newFolder]);
    showToast(`Folder "${name}" created`);
  };

  const handleUpdateFolder = (id: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    showToast('Folder renamed');
  };

  const handleDeleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
    setFolders(prev => prev.filter(f => f.collectionId !== id));
    setNotes(prev => prev.filter(n => n.collectionId !== id));
    showToast('Collection deleted', 'success');
  };

  const handleDeleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    // Move notes in this folder to the root of the collection? Or delete them?
    // For safety, let's move them to root (remove folderId).
    setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: undefined } : n));
    showToast('Folder deleted, notes moved to collection root', 'success');
  };

  const handleCreateNote = (title: string, content: string, collectionId: string, folderId?: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      collectionId,
      folderId,
      createdAt: Date.now()
    };
    
    setNotes(prev => [...prev, newNote]);
    setCollections(prev => prev.map(c => 
      c.id === collectionId ? { ...c, noteCount: c.noteCount + 1 } : c
    ));

    setActiveNoteId(newNote.id);
    setAppState(AppState.READING);
    showToast('Note created successfully');
  };

  const handleUpdateNote = (id: string, content: string, title: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content, title } : n));
  };

  const handleDeleteNote = (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (noteToDelete) {
        setNotes(prev => prev.filter(n => n.id !== id));
        setCollections(prev => prev.map(c => 
            c.id === noteToDelete.collectionId ? { ...c, noteCount: Math.max(0, c.noteCount - 1) } : c
        ));
        showToast('Note moved to trash');
    }
  };

  // Data Export/Import Logic
  const handleExportData = () => {
    try {
      const backup = {
        version: 2,
        timestamp: Date.now(),
        collections,
        folders,
        notes
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lexicon_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Library exported successfully');
    } catch (e) {
      console.error(e);
      showToast('Export failed', 'error');
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Basic validation
        if (!parsed || typeof parsed !== 'object') throw new Error("Invalid JSON");
        
        const newCols = Array.isArray(parsed.collections) ? parsed.collections : [];
        const newFolders = Array.isArray(parsed.folders) ? parsed.folders : [];
        const newNotes = Array.isArray(parsed.notes) ? parsed.notes : [];

        if (newCols.length === 0 && newNotes.length === 0 && newFolders.length === 0) {
            throw new Error("No data found in backup");
        }

        // Merge Logic: Overwrite matches by ID, add new ones
        const mergedCollections = [...collections];
        newCols.forEach((newItem: Collection) => {
            const idx = mergedCollections.findIndex(c => c.id === newItem.id);
            if (idx >= 0) mergedCollections[idx] = newItem;
            else mergedCollections.push(newItem);
        });

        const mergedFolders = [...folders];
        newFolders.forEach((newItem: Folder) => {
            const idx = mergedFolders.findIndex(f => f.id === newItem.id);
            if (idx >= 0) mergedFolders[idx] = newItem;
            else mergedFolders.push(newItem);
        });

        const mergedNotes = [...notes];
        newNotes.forEach((newItem: Note) => {
            const idx = mergedNotes.findIndex(n => n.id === newItem.id);
            if (idx >= 0) mergedNotes[idx] = newItem;
            else mergedNotes.push(newItem);
        });

        setCollections(mergedCollections);
        setFolders(mergedFolders);
        setNotes(mergedNotes);
        showToast(`Imported ${newNotes.length} notes, ${newFolders.length} folders, and ${newCols.length} collections`);
      } catch (err) {
        console.error(err);
        showToast('Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
    // Reset inputs
    e.target.value = '';
  };

  // Navigation Handlers
  const goToDashboard = () => {
    setAppState(AppState.DASHBOARD);
    setActiveCollectionId(null);
    setActiveFolderId(null);
    setActiveNoteId(null);
  };

  const goToCollection = (id: string) => {
    setActiveCollectionId(id);
    setActiveFolderId(null); // Reset folder when entering collection from dashboard
    setAppState(AppState.COLLECTION_VIEW);
  };

  const goToCreateNote = () => {
    setAppState(AppState.CREATE_NOTE);
  };

  const goToReader = (note: Note) => {
    setActiveNoteId(note.id);
    setAppState(AppState.READING);
  };

  const activeCollection = collections.find(c => c.id === activeCollectionId);
  const activeNote = notes.find(n => n.id === activeNoteId);
  
  // Filter data for CollectionView
  const currentCollectionNotes = notes.filter(n => n.collectionId === activeCollectionId);
  const currentCollectionFolders = folders.filter(f => f.collectionId === activeCollectionId);

  return (
    <div className="min-h-screen transition-all duration-300 relative">
      
      {appState === AppState.DASHBOARD && (
        <Dashboard 
          collections={collections} 
          onSelectCollection={goToCollection} 
          onCreateCollection={handleCreateCollection}
          onDeleteCollection={handleDeleteCollection}
          onNewNote={goToCreateNote}
          onExport={handleExportData}
          onImport={handleImportData}
        />
      )}

      {appState === AppState.COLLECTION_VIEW && activeCollection && (
        <CollectionView 
          collection={activeCollection}
          folders={currentCollectionFolders}
          notes={currentCollectionNotes}
          activeFolderId={activeFolderId}
          onBack={goToDashboard}
          onSelectNote={goToReader}
          onNewNote={goToCreateNote}
          onDeleteNote={handleDeleteNote}
          onCreateFolder={handleCreateFolder}
          onUpdateFolder={handleUpdateFolder}
          onDeleteFolder={handleDeleteFolder}
          onEnterFolder={setActiveFolderId}
          onExitFolder={() => setActiveFolderId(null)}
        />
      )}

      {appState === AppState.CREATE_NOTE && (
        <Landing 
          collections={collections}
          folders={folders}
          preSelectedCollectionId={activeCollectionId || undefined}
          preSelectedFolderId={activeFolderId || undefined}
          onCancel={() => activeCollectionId ? setAppState(AppState.COLLECTION_VIEW) : setAppState(AppState.DASHBOARD)}
          onCreateNote={handleCreateNote}
        />
      )}

      {appState === AppState.READING && activeNote && (
        <Reader 
          note={activeNote} 
          onBack={() => activeCollectionId ? setAppState(AppState.COLLECTION_VIEW) : setAppState(AppState.DASHBOARD)} 
          onUpdateNote={handleUpdateNote}
        />
      )}

      {toast && (
        <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default App;