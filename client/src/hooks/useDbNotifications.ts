import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from './useAuth';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function useDbNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('notificacoes')
                .select('*')
                .eq('usuario_id', user.id)
                .eq('lida', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching db notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const subscribeToPush = useCallback(async () => {
        if (!user?.id || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                console.warn('VITE_VAPID_PUBLIC_KEY not found in .env');
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            const { endpoint, keys } = subscription.toJSON();
            if (!endpoint || !keys) return;

            // Sync with Supabase
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    usuario_id: user.id,
                    endpoint: endpoint,
                    p256dh: keys.p256dh,
                    auth: keys.auth,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'endpoint' });

            if (error) throw error;
            console.log('Push subscription synced with database');
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
        }
    }, [user?.id]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            const { error } = await supabase
                .from('notificacoes')
                .update({ lida: true })
                .eq('id', id);

            if (error) throw error;
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, []);

    useEffect(() => {
        if (!user?.id) return;

        // Request browser notification permission
        if (typeof Notification !== 'undefined') {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        subscribeToPush();
                    }
                });
            } else if (Notification.permission === 'granted') {
                subscribeToPush();
            }
        }

        fetchNotifications();

        // Subscribe to real-time notifications
        const channel = supabase
            .channel(`public:notificacoes:usuario_id=eq.${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notificacoes',
                    filter: `usuario_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Real-time notification received:', payload.new);
                    setNotifications(prev => [payload.new, ...prev]);

                    // 1. Show Toast (Immediate feedback in UI)
                    const message = payload.new.mensagem || 'Você recebeu uma nova mensagem.';
                    import('sonner').then(({ toast }) => {
                        toast.info('🔔 ' + message, {
                            duration: 5000,
                            position: 'top-right'
                        });
                    }).catch(() => { });

                    // 2. Browser Notification
                    if (typeof Notification !== 'undefined') {
                        const showNotification = (title: string, opts: any) => {
                            if ('serviceWorker' in navigator) {
                                navigator.serviceWorker.ready.then(reg => {
                                    reg.showNotification(title, opts);
                                }).catch(() => {
                                    new Notification(title, opts);
                                });
                            } else {
                                new Notification(title, opts);
                            }
                        };

                        if (Notification.permission === 'granted') {
                            showNotification('Nova Notificação', {
                                body: message,
                                icon: '/logo.jpg',
                                badge: '/logo.jpg',
                                vibrate: [200, 100, 200],
                                tag: 'new-notif',
                                renotify: true
                            });
                        } else if (Notification.permission !== 'denied') {
                            Notification.requestPermission().then(p => {
                                if (p === 'granted') showNotification('Nova Notificação', { body: message });
                            });
                        }
                    }

                    // 3. Play sound & Vibrate
                    try {
                        // Vibration
                        if ('vibrate' in navigator) {
                            navigator.vibrate([200, 100, 200]);
                        }

                        // Sound
                        const audio = new Audio('/notification.mp3');
                        audio.volume = 1.0;
                        audio.play().catch(e => {
                            console.warn('Audio blocked by browser policy:', e);
                        });
                    } catch (e) {
                        console.error('Audio/Vibrate error:', e);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, fetchNotifications, subscribeToPush]);

    return {
        notifications,
        loading,
        fetchNotifications,
        markAsRead
    };
}
