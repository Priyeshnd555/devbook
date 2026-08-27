"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Task } from "@shared/types";
import { LucidCard, LucidConnection, LucidCommitments, DragData } from "../types";

const STORAGE_KEY = 'lucid_web_v12';

export const useLucidManager = (activeProjectId: string) => {
  const [cards, setCards] = useState<LucidCard[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.cards || [];
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [connections, setConnections] = useState<LucidConnection[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.connections || [];
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [commitments, setCommitments] = useState<LucidCommitments>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.commitments || {};
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [linkingFromId, setLinkingFromId] = useState<string | null>(null);
  const [proximityTargetId, setProximityTargetId] = useState<string | null>(null);

  const dragDataRef = useRef<DragData>({
    id: null, startX: 0, startY: 0, cardX: 0, cardY: 0, currentX: 0, currentY: 0, lastX: 0
  });
  const dragPositionRef = useRef({ x: 0, y: 0 });
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const connectionRefs = useRef<Record<string, SVGLineElement | null>>({});
  const requestRef = useRef<number | null>(null);
  const activeConnectionsRef = useRef<LucidConnection[]>([]);
  const lastProximityCheckRef = useRef<number>(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        cards, connections, commitments
      }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [cards, connections, commitments]);

  const folderCards = useMemo(() => 
    cards.filter(c => (c.projectId || 'default') === activeProjectId), 
    [cards, activeProjectId]
  );

  const folderConnections = useMemo(() => {
    const cardIds = new Set(folderCards.map(c => c.id));
    return connections.filter(conn => cardIds.has(conn.from) && cardIds.has(conn.to));
  }, [connections, folderCards]);

  const activeCommitment = useMemo(() => 
    cards.find(c => c.id === commitments[activeProjectId]), 
    [cards, commitments, activeProjectId]
  );

  const animate = () => {
    const dragId = dragDataRef.current.id;
    if (dragId) {
      const el = cardRefs.current[dragId];
      if (el) {
        const tilt = Math.min(Math.max((dragDataRef.current.currentX - dragDataRef.current.lastX) * 0.6, -12), 12);
        el.style.transform = `translate3d(${dragDataRef.current.currentX}px, ${dragDataRef.current.currentY}px, 0) rotate(${tilt}deg) scale(1.02)`;
        dragDataRef.current.lastX = dragDataRef.current.currentX;

        activeConnectionsRef.current.forEach(conn => {
          const line = connectionRefs.current[conn.id];
          if (!line) return;

          if (conn.from === dragId) {
            line.setAttribute('x1', (dragDataRef.current.currentX + 110).toString());
            line.setAttribute('y1', (dragDataRef.current.currentY + 30).toString());
          } else if (conn.to === dragId) {
            line.setAttribute('x2', (dragDataRef.current.currentX + 110).toString());
            line.setAttribute('y2', (dragDataRef.current.currentY + 30).toString());
          }
        });
      }
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const handleMouseDown = (e: React.MouseEvent | MouseEvent, card: LucidCard) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;
    if (linkingFromId) return;

    dragDataRef.current = {
      id: card.id, startX: e.clientX, startY: e.clientY,
      cardX: card.x, cardY: card.y, currentX: card.x, currentY: card.y,
      lastX: card.x
    };

    activeConnectionsRef.current = connections.filter(c => c.from === card.id || c.to === card.id);
    setDraggedCardId(card.id);
    requestRef.current = requestAnimationFrame(animate);
  };

  const createConnection = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setConnections(prev => [...prev, { id: crypto.randomUUID(), from: fromId, to: toId }]);
  }, []);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!dragDataRef.current.id) return;

    const deltaX = e.clientX - dragDataRef.current.startX;
    const deltaY = e.clientY - dragDataRef.current.startY;

    dragDataRef.current.currentX = dragDataRef.current.cardX + deltaX;
    dragDataRef.current.currentY = dragDataRef.current.cardY + deltaY;

    dragPositionRef.current = { x: dragDataRef.current.currentX, y: dragDataRef.current.currentY };

    const now = Date.now();
    if (now - lastProximityCheckRef.current > 50) {
      lastProximityCheckRef.current = now;
      const target = folderCards.find(c =>
        c.id !== dragDataRef.current.id &&
        Math.abs(c.x - dragDataRef.current.currentX) < 180 &&
        Math.abs(c.y - dragDataRef.current.currentY) < 180
      );
      setProximityTargetId(target ? target.id : null);
    }
  }, [folderCards]);

  const handleGlobalMouseUp = useCallback(() => {
    if (!dragDataRef.current.id) return;
    const finalX = dragDataRef.current.currentX;
    const finalY = dragDataRef.current.currentY;
    const finishedId = dragDataRef.current.id;
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
    }

    setCards(prev => prev.map(c => c.id === finishedId ? { ...c, x: finalX, y: finalY } : c));
    dragPositionRef.current = { x: 0, y: 0 };
    activeConnectionsRef.current = [];

    if (proximityTargetId) {
      createConnection(finishedId, proximityTargetId);
    }

    dragDataRef.current.id = null;
    setDraggedCardId(null);
    setProximityTargetId(null);
  }, [proximityTargetId, createConnection]);

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

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

  const removeConnection = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
  };

  const updateCardTasks = (cardId: string, updatedTasks: Task[]) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, tasks: updatedTasks } : c));
  };

  const setCommitment = (goal: string) => {
    const newId = crypto.randomUUID();
    const padding = 100;
    const randomX = padding + Math.random() * (window.innerWidth - padding * 2 - 240);
    const randomY = padding + Math.random() * (window.innerHeight - padding * 2 - 150);

    setCards(prev => [...prev, { id: newId, projectId: activeProjectId, content: goal, tasks: [], x: randomX, y: randomY, createdAt: Date.now() }]);
    setCommitments(prev => ({ ...prev, [activeProjectId]: newId }));
  };

  const clearCommitment = () => {
    setCommitments(prev => {
      const next = { ...prev };
      delete next[activeProjectId];
      return next;
    });
  };

  return {
    folderCards,
    folderConnections,
    activeCommitment,
    draggedCardId,
    linkingFromId,
    proximityTargetId,
    setLinkingFromId,
    handleMouseDown,
    handleGlobalMouseUp,
    addCard,
    updateCardContent,
    deleteCard,
    unlinkCard,
    createConnection,
    removeConnection,
    updateCardTasks,
    setCommitment,
    clearCommitment,
    cardRefs,
    connectionRefs,
  };
};
