import { useEffect, useState } from 'react';
import {
  getSessionsByGroupId,
  addSession,
  updateSession,
  deleteSession,
  type LessonSession,
} from '../api/lessonApi';

type SessionInput = Omit<LessonSession, 'id'>;

type UseLessonSessionsParams = {
  groupId: string | undefined;
  // فقط وقتی گروه لود شده و کاربر بهش دسترسی داره جلسات رو بگیر
  enabled: boolean;
};

function useLessonSessions({ groupId, enabled }: UseLessonSessionsParams) {
  const [sessions, setSessions] = useState<LessonSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<LessonSession | null>(
    null
  );

  useEffect(() => {
    if (!groupId || !enabled) return;
    setLoading(true);
    getSessionsByGroupId(groupId)
      .then((data) => {
        setSessions(data);
        setActiveSession(data[0] ?? null);
      })
      .catch(() => setError('دریافت جلسات با خطا مواجه شد'))
      .finally(() => setLoading(false));
  }, [groupId, enabled]);

  async function addItem(input: SessionInput): Promise<LessonSession | undefined> {
    try {
      const created = await addSession(input);
      setSessions((prev) => [...prev, created]);
      return created;
    } catch {
      setError('ذخیره جلسه با خطا مواجه شد');
      return undefined;
    }
  }

  async function updateItem(
    id: string,
    input: SessionInput
  ): Promise<LessonSession | undefined> {
    try {
      const updated = await updateSession(id, input);
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    } catch {
      setError('ذخیره جلسه با خطا مواجه شد');
      return undefined;
    }
  }

  async function deleteItem(id: string) {
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setActiveSession((prev) => (prev?.id === id ? null : prev));
    } catch {
      setError('حذف جلسه با خطا مواجه شد');
    }
  }

  return {
    sessions,
    loading,
    error,
    clearError: () => setError(null),
    activeSession,
    setActiveSession,
    addItem,
    updateItem,
    deleteItem,
  };
}

export default useLessonSessions;