import { Task } from "@shared/types";

export interface LucidCard {
  id: string;
  projectId: string;
  content: string;
  tasks: Task[];
  x: number;
  y: number;
  createdAt: number;
}

export interface LucidConnection {
  id: string;
  from: string;
  to: string;
}

export interface LucidCommitments {
  [projectId: string]: string;
}

export interface DragData {
  id: string | null;
  startX: number;
  startY: number;
  cardX: number;
  cardY: number;
  currentX: number;
  currentY: number;
  lastX: number;
}
