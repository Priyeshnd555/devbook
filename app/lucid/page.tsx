"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Lightbulb, Lock, Trash2, X, Link as LinkIcon, Unlink, FolderPlus, ChevronRight } from 'lucide-react';

/**
 * LUCID - Compact Notepad Edition
 * Reduced card footprint to accommodate more items on screen.
 * Padding and width optimized for density.
 */

const STORAGE_KEY = 'lucid_web_v12';

interface LucidFolder {
  id: string;
  name: string;
}

interface LucidCard {
  id: string;
  folderId: string;
  content: string;
  x: number;
  y: number;
  createdAt: number;
}

interface LucidConnection {
  id: string;
  from: string;
  to: string;
}

interface LucidCommitments {
  [folderId: string]: string;
}

interface DragData {
  id: string | null;
  startX: number;
  startY: number;
  cardX: number;
  cardY: number;
  currentX: number;
  currentY: number;
  lastX: number;
}

export default function LucidPage() {
  const [folders, setFolders] = useState<LucidFolder[]>([{ id: 'default', name: 'General Chaos' }]);
  const [activeFolderId, setActiveFolderId] = useState<string>('default');
  const [cards, setCards] = useState<LucidCard[]>([]);
  const [connections, setConnections] = useState<LucidConnection[]>([]);
  const [commitments, setCommitments] = useState<LucidCommitments>({});

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [linkingFromId, setLinkingFromId] = useState<string | null>(null);
  const [proximityTargetId, setProximityTargetId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  const dragData = useRef<DragData>({
    id: null, startX: 0, startY: 0, cardX: 0, cardY: 0, currentX: 0, currentY: 0, lastX: 0
  });

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const requestRef = useRef<number | null>(null);

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setCards(parsed.cards || []);
      setConnections(parsed.connections || []);
      setFolders(parsed.folders || [{ id: 'default', name: 'General Chaos' }]);
      setCommitments(parsed.commitments || {});
      setActiveFolderId(parsed.activeFolderId || 'default');
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        cards, connections, folders, commitments, activeFolderId
      }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [cards, connections, folders, commitments, activeFolderId]);

  // --- Animation Loop ---
  const animate = () => {
    if (dragData.current.id) {
      const el = cardRefs.current[dragData.current.id];
      if (el) {
        const tilt = Math.min(Math.max((dragData.current.currentX - dragData.current.lastX) * 0.6, -12), 12);
        el.style.transform = `translate3d(${dragData.current.currentX}px, ${dragData.current.currentY}px, 0) rotate(${tilt}deg) scale(1.02)`;
        dragData.current.lastX = dragData.current.currentX;
      }
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const createConnection = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setConnections(prev => [...prev, { id: crypto.randomUUID(), from: fromId, to: toId }]);
  };

  const folderCards = useMemo(() => cards.filter(c => (c.folderId || 'default') === activeFolderId), [cards, activeFolderId]);

  const handleMouseDown = (e: React.MouseEvent | MouseEvent, card: LucidCard) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
    if (linkingFromId) return;

    dragData.current = {
      id: card.id, startX: e.clientX, startY: e.clientY,
      cardX: card.x, cardY: card.y, currentX: card.x, currentY: card.y,
      lastX: card.x
    };

    setDraggedCardId(card.id);
    requestRef.current = requestAnimationFrame(animate);
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!dragData.current.id) return;

    const deltaX = e.clientX - dragData.current.startX;
    const deltaY = e.clientY - dragData.current.startY;

    dragData.current.currentX = dragData.current.cardX + deltaX;
    dragData.current.currentY = dragData.current.cardY + deltaY;

    setDragPosition({ x: dragData.current.currentX, y: dragData.current.currentY });

    const target = folderCards.find(c =>
      c.id !== dragData.current.id &&
      Math.abs(c.x - dragData.current.currentX) < 180 &&
      Math.abs(c.y - dragData.current.currentY) < 180
    );

    if (target?.id !== proximityTargetId) {
      setProximityTargetId(target ? target.id : null);
    }
  };

  const handleGlobalMouseUp = () => {
    if (!dragData.current.id) return;
    const finalX = dragData.current.currentX;
    const finalY = dragData.current.currentY;
    const finishedId = dragData.current.id;
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
    }

    setCards(prev => prev.map(c => c.id === finishedId ? { ...c, x: finalX, y: finalY } : c));
    setDragPosition({ x: 0, y: 0 });

    if (proximityTargetId) {
      createConnection(finishedId, proximityTargetId);
    }

    dragData.current.id = null;
    setDraggedCardId(null);
    setProximityTargetId(null);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [proximityTargetId, folderCards]);

  const folderConnections = useMemo(() => {
    const cardIds = new Set(folderCards.map(c => c.id));
    return connections.filter(conn => cardIds.has(conn.from) && cardIds.has(conn.to));
  }, [connections, folderCards]);

  const activeCommitment = useMemo(() => cards.find(c => c.id === commitments[activeFolderId]), [cards, commitments, activeFolderId]);

  const addCard = (content = "") => {
    const padding = 100;
    const randomX = padding + Math.random() * (window.innerWidth - padding * 2 - 220);
    const randomY = padding + Math.random() * (window.innerHeight - padding * 2 - 150);

    const newCard: LucidCard = {
      id: crypto.randomUUID(),
      folderId: activeFolderId,
      content,
      x: randomX,
      y: randomY,
      createdAt: Date.now()
    };
    setCards(prev => [...prev, newCard]);
  };

  const updateCardContent = (id: string, content: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, content } : c));
  };

  const deleteCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    setConnections(prev => prev.filter(conn => conn.from !== id && conn.to !== id));
  };

  const unlinkCard = (id: string) => {
    setConnections(prev => prev.filter(conn => conn.from !== id && conn.to !== id));
  };


  return (
    <div className="fixed inset-0 bg-[#f9f8f6] flex overflow-hidden font-sans select-none text-stone-900">

      {/* --- SIDEBAR --- */}
      <aside className={`bg-white border-r border-stone-200/60 transition-all duration-300 flex flex-col z-50 ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`}>
        <div className="p-8 flex items-center justify-between flex-shrink-0">
          <h1 className="font-black tracking-tighter text-stone-900 text-xl italic uppercase">Lucid</h1>
          <button onClick={() => setFolders(f => [...f, { id: crypto.randomUUID(), name: 'New Stack' }])} className="p-2 hover:bg-stone-100 rounded-full transition-all text-stone-400">
            <FolderPlus size={18} />
          </button>
        </div>
        <div className="px-4 space-y-1 overflow-y-auto max-h-[30%] flex-shrink-0">
          {folders.map(f => (
            <button key={f.id} onClick={() => setActiveFolderId(f.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all text-sm ${activeFolderId === f.id ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-600'}`}>
              <span className="truncate">{f.name}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="space-y-6">
            {[...folderCards].sort((a, b) => a.createdAt - b.createdAt).map((card, idx) => (
              <div key={card.id} className="opacity-40 hover:opacity-100 transition-opacity">
                <p className="text-[10px] font-black text-stone-300 uppercase mb-2">Note {idx + 1}</p>
                <p className="text-xs font-medium text-stone-800 line-clamp-2 leading-relaxed">{card.content || "Untitled"}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* --- CANVAS --- */}
      <main className={`flex-1 relative overflow-hidden transition-colors duration-500 ${linkingFromId ? 'bg-stone-200/30' : ''}`}>

        {linkingFromId && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[70] bg-stone-900 text-white px-6 py-3 rounded-full font-bold text-sm shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
            Connecting...
            <button onClick={() => setLinkingFromId(null)} className="opacity-50 hover:opacity-100"><X size={16} /></button>
          </div>
        )}

        <div className="absolute top-8 right-8 z-[60]">
          <button onClick={() => addCard("")}
            className="bg-stone-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all">
            <Plus size={24} />
          </button>
        </div>

        {/* --- CONNECTIONS --- */}
        <svg className="absolute inset-0 pointer-events-none z-0 w-full h-full overflow-visible">
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#a8a29e" />
            </marker>
          </defs>
          {folderConnections.map(conn => {
            const from = cards.find(c => c.id === conn.from);
            const to = cards.find(c => c.id === conn.to);
            if (!from || !to) return null;

            const x1 = (draggedCardId === from.id ? dragPosition.x : from.x) + 110;
            const y1 = (draggedCardId === from.id ? dragPosition.y : from.y) + 30;
            const x2 = (draggedCardId === to.id ? dragPosition.x : to.x) + 110;
            const y2 = (draggedCardId === to.id ? dragPosition.y : to.y) + 30;

            return (
              <g key={conn.id} className="group pointer-events-auto">
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d6d3d1" strokeWidth="1.5" markerEnd="url(#arrowhead)" className="opacity-60 group-hover:opacity-100 transition-opacity" />
                <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r="12" fill="white" stroke="#d6d3d1" className="opacity-0 group-hover:opacity-100 cursor-pointer shadow-sm transition-all" onClick={() => setConnections(prev => prev.filter(c => c.id !== conn.id))} />
                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 4} textAnchor="middle" className="pointer-events-none opacity-0 group-hover:opacity-100 fill-stone-400 font-bold text-[10px]">×</text>
              </g>
            );
          })}
        </svg>

        {/* --- CARDS --- */}
        <div className="w-full h-full relative">
          {folderCards.map(card => {
            const isSource = linkingFromId === card.id;
            const isTarget = proximityTargetId === card.id;
            const connCount = connections.filter(cn => cn.from === card.id || cn.to === card.id).length;

            return (
              <div key={card.id}
                ref={el => { cardRefs.current[card.id] = el }}
                onMouseDown={(e) => handleMouseDown(e, card)}
                onClick={() => linkingFromId && linkingFromId !== card.id && (createConnection(linkingFromId, card.id), setLinkingFromId(null))}
                className={`absolute p-5 w-[220px] bg-white border border-stone-200/40 flex flex-col group
                    ${draggedCardId === card.id ? 'z-50 shadow-[30px_30px_60px_-10px_rgba(0,0,0,0.08)]' : 'z-10 shadow-[10px_10px_20px_-5px_rgba(0,0,0,0.03)] hover:shadow-[15px_15px_30px_-5px_rgba(0,0,0,0.05)]'}
                    ${isSource || isTarget ? 'border-stone-400 z-40 scale-[1.02]' : ''}
                   `}
                style={{
                  left: 0, top: 0,
                  transform: `translate3d(${card.x}px, ${card.y}px, 0)`,
                  cursor: linkingFromId ? 'crosshair' : (draggedCardId === card.id ? 'grabbing' : 'grab'),
                  transition: draggedCardId === card.id ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), shadow 0.3s'
                }}>

                {/* Minimal Header */}
                <div className="flex justify-between items-center mb-2 h-4 pointer-events-none">
                  <div className="text-[9px] font-bold text-stone-300 tracking-wider">
                    {connCount > 0 && `${connCount} LINK${connCount > 1 ? 'S' : ''}`}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                    {connCount > 0 && (
                      <button onClick={(e) => { e.stopPropagation(); unlinkCard(card.id); }} className="text-stone-300 hover:text-red-400 transition-colors" title="Unlink Card">
                        <Unlink size={12} />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setLinkingFromId(card.id); }} className="text-stone-300 hover:text-stone-900 transition-colors" title="Link Card">
                      <LinkIcon size={12} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }} className="text-stone-200 hover:text-red-400 transition-colors" title="Delete Card">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Pure Writing Surface */}
                <div className="relative cursor-text">
                  <textarea className="w-full bg-transparent resize-none border-none outline-none ring-0 focus:ring-0 focus:outline-none p-0 text-stone-800 font-serif italic text-lg placeholder:text-stone-200 leading-relaxed cursor-text overflow-hidden appearance-none shadow-none"
                    style={{ boxShadow: 'none' }}
                    value={card.content}
                    onChange={(e) => {
                      updateCardContent(card.id, e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onFocus={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                    autoFocus={card.content === ""}
                    spellCheck={false}
                    rows={1} placeholder="Write something..." />
                </div>
              </div>
            );
          })}
        </div>

        {/* --- DOCK --- */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-6">
          <div className="bg-white border border-stone-200/60 shadow-[20px_20px_60px_-10px_rgba(0,0,0,0.1)] rounded-[32px] p-6 flex items-center gap-6">
            {activeCommitment ? (
              <div className="flex-1 flex items-center gap-6 animate-in slide-in-from-bottom-2">
                <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <Lock size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Final Goal</p>
                  <p className="text-stone-900 font-bold text-xl truncate tracking-tight italic font-serif">{activeCommitment.content}</p>
                </div>
                <button onClick={() => {
                  setCommitments(prev => {
                    const next = { ...prev };
                    delete next[activeFolderId];
                    return next;
                  });
                }} className="p-4 text-stone-300 hover:text-red-500 transition-all"><X size={20} /></button>
              </div>
            ) : (
              <form className="flex-1 flex items-center gap-6" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const goalInput = form.elements.namedItem('goal') as HTMLInputElement;
                const val = goalInput.value;
                if (!val) return;
                const newId = crypto.randomUUID();
                // Spawn the goal-related card with the same random logic
                const padding = 100;
                const randomX = padding + Math.random() * (window.innerWidth - padding * 2 - 220);
                const randomY = padding + Math.random() * (window.innerHeight - padding * 2 - 150);

                setCards(prev => [...prev, { id: newId, folderId: activeFolderId, content: val, x: randomX, y: randomY, createdAt: Date.now() }]);
                setCommitments(prev => ({ ...prev, [activeFolderId]: newId }));
                form.reset();
              }}>
                <div className="w-12 h-12 flex items-center justify-center text-stone-200">
                  <Lightbulb size={28} />
                </div>
                <input name="goal" autoComplete="off" placeholder="What's the ultimate goal?"
                  className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-xl font-medium text-stone-900 placeholder:text-stone-200 font-serif italic" />
                <button type="submit" className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:scale-105 transition-all">ACTIVATE</button>
              </form>
            )}
          </div>
        </div>

        <div className="absolute bottom-10 left-10 z-50">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 bg-white border border-stone-200/60 shadow-sm rounded-full text-stone-400 hover:text-stone-900 transition-all">
            <ChevronRight size={18} className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </main>
    </div>
  );
}