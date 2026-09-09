import { useEffect, useState } from 'react';
import { getGroups, type Group } from '../api/groupApi';
import { getCurrentUser } from '../api/authApi';

// گروه‌های مرتبط با کاربر فعلی رو برمی‌گردونه:
// SuperAdmin همه‌ی گروه‌ها رو می‌بینه، Instructor فقط گروه‌های خودش،
// Student فقط گروه‌هایی که توشون عضوه
function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getGroups().then((data) => {
      setGroups(data);
      setLoading(false);
    });
  }, []);

  const currentUser = getCurrentUser();

  const visibleGroups = !currentUser
    ? []
    : currentUser.role === 'SuperAdmin'
    ? groups
    : currentUser.role === 'Instructor'
    ? groups.filter((g) => g.instructorId === currentUser.id)
    : groups.filter((g) => g.studentIds.includes(currentUser.id));

  const visibleGroupIds = visibleGroups.map((g) => g.id);

  return { groups, visibleGroups, visibleGroupIds, loading, currentUser };
}

export default useGroups;
