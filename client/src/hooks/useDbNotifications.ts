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
        fetchNotifications();
    }, [user?.id]);

    return {
        notifications,
        loading,
        fetchNotifications,
        markAsRead
    };
}
