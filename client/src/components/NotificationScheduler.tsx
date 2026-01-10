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

  useEffect(() => {
    if (activeBatches.length === 0 || (configs.length === 0 && templates.length === 0)) return;

    activeBatches.forEach((batch) => {
      // Find group for this batch
      const group = groups.find(g => g.id === batch.groupId);
      if (!group) return;

      // Normalize type
      let type = (group.type || '').toLowerCase();
      if (type.includes('prod') || type.includes('postura')) type = 'production';
      else if (type.includes('macho')) type = 'males';
      else if (type.includes('reprod') || type.includes('matriz')) type = 'breeders';

      const schedule = (timeStr: string, taskType: string, title: string) => {
        if (!timeStr || !timeStr.includes(':')) return;
        const [h, m] = timeStr.split(':').map(Number);
        const actionUrl = `/tasks/execute?batchId=${batch.id}&task=${taskType}&time=${timeStr}`;

        scheduleRoutine(h, m || 0, title, actionUrl, () => {
          // Check if this specific todo already exists for today
          const today = new Date().toISOString().split('T')[0];
          const exists = todos.some(t => t.task === title && t.dueDate === today);

          if (!exists) {
            addTodo(title, today, true);
            addPendingTask(title, actionUrl);
          }
        });
      };

      // 1. Automate feeding based on Admin-defined Feed Configurations
      const config = configs.find(c => c.group_type === type && c.active);
      if (config) {
        config.schedule_times.forEach(time => {
          schedule(time, "feed", `Alimentar ${batch.name} (${group.name}) 🌾`);
        });
      }

      // 2. Automate routines based on Admin-defined Task Templates
      // Filter templates that apply to this group or are global
      const relevantTemplates = templates.filter(tmpl => {
        if (!tmpl.target_group) return true; // Global
        return tmpl.target_group === type;
      });

      relevantTemplates.forEach(tmpl => {
        schedule(tmpl.default_time, tmpl.task_type || 'custom', `${tmpl.title} - ${batch.name} 📋`);
      });
    });
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
