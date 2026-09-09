import { useEffect, useState } from 'react';

const STORAGE_KEY = 'notificationsEnabled';

function useNotificationsEnabled() {
  const [enabled, setEnabled] = useState<boolean>(
    localStorage.getItem(STORAGE_KEY) !== 'false'
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, [enabled]);

  return { enabled, toggleEnabled: () => setEnabled((prev) => !prev) };
}

export default useNotificationsEnabled;
