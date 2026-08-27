import { Task } from "@shared/types";

export interface FolderedProject {
    projectId: string;
    projectName: string;
    parentId: string | null;
    progress: number;
    pendingDays: number;
    allThreadsWithContext: Array<{
        id: string;
        title: string;
        breadcrumb: string;
        isChild: boolean;
        hasPending: boolean;
        tasks: Task[];
        visibleTasks: Task[];
    }>;
    directThreadsWithContext: Array<{
        id: string;
        title: string;
        breadcrumb: string;
        isChild: boolean;
        hasPending: boolean;
        tasks: Task[];
        visibleTasks: Task[];
    }>;
    subfolders: FolderedProject[];
    breadcrumb?: string;
    isFullyCompleted: boolean;
}

export interface WeekDay {
    date: string;
    name: string;
    day: string;
    month: string;
    year: number;
    weekNumber: number;
}
