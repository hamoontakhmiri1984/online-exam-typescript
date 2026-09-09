import { useEffect, useState } from 'react';

type CrudApi<T, TInput> = {
  getAll: () => Promise<T[]>;
  add: (item: TInput) => Promise<T>;
  update: (id: string, item: TInput) => Promise<T>;
  remove: (id: string) => Promise<void>;
};

function useCrud<T extends { id: string }, TInput>(api: CrudApi<T, TInput>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAll()
      .then(setItems)
      .catch(() => setError('دریافت اطلاعات با خطا مواجه شد'))
      .finally(() => setLoading(false));
  }, []);

  async function addItem(input: TInput): Promise<T | undefined> {
    try {
      const newItem = await api.add(input);
      setItems((prev) => [...prev, newItem]);
      return newItem;
    } catch {
      setError('افزودن مورد جدید با خطا مواجه شد');
      return undefined;
    }
  }

  async function updateItem(id: string, input: TInput): Promise<T | undefined> {
    try {
      const updated = await api.update(id, input);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    } catch {
      setError('ذخیره تغییرات با خطا مواجه شد');
      return undefined;
    }
  }

  async function deleteItem(id: string) {
    try {
      await api.remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError('حذف مورد با خطا مواجه شد');
    }
  }

  function patchItem(updated: T) {
    setItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  }

  return {
    items,
    loading,
    error,
    clearError: () => setError(null),
    addItem,
    updateItem,
    deleteItem,
    patchItem,
  };
}

export default useCrud;
