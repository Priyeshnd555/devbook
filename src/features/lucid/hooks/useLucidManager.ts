"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Task, Thread, ThreadConnection, ThreadStatus } from "@shared/types";
import { LucidCard, LucidConnection, LucidCommitments, DragData } from "../types";

const STORAGE_KEY = 'lucid_web_v12';

export interface LucidManagerActions {
  addThread?: (title?: string, x?: number, y?: number) => void;
  updateThreadPosition?: (id: string, x: number, y: number) => void;
  updateThreadDimensions?: (id: string, width?: number, height?: number, x?: number, y?: number) => void;
  updateThreadTitle?: (id: string, title: string) => void;
  updateThreadStatus?: (id: string, status: ThreadStatus) => void;
  updateThreadTasks?: (id: string, tasks: Task[]) => void;
  deleteThread?: (id: string) => void;
  unlinkThread?: (id: string) => void;
  createConnection?: (fromId: string, toId: string) => void;
  removeConnection?: (id: string) => void;
}

export const useLucidManager = (
  activeProjectId: string,
  externalThreads?: Record<string, Thread>,
  externalConnections?: ThreadConnection[],
  actions?: LucidManagerActions
) => {
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
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [cardZIndices, setCardZIndices] = useState<Record<string, number>>({});
  const topZRef = useRef(100);

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

  const bringCardToFront = useCallback((cardId: string) => {
    topZRef.current += 1;
    const newZ = topZRef.current;
    setCardZIndices(prev => ({ ...prev, [cardId]: newZ }));
    setActiveCardId(cardId);
  }, []);

  useEffect(() => {
    if (!externalThreads) {
      const timeout = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          cards, connections, commitments
        }));
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [cards, connections, commitments, externalThreads]);

  // Derived folder cards with collision detection to prevent stacking
  const folderCards = useMemo<LucidCard[]>(() => {
    if (externalThreads) {
      const projectThreads = Object.values(externalThreads).filter(
        (t) => (t.projectId || 'default') === (activeProjectId || 'default')
      );

      const placed: { x: number; y: number }[] = [];
      return projectThreads.map((t, idx) => {
        let posX = t.x;
        let posY = t.y;

        // Check for collision or missing coordinates: if two cards overlap within 220px x 160px
        const collides = posX !== undefined && posY !== undefined && placed.some(
          p => Math.abs(p.x - posX!) < 220 && Math.abs(p.y - posY!) < 160
        );

        if (posX === undefined || posY === undefined || collides) {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          posX = 80 + col * 420;
          posY = 80 + row * 340;
        }

        placed.push({ x: posX, y: posY });

        return {
          id: t.id,
          projectId: t.projectId,
          content: t.title,
          tasks: t.tasks || [],
          status: t.status || 'active',
          lastWorked: t.lastWorked,
          threadNumber: idx + 1,
          sessions: t.sessions || [],
          x: posX,
          y: posY,
          width: t.width,
          height: t.height,
          createdAt: t.createdAt,
          zIndex: cardZIndices[t.id] || 10,
        };
      });
    }
    return cards.filter((c) => (c.projectId || 'default') === activeProjectId);
  }, [externalThreads, activeProjectId, cards, cardZIndices]);

  const activeConnections = externalConnections || connections;
  const folderConnections = useMemo<LucidConnection[]>(() => {
    const cardIds = new Set(folderCards.map(c => c.id));
    return activeConnections.filter(conn => cardIds.has(conn.from) && cardIds.has(conn.to));
  }, [activeConnections, folderCards]);

  const autoArrangeCards = useCallback(() => {
    if (folderCards.length === 0) return;

    // Determine number of columns based on card count
    const numCols = folderCards.length <= 4 ? 2 : 3;

    // Calculate maximum widths per column to avoid any horizontal overlap
    const colWidths = new Array(numCols).fill(340);
    folderCards.forEach((c, idx) => {
      const col = idx % numCols;
      const el = cardRefs.current[c.id];
      const w = el?.offsetWidth || c.width || 340;
      if (w > colWidths[col]) colWidths[col] = Math.min(w, 560);
    });

    const colX: number[] = [80];
    for (let i = 1; i < numCols; i++) {
      colX[i] = colX[i - 1] + colWidths[i - 1] + 60; // 60px horizontal gutter
    }

    // Keep track of Y offset for each column for a balanced, non-overlapping layout
    const colY = new Array(numCols).fill(80);
    const newPositions: Record<string, { x: number; y: number; width: number }> = {};

    folderCards.forEach((c) => {
      // Pick the column with the minimum height
      let bestCol = 0;
      for (let col = 1; col < numCols; col++) {
        if (colY[col] < colY[bestCol]) {
          bestCol = col;
        }
      }

      const el = cardRefs.current[c.id];
      const cardW = el?.offsetWidth || c.width || 340;
      const cardH = el?.offsetHeight || c.height || 220;

      const newX = colX[bestCol];
      const newY = colY[bestCol];
      newPositions[c.id] = { x: newX, y: newY, width: cardW };

      colY[bestCol] += cardH + 50; // 50px vertical gutter

      // Animate DOM element transform smoothly
      if (el) {
        el.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        setTimeout(() => {
          if (el) el.style.transition = '';
        }, 450);
      }

      if (actions?.updateThreadPosition) {
        actions.updateThreadPosition(c.id, newX, newY);
      }
    });

    // Update connection lines so arrows stay connected cleanly
    activeConnections.forEach((conn) => {
      const line = connectionRefs.current[conn.id];
      const fromPos = newPositions[conn.from];
      const toPos = newPositions[conn.to];
      if (line && fromPos && toPos) {
        const fromMidX = fromPos.x + fromPos.width / 2;
        const toMidX = toPos.x + toPos.width / 2;
        line.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        line.setAttribute('x1', fromMidX.toString());
        line.setAttribute('y1', (fromPos.y + 30).toString());
        line.setAttribute('x2', toMidX.toString());
        line.setAttribute('y2', (toPos.y + 30).toString());
        setTimeout(() => {
          if (line) line.style.transition = '';
        }, 450);
      }
    });
  }, [folderCards, actions, activeConnections]);

  // Dynamic auto-align: prevent vertical collisions when cards expand in height
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;

    let debounceTimer: NodeJS.Timeout | null = null;

    const observer = new ResizeObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const currentCards = [...folderCards];

        for (const card of currentCards) {
          const el = cardRefs.current[card.id];
          if (!el) continue;
          const cardH = el.offsetHeight;
          const cardW = el.offsetWidth;
          const cardBottom = card.y + cardH + 40;

          // Find cards below in same column that collide
          const overlappingBelow = currentCards.filter(
            (other) =>
              other.id !== card.id &&
              Math.abs(other.x - card.x) < Math.max(cardW, 300) * 0.85 &&
              other.y >= card.y &&
              other.y < cardBottom
          );

          if (overlappingBelow.length > 0) {
            overlappingBelow.forEach((other) => {
              const newY = cardBottom;
              const otherEl = cardRefs.current[other.id];
              if (otherEl) {
                otherEl.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
                otherEl.style.transform = `translate3d(${other.x}px, ${newY}px, 0)`;
                setTimeout(() => {
                  if (otherEl) otherEl.style.transition = '';
                }, 350);
              }
              other.y = newY;
              actions?.updateThreadPosition?.(other.id, other.x, newY);
            });
          }
        }
      }, 120);
    });

    Object.values(cardRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [folderCards, actions]);

  const animate = () => {
    const dragId = dragDataRef.current.id;
    if (dragId) {
      const el = cardRefs.current[dragId];
      if (el) {
        const tilt = Math.min(Math.max((dragDataRef.current.currentX - dragDataRef.current.lastX) * 0.6, -12), 12);
        el.style.transform = `translate3d(${dragDataRef.current.currentX}px, ${dragDataRef.current.currentY}px, 0) rotate(${tilt}deg) scale(1.02)`;
        dragDataRef.current.lastX = dragDataRef.current.currentX;

        const currentCard = folderCards.find(c => c.id === dragId);
        const cardWidth = currentCard?.width || el.offsetWidth || 240;
        const halfWidth = cardWidth / 2;

        activeConnectionsRef.current.forEach(conn => {
          const line = connectionRefs.current[conn.id];
          if (!line) return;

          if (conn.from === dragId) {
            line.setAttribute('x1', (dragDataRef.current.currentX + halfWidth).toString());
            line.setAttribute('y1', (dragDataRef.current.currentY + 30).toString());
          } else if (conn.to === dragId) {
            line.setAttribute('x2', (dragDataRef.current.currentX + halfWidth).toString());
            line.setAttribute('y2', (dragDataRef.current.currentY + 30).toString());
          }
        });
      }
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const handleMouseDown = (e: React.MouseEvent | MouseEvent, card: LucidCard) => {
    bringCardToFront(card.id);

    if (
      (e.target as HTMLElement).closest('button') || 
      (e.target as HTMLElement).closest('.resize-handle') ||
      (e.target as HTMLElement).classList.contains('resize-handle') ||
      (e.target as HTMLElement).tagName === 'TEXTAREA' || 
      (e.target as HTMLElement).tagName === 'INPUT'
    ) return;
    if (linkingFromId) return;

    dragDataRef.current = {
      id: card.id, startX: e.clientX, startY: e.clientY,
      cardX: card.x, cardY: card.y, currentX: card.x, currentY: card.y,
      lastX: card.x
    };

    activeConnectionsRef.current = activeConnections.filter(c => c.from === card.id || c.to === card.id);
    setDraggedCardId(card.id);
    requestRef.current = requestAnimationFrame(animate);
  };

  const createConnection = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    if (actions?.createConnection) {
      actions.createConnection(fromId, toId);
    } else {
      setConnections(prev => [...prev, { id: crypto.randomUUID(), from: fromId, to: toId }]);
    }
  }, [actions]);

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

    if (actions?.updateThreadPosition) {
      actions.updateThreadPosition(finishedId, finalX, finalY);
    } else {
      setCards(prev => prev.map(c => c.id === finishedId ? { ...c, x: finalX, y: finalY } : c));
    }

    dragPositionRef.current = { x: 0, y: 0 };
    activeConnectionsRef.current = [];

    if (proximityTargetId) {
      createConnection(finishedId, proximityTargetId);
    }

    dragDataRef.current.id = null;
    setDraggedCardId(null);
    setProximityTargetId(null);
  }, [proximityTargetId, createConnection, actions]);

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
    const randomX = x ?? (padding + Math.random() * (window.innerWidth - padding * 2 - 240));
    const randomY = y ?? (padding + Math.random() * (window.innerHeight - padding * 2 - 160));

    if (actions?.addThread) {
      actions.addThread(content, randomX, randomY);
    } else {
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
    }
  };

  const updateCardContent = (id: string, content: string) => {
    if (actions?.updateThreadTitle) {
      actions.updateThreadTitle(id, content);
    } else {
      setCards(prev => prev.map(c => c.id === id ? { ...c, content } : c));
    }
  };

  const deleteCard = (id: string) => {
    if (actions?.deleteThread) {
      actions.deleteThread(id);
    } else {
      setCards(prev => prev.filter(c => c.id !== id));
      setConnections(prev => prev.filter(conn => conn.from !== id && conn.to !== id));
    }
  };

  const unlinkCard = (id: string) => {
    if (actions?.unlinkThread) {
      actions.unlinkThread(id);
    } else {
      setConnections(prev => prev.filter(conn => conn.from !== id && conn.to !== id));
    }
  };

  const removeConnection = (id: string) => {
    if (actions?.removeConnection) {
      actions.removeConnection(id);
    } else {
      setConnections(prev => prev.filter(c => c.id !== id));
    }
  };

  const updateCardStatus = (id: string, status: ThreadStatus) => {
    if (actions?.updateThreadStatus) {
      actions.updateThreadStatus(id, status);
    } else {
      setCards(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    }
  };

  const updateCardTasks = (cardId: string, updatedTasks: Task[]) => {
    if (actions?.updateThreadTasks) {
      actions.updateThreadTasks(cardId, updatedTasks);
    } else {
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, tasks: updatedTasks } : c));
    }
  };

  const updateCardDimensions = (id: string, width?: number, height?: number, x?: number, y?: number) => {
    if (actions?.updateThreadDimensions) {
      actions.updateThreadDimensions(id, width, height, x, y);
    } else {
      setCards(prev =>
        prev.map(c =>
          c.id === id
            ? {
                ...c,
                width,
                height,
                ...(x !== undefined ? { x } : {}),
                ...(y !== undefined ? { y } : {}),
              }
            : c
        )
      );
    }
  };

  return {
    folderCards,
    folderConnections,
    draggedCardId,
    activeCardId,
    setActiveCardId,
    cardZIndices,
    bringCardToFront,
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
    updateCardStatus,
    updateCardDimensions,
    autoArrangeCards,
    cardRefs,
    connectionRefs,
  };
};
