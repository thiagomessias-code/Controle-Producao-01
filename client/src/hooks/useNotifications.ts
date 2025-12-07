import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export const useNotifications = () => {
    const [, setLocation] = useLocation();
    const [permission, setPermission] = useState<NotificationPermission>("default");

    useEffect(() => {
        if ("Notification" in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if ("Notification" in window) {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result;
        }
        return "denied";
    };

    const sendNotification = async (title: string, options?: NotificationOptions, actionUrl?: string) => {
        if (permission === "granted") {
            // Try to use Service Worker first
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                if (registration) {
                    registration.showNotification(title, {
                        icon: "/vite.svg",
                        data: { url: actionUrl }, // Pass URL in data for SW
                        ...options,
                    });

                    // Play sound manually as SW doesn't play it automatically
                    const audio = new Audio("/notification.mp3");
                    audio.play().catch(() => { });
                    return;
                }
            }

            // Fallback to standard Notification API
            const notification = new Notification(title, {
                icon: "/vite.svg",
                ...options,
            });

            const audio = new Audio("/notification.mp3");
            audio.play().catch(() => { });

            notification.onclick = () => {
                window.focus();
                notification.close();
                if (actionUrl) {
                    setLocation(actionUrl);
                }
            };
        }
    };

    const scheduleRoutine = (hour: number, minute: number, title: string, actionUrl: string, onTrigger?: () => void) => {
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hour, minute, 0, 0);

        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const delay = scheduledTime.getTime() - now.getTime();

        const timer = setTimeout(() => {
            if (onTrigger) {
                onTrigger();
            } else {
                sendNotification(title, { body: "Hora da rotina!" }, actionUrl);
            }
            // Reschedule for next day
            scheduleRoutine(hour, minute, title, actionUrl, onTrigger);
        }, delay);

        return timer;
    };

    return {
        permission,
        requestPermission,
        sendNotification,
        scheduleRoutine,
    };
};
