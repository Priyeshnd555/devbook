"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Lightbulb, Lock, Trash2, X, Link as LinkIcon, Unlink, ArrowLeft, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import useWorkflowManager from '../hooks/useWorkflowManager';
import ProjectSidebar from '../components/ProjectSidebar';
import ProjectNavigator from '../components/ProjectNavigator';
import HeaderActions from '../components/HeaderActions';
import SettingsModal from '../components/SettingsModal';
import GlobalHeader from '../components/GlobalHeader';
import { TaskItem } from '../components/TaskItem';
import { Task } from '../types';

// =================================================================================================
// CONTEXT ANCHOR: LUCID THOUGHTS PAGE (app/lucid/page.tsx)
// =================================================================================================
// PURPOSE: A spatial brainstorming surface where users can capture "Lucid Thoughts" as floating
// cards, connect them to form relationships, and commit to a "Final Goal" per folder.
//
// DEPENDENCIES:
// - useWorkflowManager: Single source of truth for project-level data and task handlers.
// - localStorage: Primary persistence layer via STORAGE_KEY ('lucid_web_v12').
// - lucide-react: Standardized icon set for visual continuity.
// - requestAnimationFrame: High-performance animation loop for spatial interactions.
//
// INVARIANTS:
// - Every card must be assigned to an active `projectId` (defaults to 'default').
// - Connections are bidirectional in visual logic but have directional 'from'/'to' metadata.
// - Cards and their sub-tasks are saved to local storage on a debounced timer (500ms).
//
// STATE MUTATIONS:
// - setCards: Modifies the global list of brainstorm cards.
// - setConnections: Manages the relationship links between cards.
// - setCommitments: Stores the single "Final Goal" card ID for each project.
//
// EVOLUTIONARY FOOTPRINT:
// # GENERATION 1: Standalone Prototype (LucidThough.tsx) - basic spatial cards.
// # GENERATION 2: Layout & System Integration - migration to app/lucid, theme support.
// # GENERATION 3: Hierarchical Task Integration - added sub-task support within cards.
// # GENERATION 4: High-Performance Canvas - shifted drag/connection logic to direct DOM manipulation.
// =================================================================================================

/**
 * LUCID - Compact Notepad Edition
 * Reduced card footprint to accommodate more items on screen.
 * Padding and width optimized for density.
 */

const STORAGE_KEY = 'lucid_web_v12';

interface LucidCard {
  id: string;
  projectId: string;
  content: string;
  tasks: Task[];
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
  [projectId: string]: string;
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

// =================================================================================================
// CONTEXT ANCHOR: LucidPage Component
// PURPOSE: Manages the spatial canvas and sidebar for brainstorming.
// DEPENDENCIES: uses custom state hooks and refs for high-performance dragging.
// INVARIANTS: 
// - Every card must belong to exactly one folder.
// - Active commitment must be one of the cards in the current folder.
// =================================================================================================
export default function LucidPage() {
  const {
    projects,
    selectedProjectId,
    handleSelectProject,
    addProject,
    deleteProject,
    renameProject,
    taskItemProps,
    showCompleted,
    setShowCompleted
  } = useWorkflowManager();

  const [cards, setCards] = useState<LucidCard[]>([]);
  const [connections, setConnections] = useState<LucidConnection[]>([]);
  const [commitments, setCommitments] = useState<LucidCommitments>({});

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [linkingFromId, setLinkingFromId] = useState<string | null>(null);
  const [proximityTargetId, setProximityTargetId] = useState<string | null>(null);
  const dragPositionRef = useRef({ x: 0, y: 0 });

  // --- Local Task Management for Lucid Cards ---
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskText, setEditedTaskText] = useState<string>("");
  const [newChildText, setNewChildText] = useState<string>("");

  const dragData = useRef<DragData>({
    id: null, startX: 0, startY: 0, cardX: 0, cardY: 0, currentX: 0, currentY: 0, lastX: 0
  });

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const connectionRefs = useRef<Record<string, SVGLineElement | null>>({});
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // --- Persistence ---
  // STRATEGY: Hydrate the canvas state from localStorage on mount.
  // We use a single STORAGE_KEY to avoid multiple lookups for related spatial data.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setCards(parsed.cards || []);
      setConnections(parsed.connections || []);
      setCommitments(parsed.commitments || {});
    }
  }, []);

  // STRATEGY: Debounced persistence to avoid blocking UI during high-frequency edits.
  // 500ms allows for rapid typing and card placement without excessive disk I/O.
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        cards, connections, commitments
      }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [cards, connections, commitments]);

  // --- Performance Refs ---
  const activeConnectionsRef = useRef<LucidConnection[]>([]);
  const lastProximityCheckRef = useRef<number>(0);

  // --- Animation Loop ---
  // PERFORMANCE CONSTRAINT: We bypass React's standard state-driven render path for spatial motion.
  // By updating the DOM directly via requestAnimationFrame, we achieve 60FPS even with complex canvas graphs.
  // React state is only updated on 'mouseup' to finalize the position in the source of truth.
  const animate = () => {
    const dragId = dragData.current.id;
    if (dragId) {
      const el = cardRefs.current[dragId];
      if (el) {
        const tilt = Math.min(Math.max((dragData.current.currentX - dragData.current.lastX) * 0.6, -12), 12);
        el.style.transform = `translate3d(${dragData.current.currentX}px, ${dragData.current.currentY}px, 0) rotate(${tilt}deg) scale(1.02)`;
        dragData.current.lastX = dragData.current.currentX;

        // Update ONLY connected lines directly (using pre-filtered ref)
        activeConnectionsRef.current.forEach(conn => {
          const line = connectionRefs.current[conn.id];
          if (!line) return;

          if (conn.from === dragId) {
            line.setAttribute('x1', (dragData.current.currentX + 110).toString());
            line.setAttribute('y1', (dragData.current.currentY + 30).toString());
          } else if (conn.to === dragId) {
            line.setAttribute('x2', (dragData.current.currentX + 110).toString());
            line.setAttribute('y2', (dragData.current.currentY + 30).toString());
          }
        });
      }
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const createConnection = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setConnections(prev => [...prev, { id: crypto.randomUUID(), from: fromId, to: toId }]);
  };

  const activeProjectId = selectedProjectId || 'default';
  const folderCards = useMemo(() => cards.filter(c => (c.projectId || 'default') === activeProjectId), [cards, activeProjectId]);

  const handleMouseDown = (e: React.MouseEvent | MouseEvent, card: LucidCard) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;
    if (linkingFromId) return;

    dragData.current = {
      id: card.id, startX: e.clientX, startY: e.clientY,
      cardX: card.x, cardY: card.y, currentX: card.x, currentY: card.y,
      lastX: card.x
    };

    // Pre-filter connections for only what needs to move
    activeConnectionsRef.current = connections.filter(c => c.from === card.id || c.to === card.id);

    setDraggedCardId(card.id);
    requestRef.current = requestAnimationFrame(animate);
  };

  // STRATEGY: Snap-Target Detection
  // We use a throttled proximity check (50ms) to identify potential connection targets.
  // This minimizes CPU usage while maintaining a high perceived "responsiveness" for snapping.
  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!dragData.current.id) return;

    const deltaX = e.clientX - dragData.current.startX;
    const deltaY = e.clientY - dragData.current.startY;

    dragData.current.currentX = dragData.current.cardX + deltaX;
    dragData.current.currentY = dragData.current.cardY + deltaY;

    dragPositionRef.current = { x: dragData.current.currentX, y: dragData.current.currentY };

    // Throttled proximity detection (every 50ms)
    const now = Date.now();
    if (now - lastProximityCheckRef.current > 50) {
      lastProximityCheckRef.current = now;
      const target = folderCards.find(c =>
        c.id !== dragData.current.id &&
        Math.abs(c.x - dragData.current.currentX) < 180 &&
        Math.abs(c.y - dragData.current.currentY) < 180
      );

      if (target?.id !== proximityTargetId) {
        setProximityTargetId(target ? target.id : null);
      }
    }
  };

  // STRATEGY: Finalizing Position
  // On mouse up, we commit the transient drag positions back to React state and localStorage.
  // This ensures the "Source of Truth" remains consistent with the visual state.
  const handleGlobalMouseUp = () => {
    if (!dragData.current.id) return;
    const finalX = dragData.current.currentX;
    const finalY = dragData.current.currentY;
    const finishedId = dragData.current.id;
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
    }

    setCards(prev => prev.map(c => c.id === finishedId ? { ...c, x: finalX, y: finalY } : c));
    dragPositionRef.current = { x: 0, y: 0 };
    activeConnectionsRef.current = []; // Clear active connections

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

  const activeCommitment = useMemo(() => cards.find(c => c.id === commitments[activeProjectId]), [cards, commitments, activeProjectId]);

  // --- CRUD OPERATIONS: SPATIAL ELEMENTS ---

  // STRATEGY: Absolute Placement vs Random Scatter
  // If x/y are provided (e.g., from double-click), use them directly.
  // Otherwise, scatter cards randomly within a safe padding zone to minimize initial overlap.
  const addCard = (content = "", x?: number, y?: number) => {
    const padding = 100;
    const randomX = x ?? (padding + Math.random() * (window.innerWidth - padding * 2 - 220));
    const randomY = y ?? (padding + Math.random() * (window.innerHeight - padding * 2 - 150));

    const newCard: LucidCard = {
      id: crypto.randomUUID(),
      projectId: activeProjectId,
      content,
      tasks: [],
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

  const updateCardTasks = (cardId: string, updatedTasks: Task[]) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, tasks: updatedTasks } : c));
  };

  // --- RECURSIVE DATA OPS: HIERARCHICAL TASKS ---

  // STRATEGY: Deep-Tree Immutable Updates
  // Since tasks can be nested up to N levels, we use a recursive pattern to find and 
  // update the target task while preserving the immutability of the surrounding object graph.
  const recursiveUpdateTask = (tasks: Task[], taskId: string, update: (t: Task) => Task): Task[] => {
    return tasks.map(t => {
      if (t.id === taskId) return update(t);
      if (t.children.length > 0) return { ...t, children: recursiveUpdateTask(t.children, taskId, update) };
      return t;
    });
  };

  // CONTEXT ANCHOR: Lucid Task Handlers
  // PURPOSE: Maps Lucid-specific card-task interactions to the standard TaskItem component.
  // This bridge allows for total styling parity between the Explorer and Lucid views.
  const lucidTaskItemProps = {
    expandedTasks,
    editingNote,
    addingChildTo,
    editingTaskId,
    editedTaskText,
    setEditingNote,
    setAddingChildTo,
    newChildText,
    setNewChildText,
    setEditingTaskId,
    setEditedTaskText,
    toggleTask: (taskId: string) => {
      setExpandedTasks(prev => {
        const next = new Set(prev);
        if (next.has(taskId)) next.delete(taskId);
        else next.add(taskId);
        return next;
      });
    },
    toggleTaskDone: (cardId: string, taskId: string) => {
      setCards(prev => prev.map(c => c.id === cardId ? {
        ...c,
        tasks: recursiveUpdateTask(c.tasks, taskId, t => ({ ...t, done: !t.done, completedAt: !t.done ? Date.now() : undefined }))
      } : c));
    },
    saveNote: (cardId: string, taskId: string, note: string) => {
      setCards(prev => prev.map(c => c.id === cardId ? {
        ...c,
        tasks: recursiveUpdateTask(c.tasks, taskId, t => ({ ...t, note }))
      } : c));
      setEditingNote(null);
    },
    addChild: (cardId: string, parentId: string) => {
      if (!newChildText.trim()) return;
      const newTask: Task = {
        id: crypto.randomUUID(),
        text: newChildText.trim(),
        done: false,
        note: "",
        children: [],
        priority: 0,
        createdAt: Date.now()
      };
      setCards(prev => prev.map(c => c.id === cardId ? {
        ...c,
        tasks: recursiveUpdateTask(c.tasks, parentId, t => ({ ...t, children: [...t.children, newTask] }))
      } : c));
      setAddingChildTo(null);
      setNewChildText("");
      setExpandedTasks(prev => new Set(prev).add(parentId));
    },
    updateTaskText: (cardId: string, taskId: string, text: string) => {
      setCards(prev => prev.map(c => c.id === cardId ? {
        ...c,
        tasks: recursiveUpdateTask(c.tasks, taskId, t => ({ ...t, text }))
      } : c));
      setEditingTaskId(null);
    },
    setTaskPriority: (cardId: string, taskId: string, priority: number) => {
      setCards(prev => prev.map(c => c.id === cardId ? {
        ...c,
        tasks: recursiveUpdateTask(c.tasks, taskId, t => ({ ...t, priority }))
      } : c));
    },
    updateTaskSort: (cardId: string, taskId: string, config: any) => {
      setCards(prev => prev.map(c => c.id === cardId ? {
        ...c,
        tasks: recursiveUpdateTask(c.tasks, taskId, t => ({ ...t, sortConfig: config }))
      } : c));
    },
  };

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      <ProjectSidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onAddProject={addProject}
        onSelectProject={handleSelectProject}
        onDeleteProject={deleteProject}
        onRenameProject={renameProject}
        isSidebarVisible={isSidebarVisible}
        onToggle={() => setSidebarVisible(!isSidebarVisible)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <GlobalHeader
          activeRoute="lucid"
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onAddProject={addProject}
          onRenameProject={renameProject}
          onDeleteProject={deleteProject}
          showCompleted={showCompleted}
          onToggleShowCompleted={setShowCompleted}
          onOpenSettings={() => setSettingsModalOpen(true)}
          primaryAction={
            <button
              onClick={() => addCard()}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg hover:bg-primary-hover transition-all transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Card</span>
            </button>
          }
        />

        {/* --- Canvas Area --- */}
        <main
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-background cursor-crosshair selection:bg-primary/20"
          onMouseMove={() => { }} // Global handlers are used
          onMouseUp={handleGlobalMouseUp}
          onMouseLeave={handleGlobalMouseUp}
          onDoubleClick={(e) => {
            if (e.target === canvasRef.current) {
              const rect = canvasRef.current.getBoundingClientRect();
              addCard("", e.clientX - rect.left - 150, e.clientY - rect.top - 100);
            }
          }}
        >
          {/* Canvas area - cards are rendered absolutely within this relative container */}
          <div className="absolute inset-0 z-0">
            {/* --- CONNECTIONS LAYER --- */}
            <svg className="absolute inset-0 pointer-events-none z-0 w-full h-full overflow-visible">
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="currentColor" className="text-border" />
                </marker>
              </defs>
              {folderConnections.map(conn => {
                const from = cards.find(c => c.id === conn.from);
                const to = cards.find(c => c.id === conn.to);
                if (!from || !to) return null;

                const x1 = from.x + 110;
                const y1 = from.y + 30;
                const x2 = to.x + 110;
                const y2 = to.y + 30;

                return (
                  <g key={conn.id} className="group pointer-events-auto">
                    <line
                      ref={el => { connectionRefs.current[conn.id] = el }}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="currentColor" strokeWidth="1.5"
                      markerEnd="url(#arrowhead)"
                      className="text-border opacity-60 group-hover:opacity-100 transition-opacity"
                    />
                    <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r="12" fill="var(--color-surface)" stroke="currentColor" className="text-border opacity-0 group-hover:opacity-100 cursor-pointer shadow-sm transition-all" onClick={() => setConnections(prev => prev.filter(c => c.id !== conn.id))} />
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 4} textAnchor="middle" className="pointer-events-none opacity-0 group-hover:opacity-100 fill-text-secondary font-bold text-[10px]">×</text>
                  </g>
                );
              })}
            </svg>

            {/* --- CARDS LAYER --- */}
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
                    className={`absolute p-5 w-[240px] bg-surface border rounded-xl flex flex-col group
                        ${draggedCardId === card.id ? 'z-50 shadow-2xl border-primary/40' : 'z-10 border-border shadow-sm hover:shadow-md hover:border-border/80'}
                        ${isSource || isTarget ? 'border-primary z-40 scale-[1.02]' : ''}
                        ${draggedCardId === card.id ? '' : 'transition-all duration-300'}
                       `}
                    style={{
                      left: 0, top: 0,
                      transform: `translate3d(${card.x}px, ${card.y}px, 0)`,
                      cursor: linkingFromId ? 'crosshair' : (draggedCardId === card.id ? 'grabbing' : 'grab'),
                      willChange: 'transform',
                    }}>

                    <div className="flex justify-between items-center mb-3 h-4 pointer-events-none">
                      <div className="text-[9px] font-bold text-text-secondary/40 tracking-wider">
                        {connCount > 0 && `${connCount} LINK${connCount > 1 ? 'S' : ''}`}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                        {connCount > 0 && (
                          <button onClick={(e) => { e.stopPropagation(); unlinkCard(card.id); }} className="text-text-secondary/40 hover:text-danger transition-colors" title="Unlink Card">
                            <Unlink size={12} />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setLinkingFromId(card.id); }} className="text-text-secondary/40 hover:text-primary transition-colors" title="Link Card">
                          <LinkIcon size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }} className="text-text-secondary/40 hover:text-danger transition-colors" title="Delete Card">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        className="w-full bg-transparent resize-none border-none outline-none ring-0 focus:ring-0 focus:outline-none p-0 text-text-primary font-serif italic text-lg placeholder:text-text-secondary/20 leading-relaxed cursor-text overflow-hidden"
                        value={card.content}
                        onChange={(e) => {
                          updateCardContent(card.id, e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        autoFocus={card.content === ""}
                        spellCheck={false}
                        rows={1}
                        placeholder="Thought..."
                      />
                    </div>

                    {/* Task List Integration */}
                    <div className="mt-4 pt-4 border-t border-border/10">
                      <div className="space-y-1">
                        {card.tasks.map((task) => (
                          <TaskItem
                            key={`${card.id}-${task.id}`}
                            {...lucidTaskItemProps}
                            task={task}
                            threadId={card.id}
                            showCompleted={showCompleted}
                          />
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-2 group/add px-1">
                        <Plus className="w-3.5 h-3.5 text-text-secondary/40 group-hover/add:text-primary transition-colors" />
                        <input
                          type="text"
                          placeholder="Add task..."
                          className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-xs text-text-secondary placeholder:text-text-secondary/20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              const newTask: Task = {
                                id: crypto.randomUUID(),
                                text: e.currentTarget.value.trim(),
                                done: false,
                                note: "",
                                children: [],
                                priority: 0,
                                createdAt: Date.now(),
                                sortConfig: { direction: 'desc' }
                              };
                              updateCardTasks(card.id, [...card.tasks, newTask]);
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DOCK / COMMITMENT area */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-2xl z-40 px-6">
            <div className="bg-surface border border-border shadow-xl rounded-[32px] p-6 flex items-center gap-6">
              {activeCommitment ? (
                <div className="flex-1 flex items-center gap-6 animate-in slide-in-from-bottom-2">
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Lock size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-text-secondary/40 uppercase tracking-widest mb-1">Final Goal</p>
                    <p className="text-text-primary font-bold text-xl truncate tracking-tight italic font-serif">{activeCommitment.content}</p>
                  </div>
                  <button onClick={() => {
                    setCommitments(prev => {
                      const next = { ...prev };
                      delete next[activeProjectId];
                      return next;
                    });
                  }} className="p-4 text-text-secondary/40 hover:text-danger transition-all"><X size={20} /></button>
                </div>
              ) : (
                <form className="flex-1 flex items-center gap-6" onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const goalInput = form.elements.namedItem('goal') as HTMLInputElement;
                  const val = goalInput.value;
                  if (!val) return;
                  const newId = crypto.randomUUID();
                  const padding = 100;
                  const randomX = padding + Math.random() * (window.innerWidth - padding * 2 - 240);
                  const randomY = padding + Math.random() * (window.innerHeight - padding * 2 - 150);

                  setCards(prev => [...prev, { id: newId, projectId: activeProjectId, content: val, tasks: [], x: randomX, y: randomY, createdAt: Date.now() }]);
                  setCommitments(prev => ({ ...prev, [activeProjectId]: newId }));
                  form.reset();
                }}>
                  <div className="w-12 h-12 flex items-center justify-center text-primary/40">
                    <Lightbulb size={28} />
                  </div>
                  <input name="goal" autoComplete="off" placeholder="What's the ultimate goal?"
                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-xl font-medium text-text-primary placeholder:text-text-secondary/20 font-serif italic" />
                  <button type="submit" className="bg-primary text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-primary-hover transition-all">ACTIVATE</button>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}