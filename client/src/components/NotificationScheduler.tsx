import { useEffect, useRef } from "react";
import { useBatches } from "@/hooks/useBatches";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppStore } from "@/hooks/useAppStore";

export default function NotificationScheduler() {
  const { batches } = useBatches();
  const { scheduleRoutine, sendNotification } = useNotifications();
  const { addPendingTask, pendingTasks } = useAppStore();

  const prevPendingCount = useRef(pendingTasks.length);

  // Filter for active batches to schedule notifications for
  const safeGroups = batches?.filter(b => b.status === 'active') || [];

  useEffect(() => {
    if (safeGroups.length === 0) return;

    safeGroups.forEach((group) => {
      const schedule = (h: number, taskType: string, title: string) => {
        const actionUrl = `/tasks/execute?groupId=${group.id}&task=${taskType}&time=${h}:00`;
        scheduleRoutine(h, 0, title, actionUrl, () => {
          addPendingTask(title, actionUrl);
        });
      };

      // Alimentação
      schedule(6, "feed", `Alimentar ${group.name} 🌾`);
      schedule(12, "feed", `Alimentar ${group.name} 🌾`);
      schedule(18, "feed", `Alimentar ${group.name} 🌾`);

      // Água
      schedule(8, "water", `Verificar Água ${group.name} 💧`);
      schedule(14, "water", `Verificar Água ${group.name} 💧`);

      // Ovos
      schedule(10, "egg", `Coleta de Ovos ${group.name} 🥚`);
      schedule(16, "egg", `Coleta de Ovos ${group.name} 🥚`);
    });
  }, [safeGroups, scheduleRoutine, addPendingTask]);

  // Watch pending tasks to trigger notifications
  useEffect(() => {
    const count = pendingTasks.length;
    const prev = prevPendingCount.current;

    if (count > prev) {
      // New task added
      if (count === 1) {
        // First task: send specific notification
        const task = pendingTasks[0];
        sendNotification(task.title, { body: "Nova tarefa agendada" }, task.actionUrl);
      } else {
        // Multiple tasks: send aggregated notification
        sendNotification(
          "Tarefas Pendentes 📋",
          { body: `Você tem ${count} notificações em fila. Clique para ver.` },
          "/tasks/list"
        );
      }
    }

    prevPendingCount.current = count;
  }, [pendingTasks, sendNotification]);

  return null;
}
