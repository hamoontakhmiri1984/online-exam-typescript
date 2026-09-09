import { useCallback, useEffect, useState } from 'react';
import { getCurrentUser } from '../api/authApi';
import {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from '../api/notificationApi';

// جای state داخلی AppLayout رو می‌گیره - از api/notificationApi.ts (که خودش
// تو localStorage پرسیستشون می‌کنه) می‌خونه، پس با تعویض صفحه یا رفرش،
// وضعیت خونده/نخونده از دست نمی‌ره
function useNotifications() {
  const currentUser = getCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(() => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getNotificationsForUser(currentUser.id, currentUser.role).then((data) => {
      setNotifications(data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markOneRead(id: string) {
    markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllRead() {
    markAllNotificationsRead(notifications.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return {
    notifications,
    unreadCount,
    loading,
    markOneRead,
    markAllRead,
    refresh: load,
  };
}

export default useNotifications;
