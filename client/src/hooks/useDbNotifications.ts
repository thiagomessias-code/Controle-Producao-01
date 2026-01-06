import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from './useAuth';

export function useDbNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
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
    };

    const markAsRead = async (id: string) => {
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
    };

    useEffect(() => {
        if (!user?.id) return;

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

                    // Play sound
                    try {
                        const audio = new Audio('/notification.mp3');
                        audio.play().catch(e => {
                            console.warn('Audio playback failed (browser policy?):', e);
                        });
                    } catch (e) {
                        console.error('Failed to create Audio object:', e);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    return {
        notifications,
        loading,
        fetchNotifications,
        markAsRead
    };
}
