"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Task } from "@shared/types";
import { LucidCard, LucidConnection, LucidCommitments, DragData } from "../types";

const STORAGE_KEY = 'lucid_web_v12';

export const useLucidManager = (activeProjectId: string) => {
  const [cards, setCards] = useState<LucidCard[]>([]);
  const [connections, setConnections] = useState<LucidConnection[]>([]);
  const [commitments, setCommitments] = useState<LucidCommitments>({});

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [linkingFromId, setLinkingFromId] = useState<string | null>(null);
  const [proximityTargetId, setProximityTargetId] = useState<string | null>(null);
  
  const dragData = useRef<DragData>({
    id: null, startX: 0, startY: 0, cardX: 0, cardY: 0, currentX: 0, currentY: 0, lastX: 0
  });
  const dragPositionRef = useRef({ x: 0, y: 0 });
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const connectionRefs = useRef<Record<string, SVGLineElement | null>>({});
  const requestRef = useRef<number | null>(null);
  const activeConnectionsRef = useRef<LucidConnection[]>([]);
  const lastProximityCheckRef = useRef<number>(0);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setCards(parsed.cards || []);
      setConnections(parsed.connections || []);
      setCommitments(parsed.commitments || {});
    }
  }, []);

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
    const dragId = dragData.current.id;
    if (dragId) {
      const el = cardRefs.current[dragId];
      if (el) {
        const tilt = Math.min(Math.max((dragData.current.currentX - dragData.current.lastX) * 0.6, -12), 12);
        el.style.transform = `translate3d(${dragData.current.currentX}px, ${dragData.current.currentY}px, 0) rotate(${tilt}deg) scale(1.02)`;
        dragData.current.lastX = dragData.current.currentX;

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

  const handleMouseDown = (e: React.MouseEvent | MouseEvent, card: LucidCard) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;
    if (linkingFromId) return;

    dragData.current = {
      id: card.id, startX: e.clientX, startY: e.clientY,
      cardX: card.x, cardY: card.y, currentX: card.x, currentY: card.y,
      lastX: card.x
    };

    activeConnectionsRef.current = connections.filter(c => c.from === card.id || c.to === card.id);
    setDraggedCardId(card.id);
    requestRef.current = requestAnimationFrame(animate);
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!dragData.current.id) return;

    const deltaX = e.clientX - dragData.current.startX;
    const deltaY = e.clientY - dragData.current.startY;

    dragData.current.currentX = dragData.current.cardX + deltaX;
    dragData.current.currentY = dragData.current.cardY + deltaY;

    dragPositionRef.current = { x: dragData.current.currentX, y: dragData.current.currentY };

    const now = Date.now();
    if (now - lastProximityCheckRef.current > 50) {
      lastProximityCheckRef.current = now;
      const target = folderCards.find(c =>
        c.id !== dragData.current.id &&
        Math.abs(c.x - dragData.current.currentX) < 180 &&
        Math.abs(c.y - dragData.current.currentY) < 180
      );
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
    dragPositionRef.current = { x: 0, y: 0 };
    activeConnectionsRef.current = [];

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

  const createConnection = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setConnections(prev => [...prev, { id: crypto.randomUUID(), from: fromId, to: toId }]);
  };

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
