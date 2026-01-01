import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Todo {
  id: string;
  task: string;
  dueDate: string;
  isCompleted: boolean;
  isAutomatic: boolean;
}

interface AppState {
  sidebarOpen: boolean;
  theme: "light" | "dark";
  notifications: Array<{
    id: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>;
  pendingTasks: Array<{
    id: string;
    title: string;
    actionUrl: string;
    timestamp: number;
  }>;
  todos: Todo[];
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  addNotification: (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => void;
  removeNotification: (id: string) => void;
  addPendingTask: (title: string, actionUrl: string) => void;
  removePendingTask: (id: string) => void;
  addTodo: (task: string, dueDate: string, isAutomatic: boolean) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  clearAllTasks: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      theme: "light",
      notifications: [],
      pendingTasks: [],
      todos: [],
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      addNotification: (message, type) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              id: Date.now().toString(),
              message,
              type,
            },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      addPendingTask: (title, actionUrl) =>
        set((state) => ({
          pendingTasks: [
            ...state.pendingTasks,
            {
              id: Date.now().toString(),
              title,
              actionUrl,
              timestamp: Date.now(),
            },
          ],
        })),
      removePendingTask: (id) =>
        set((state) => ({
          pendingTasks: state.pendingTasks.filter((t) => t.id !== id),
        })),
      addTodo: (task, dueDate, isAutomatic) =>
        set((state) => ({
          todos: [
            ...state.todos,
            {
              id: Date.now().toString(),
              task,
              dueDate,
              isCompleted: false,
              isAutomatic,
            },
          ],
        })),
      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
          ),
        })),
      removeTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        })),
      clearAllTasks: () =>
        set(() => ({
          pendingTasks: [],
          todos: [],
        })),
    }),
    {
      name: "app-store",
      partialize: (state) => ({
        theme: state.theme,
        notifications: state.notifications,
        pendingTasks: state.pendingTasks,
        todos: state.todos,
      }),
    }
  )
);
