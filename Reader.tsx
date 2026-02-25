import React, { useState, useEffect, useMemo } from 'react';
import { ReadingSettings, ThemeMode, FontFamily, Note } from '../types';
import { AISidebar } from './AISidebar';
import { FormattedText } from './FormattedText';
import { Menu, Type, ArrowLeft, Sun, Moon, Coffee, Sparkles, Pencil, Save, X } from 'lucide-react';
import { Button } from './Button';

interface ReaderProps {
  note: Note;
  onBack: () => void;
  onUpdateNote: (id: string, content: string, title: string) => void;
}

// Block Types for our Parser
type BlockType = 'h1' | 'h2' | 'h3' | 'p' | 'hr' | 'list-item' | 'table' | 'blockquote' | 'empty';

interface Block {
  type: BlockType;
  content: string | string[]; // Tables use array of strings
  metadata?: any; // For indentation levels etc
}

export const Reader: React.FC<ReaderProps> = ({ note, onBack, onUpdateNote }) => {
  const [settings, setSettings] = useState<ReadingSettings>({
    theme: ThemeMode.SEPIA,
    fontSize: 18,
    fontFamily: FontFamily.SERIF,
    lineHeight: 1.8,
  });

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');

  // Handle Text Selection
  useEffect(() => {
    const handleSelection = () => {
      if (isEditing) return; 
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        setSelectedText(selection.toString());
      }
    };
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [isEditing]);

  // Handle Scroll Progress
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setReadingProgress(Math.min(100, Math.max(0, progress)));
  };

  const getThemeClass = () => {
    switch (settings.theme) {
      case ThemeMode.DARK:
        return 'bg-paper-900 text-gray-300';
      case ThemeMode.SEPIA:
        return 'bg-[#f4ecd8] text-[#5b4636]';
      case ThemeMode.LIGHT:
      default:
        return 'bg-paper-50 text-paper-900';
    }
  };

  const handleStartEdit = () => {
    setEditContent(note.content);
    setEditTitle(note.title);
    setIsEditing(true);
    setSettingsOpen(false);
  };

  const handleSaveEdit = () => {
    onUpdateNote(note.id, editContent, editTitle);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
    setEditTitle('');
  };

  // --- PARSING LOGIC ---
  const blocks = useMemo(() => {
    const lines = note.content.split('\n');
    const parsedBlocks: Block[] = [];
    let currentTable: string[] = [];
    
    const flushTable = () => {
        if (currentTable.length > 0) {
            parsedBlocks.push({ type: 'table', content: [...currentTable] });
            currentTable = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]; // Preserve whitespace for now, trim later where needed
        const trimmed = line.trim();
        
        // 1. Table Detection
        if (trimmed.startsWith('|')) {
            currentTable.push(trimmed);
            continue;
        } else {
            flushTable();
        }

        if (!trimmed) {
            parsedBlocks.push({ type: 'empty', content: '' });
            continue;
        }

        // 2. Headings
        // H3
        const h3Match = line.match(/^###\s+(.*)/);
        if (h3Match) {
            parsedBlocks.push({ type: 'h3', content: h3Match[1] });
            continue;
        }

        // H2
        const h2Match = line.match(/^##\s+(.*)/);
        if (h2Match) {
            parsedBlocks.push({ type: 'h2', content: h2Match[1] });
            continue;
        }

        // H1
        const h1Match = line.match(/^#\s+(.*)/);
        if (h1Match) {
             parsedBlocks.push({ type: 'h1', content: h1Match[1] });
             continue;
        }

        // 3. HR
        if (/^[-=_]{3,}$/.test(trimmed)) {
            parsedBlocks.push({ type: 'hr', content: '' });
            continue;
        }

        // 4. Blockquotes
        if (trimmed.startsWith('>')) {
            parsedBlocks.push({ type: 'blockquote', content: trimmed.replace(/^>\s?/, '') });
            continue;
        }

        // 5. Lists (Unordered)
        const ulMatch = line.match(/^(\s*)([\*\-\+])\s+(.*)/);
        if (ulMatch) {
            parsedBlocks.push({ 
                type: 'list-item', 
                content: ulMatch[3], 
                metadata: { indent: Math.floor(ulMatch[1].length / 2), ordered: false } 
            });
            continue;
        }

        // 6. Lists (Ordered)
        const olMatch = line.match(/^(\s*)(\d+\.)\s+(.*)/);
        if (olMatch) {
            parsedBlocks.push({ 
                type: 'list-item', 
                content: olMatch[3], 
                metadata: { indent: Math.floor(olMatch[1].length / 2), ordered: true, number: olMatch[2] } 
            });
            continue;
        }

        // 7. Paragraph (default)
        parsedBlocks.push({ type: 'p', content: line });
    }
    flushTable(); // Final flush

    return parsedBlocks;
  }, [note.content]);

  // --- RENDERING LOGIC ---
  const renderBlockComponent = (block: Block, index: number) => {
    switch (block.type) {
        case 'empty':
            return <br key={index} className="h-4 block content-['']" />;
        
        case 'hr':
            return <hr key={index} className={`my-8 border-t-2 opacity-20 ${settings.theme === ThemeMode.DARK ? 'border-gray-500' : 'border-paper-900'}`} />;
        
        case 'h1':
            return (
                <h2 key={index} className={`text-2xl font-bold font-serif mt-12 mb-6 border-b pb-2 leading-tight ${settings.theme === ThemeMode.DARK ? 'border-gray-700 text-white' : 'border-paper-200 text-paper-900'}`}>
                    {block.content}
                </h2>
            );
        
        case 'h2':
            return (
                <h3 key={index} className={`text-xl font-bold font-serif mt-8 mb-4 flex items-baseline ${settings.theme === ThemeMode.DARK ? 'text-gray-100' : 'text-paper-800'}`}>
                   <span>{block.content}</span>
                </h3>
            );

        case 'h3':
            return (
                <h4 key={index} className={`text-lg font-bold font-serif mt-6 mb-3 ${settings.theme === ThemeMode.DARK ? 'text-gray-200' : 'text-paper-700'}`}>
                    {block.content}
                </h4>
            );

        case 'blockquote':
            return (
                <blockquote key={index} className={`border-l-4 pl-4 my-4 italic ${settings.theme === ThemeMode.DARK ? 'border-gray-600 text-gray-400' : 'border-paper-300 text-gray-600'}`}>
                     <FormattedText text={block.content as string} />
                </blockquote>
            );

        case 'list-item':
            const mlClass = block.metadata?.indent === 0 ? '' : block.metadata?.indent === 1 ? 'ml-6' : 'ml-12';
            return (
                <div key={index} className={`flex gap-3 mb-3 ${mlClass}`}>
                    {block.metadata?.ordered ? (
                        <span className={`flex-shrink-0 font-bold ${settings.theme === ThemeMode.DARK ? 'text-gray-400' : 'text-paper-700'}`}>
                            {block.metadata.number}
                        </span>
                    ) : (
                        <span className={`flex-shrink-0 mt-[0.6em] w-1.5 h-1.5 rounded-full ${settings.theme === ThemeMode.DARK ? 'bg-gray-400' : 'bg-paper-800'}`}></span>
                    )}
                    <div className="flex-1">
                        <FormattedText text={block.content as string} />
                    </div>
                </div>
            );

        case 'table':
            const rows = block.content as string[];
            if (rows.length === 0) return null;
            
            // Basic Markdown Table Parsing
            // 1. Filter out separator row (contains only - | : and spaces)
            const cleanedRows = rows.filter(r => !/^\|?[\s\-\:\.|]+\|?$/.test(r.trim()));
            // 2. Parse cells
            const tableData = cleanedRows.map(row => {
                // Remove outer pipes if they exist
                const content = row.trim().replace(/^\||\|$/g, '');
                return content.split('|').map(c => c.trim());
            });

            const header = tableData[0];
            const body = tableData.slice(1);

            return (
                <div key={index} className="my-8 overflow-x-auto rounded-lg border border-opacity-20 border-current shadow-sm">
                    <table className="min-w-full text-sm">
                        <thead className={`${settings.theme === ThemeMode.DARK ? 'bg-white/10' : 'bg-black/5'}`}>
                            <tr>
                                {header.map((cell, idx) => (
                                    <th key={idx} className="px-4 py-3 text-left font-bold border-b border-current border-opacity-10">
                                        <FormattedText text={cell} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {body.map((row, rIdx) => (
                                <tr 
                                    key={rIdx} 
                                    className={`border-b border-current border-opacity-5 last:border-0 ${
                                        rIdx % 2 !== 0 
                                          ? (settings.theme === ThemeMode.DARK ? 'bg-white/5' : 'bg-black/5') 
                                          : 'bg-transparent'
                                    }`}
                                >
                                    {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="px-4 py-3 align-top border-r border-current border-opacity-5 last:border-0">
                                            <FormattedText text={cell} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        case 'p':
        default:
            return (
                <p key={index} className="mb-4 text-justify leading-relaxed">
                    <FormattedText text={block.content as string} />
                </p>
            );
    }
  };

  return (
    <div className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-500 ${getThemeClass()}`}>
      
      {/* Top Navigation Bar */}
      <div className={`h-14 px-4 flex items-center justify-between border-b transition-colors z-20 ${
          settings.theme === ThemeMode.DARK ? 'border-gray-800 bg-paper-900' : 'border-paper-200 bg-white/50 backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-2 max-w-[50%] flex-1">
            <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
                <ArrowLeft size={18} />
                <span className="ml-2 hidden sm:inline">Back</span>
            </Button>
            <div className="h-4 w-px bg-current opacity-20 mx-2 shrink-0"></div>
            
            {/* Title: Editable or Read-only */}
            {isEditing ? (
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Note Title"
                    className={`bg-transparent border-b-2 border-dashed w-full max-w-sm px-1 py-0.5 text-sm font-bold focus:outline-none ${
                         settings.theme === ThemeMode.DARK 
                            ? 'border-gray-600 focus:border-white text-white' 
                            : 'border-paper-300 focus:border-paper-900 text-paper-900'
                    }`}
                />
            ) : (
                <h1 className="text-sm font-bold truncate opacity-80">{note.title}</h1>
            )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
             {!isEditing && (
                <div className="hidden md:flex items-center gap-2 mr-4 text-xs font-mono opacity-50">
                    {Math.round(readingProgress)}% Read
                </div>
             )}
             
             {isEditing ? (
                 <>
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-red-500 hover:text-red-600">
                        <X size={18} className="mr-1" /> <span className="hidden sm:inline">Cancel</span>
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSaveEdit} className="flex items-center gap-1">
                        <Save size={16} /> <span className="hidden sm:inline">Save</span>
                    </Button>
                 </>
             ) : (
                 <>
                     <Button variant="ghost" size="sm" onClick={handleStartEdit} title="Edit Note">
                        <Pencil className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                     </Button>

                     {/* Font Settings Toggle */}
                     <div className="relative">
                        <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(!isSettingsOpen)}>
                            <Type size={18} />
                        </Button>
                        
                        {isSettingsOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-paper-200 p-4 z-50 animate-fade-in text-paper-900">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Theme</label>
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => setSettings(s => ({...s, theme: ThemeMode.LIGHT}))} className="flex-1 p-2 rounded border bg-paper-50 border-gray-200 hover:border-paper-900"><Sun size={16} className="mx-auto"/></button>
                                            <button onClick={() => setSettings(s => ({...s, theme: ThemeMode.SEPIA}))} className="flex-1 p-2 rounded border bg-[#f4ecd8] border-[#eaddc5] text-[#5b4636] hover:border-[#5b4636]"><Coffee size={16} className="mx-auto"/></button>
                                            <button onClick={() => setSettings(s => ({...s, theme: ThemeMode.DARK}))} className="flex-1 p-2 rounded border bg-paper-900 border-gray-700 text-white hover:border-white"><Moon size={16} className="mx-auto"/></button>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Size</label>
                                        <div className="flex items-center gap-3 mt-2">
                                            <button onClick={() => setSettings(s => ({...s, fontSize: Math.max(12, s.fontSize - 2)}))} className="p-1 hover:bg-gray-100 rounded text-sm">A-</button>
                                            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-paper-900" style={{ width: `${(settings.fontSize - 12) / 20 * 100}%`}}></div>
                                            </div>
                                            <button onClick={() => setSettings(s => ({...s, fontSize: Math.min(48, s.fontSize + 2)}))} className="p-1 hover:bg-gray-100 rounded text-lg">A+</button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Font</label>
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                             <button onClick={() => setSettings(s => ({...s, fontFamily: FontFamily.SERIF}))} className={`text-sm py-1 border rounded ${settings.fontFamily === FontFamily.SERIF ? 'border-paper-900 bg-gray-50' : 'border-transparent'}`}>Serif</button>
                                             <button onClick={() => setSettings(s => ({...s, fontFamily: FontFamily.SANS}))} className={`text-sm py-1 border rounded font-sans ${settings.fontFamily === FontFamily.SANS ? 'border-paper-900 bg-gray-50' : 'border-transparent'}`}>Sans</button>
                                             <button onClick={() => setSettings(s => ({...s, fontFamily: FontFamily.MONO}))} className={`text-sm py-1 border rounded font-mono ${settings.fontFamily === FontFamily.MONO ? 'border-paper-900 bg-gray-50' : 'border-transparent'}`}>Mono</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                     </div>

                     <Button variant={isSidebarOpen ? 'primary' : 'ghost'} size="sm" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                        <Menu size={18} />
                     </Button>
                 </>
             )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative scroll-smooth" onScroll={handleScroll}>
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-20 transition-all duration-300 h-full">
            {isEditing ? (
                <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className={`w-full h-full min-h-[50vh] p-4 bg-transparent outline-none font-mono text-sm resize-none ${
                        settings.theme === ThemeMode.DARK ? 'text-gray-300' : 'text-paper-900'
                    }`}
                    placeholder="Type your note content here..."
                />
            ) : (
                <>
                    {/* The Text */}
                    <article 
                        className={`prose max-w-none transition-all duration-300 outline-none selection:bg-yellow-200 selection:text-black
                            ${settings.fontFamily}
                            ${settings.theme === ThemeMode.DARK ? 'prose-invert' : ''}
                        `}
                        style={{ 
                            fontSize: `${settings.fontSize}px`,
                            lineHeight: settings.lineHeight
                        }}
                    >
                        {blocks.map((block, index) => renderBlockComponent(block, index))}
                    </article>
                    
                    <div className="h-32 flex flex-col items-center justify-center text-center opacity-50 space-y-2 mt-20">
                        <div className="w-16 h-1 bg-current opacity-20 rounded-full"></div>
                        <p className="text-sm font-serif italic">End of document</p>
                    </div>
                </>
            )}
        </div>
      </div>

      {/* Progress Bar (Sticky Bottom) */}
      {!isEditing && (
          <div className="h-1 bg-transparent w-full fixed bottom-0 left-0 z-40">
            <div 
                className="h-full bg-yellow-500 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(234,179,8,0.5)]" 
                style={{ width: `${readingProgress}%` }}
            />
          </div>
      )}

      {/* Sidebar */}
      <AISidebar 
        documentText={note.content} 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        selectedText={selectedText}
      />

    </div>
  );
};