import { useEffect, useRef, useState, useMemo } from "react";
import { useBatches } from "@/hooks/useBatches";
import { useGroups } from "@/hooks/useGroups";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppStore } from "@/hooks/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { feedApi, FeedConfiguration } from "@/api/feed";
import { supabase } from "@/api/supabaseClient";
import { getLocalISODate } from "@/utils/date";

/**
 * NotificationScheduler
 * Background component that manages daily routines, scheduled tasks,
 * and synchronizes them with the device's notification system and database.
 */
export default function NotificationScheduler() {
  const { user } = useAuth();
  const { batches } = useBatches();
  const { groups } = useGroups();
  const { scheduleRoutine, sendNotification } = useNotifications();
  const { addPendingTask, pendingTasks, addTodo, todos, clearAllTasks } = useAppStore();
  const [configs, setConfigs] = useState<FeedConfiguration[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const prevPendingCount = useRef(pendingTasks.length);

  // 1. Initial cleanup if cache is bloated (maintenance)
  useEffect(() => {
    if (pendingTasks.length > 500 || todos.length > 500) {
      console.log(`[NotificationScheduler] Bloated cache detected (${pendingTasks.length} tasks). Clearing...`);
      clearAllTasks();
    }
  }, []);

  // 2. Fetch configurations and templates from DB
  useEffect(() => {
    Promise.all([
      feedApi.getConfigurations(),
      supabase.from('tasks_templates').select('*').eq('active', true)
    ]).then(([feedConfigs, templatesRes]) => {
      setConfigs(feedConfigs);
      setTemplates(templatesRes.data || []);
    }).catch(err => console.error("[NotificationScheduler] Fetch error:", err));
  }, []);

  // Filter for active batches to schedule notifications for
  const activeBatches = useMemo(() => batches?.filter(b => b.status === 'active') || [], [batches]);

  // 3. Main Scheduling Logic
  useEffect(() => {
    if (activeBatches.length === 0 || (configs.length === 0 && templates.length === 0)) return;

    const now = new Date();
    const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = getLocalISODate();

    activeBatches.forEach((batch) => {
      // Find group for this batch
      const group = groups.find(g => g.id === batch.groupId);
      if (!group) return;

      // Normalize type for configuration matching
      let type = (group.type || '').toLowerCase();
      if (type.includes('prod') || type.includes('postura')) type = 'production';
      else if (type.includes('macho')) type = 'males';
      else if (type.includes('reprod') || type.includes('matriz')) type = 'breeders';

      const scheduleOrAdd = (timeStr: string, taskType: string, title: string) => {
        if (!timeStr || !timeStr.includes(':')) return;

        const actionUrl = `/tasks/execute?batchId=${batch.id}&lockTask=${taskType}&time=${timeStr}`;

        // 1. Add to Checklist (Todos) for TODAY if not exists (Upcoming visibility)
        const existsInTodos = todos.some(t => t.task === title && t.dueDate === today);
        if (!existsInTodos) {
          console.log(`[NotificationScheduler] New daily task added to checklist: ${title}`);
          addTodo(title, today, true);
        }

        // 2. Alert/Pending Logic: Trigger if time has passed OR is reached
        const checkTrigger = () => {
          const isDone = todos.find(t => t.task === title && t.dueDate === today)?.isCompleted;
          if (isDone) return; // Skip if already completed

          const isAlreadyPending = pendingTasks.some(t => t.title === title && getLocalISODate(new Date(t.timestamp)) === today);

          if (!isAlreadyPending) {
            console.log(`[NotificationScheduler] Triggering alert for: ${title}`);
            addPendingTask(title, actionUrl);
          }
        };

        // 2a. Catch-up (if time passed today)
        if (timeStr <= currentHHmm) {
          checkTrigger();
        }

        // 2b. Live Scheduling (using timeout)
        const [h, m] = timeStr.split(':').map(Number);
        scheduleRoutine(h, m || 0, title, actionUrl, () => {
          checkTrigger();
        });
      };

      // Source A: Feed Configurations
      const config = configs.find(c => c.group_type === type && c.active);
      if (config) {
        config.schedule_times.forEach(time => {
          scheduleOrAdd(time, "feed", `Alimentar ${batch.name} (${group.name}) 🌾`);
        });
      }

      // Source B: Generic Task Templates
      const relevantTemplates = templates.filter(tmpl => {
        if (!tmpl.category_id) return true; // Global
        return tmpl.category_id === batch.categoryId;
      });

      relevantTemplates.forEach(tmpl => {
        scheduleOrAdd(tmpl.default_time, tmpl.task_type || 'custom', `${tmpl.title} - ${batch.name} 📋`);
      });
    });
  }, [activeBatches, groups, configs, templates, user?.id]);

  // 4. Handle Browser Notifications (Visual/Audio)
  useEffect(() => {
    const count = pendingTasks.length;
    const prev = prevPendingCount.current;

    if (count > prev) {
      const task = pendingTasks[count - 1]; // Only notify the latest one
      sendNotification(task.title, { body: "Tarefa diária agendada aguardando você." }, task.actionUrl);
    }

    prevPendingCount.current = count;
  }, [pendingTasks, sendNotification]);

  return null;
}
