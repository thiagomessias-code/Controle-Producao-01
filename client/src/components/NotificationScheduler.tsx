import { useEffect, useRef, useState, useMemo } from "react";
import { useBatches } from "@/hooks/useBatches";
import { useGroups } from "@/hooks/useGroups";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppStore } from "@/hooks/useAppStore";
import { feedApi, FeedConfiguration } from "@/api/feed";
import { supabase } from "@/api/supabaseClient";

export default function NotificationScheduler() {
  const { batches } = useBatches();
  const { groups } = useGroups();
  const { scheduleRoutine, sendNotification } = useNotifications();
  const { addPendingTask, pendingTasks, addTodo, todos, clearAllTasks } = useAppStore();
  const [configs, setConfigs] = useState<FeedConfiguration[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const prevPendingCount = useRef(pendingTasks.length);

  // Initial cleanup if cache is bloated
  useEffect(() => {
    if (pendingTasks.length > 500 || todos.length > 500) {
      console.log(`[NotificationScheduler] Bloated cache detected (${pendingTasks.length} tasks). Clearing...`);
      clearAllTasks();
    }
  }, []);

  useEffect(() => {
    Promise.all([
      feedApi.getConfigurations(),
      supabase.from('tasks_templates').select('*').eq('active', true)
    ]).then(([feedConfigs, templatesRes]) => {
      setConfigs(feedConfigs);
      setTemplates(templatesRes.data || []);
    }).catch(console.error);
  }, []);

  // Filter for active batches/groups to schedule notifications for
  const activeBatches = useMemo(() => batches?.filter(b => b.status === 'active') || [], [batches]);

  prevPendingCount.current = pendingTasks.length;
}, [activeBatches, groups, configs, templates, scheduleRoutine, addPendingTask, addTodo, todos]);

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
