import useGroups from './useGroups';

// یه آیتم (آزمون یا جلسه‌ی درس) رو فقط وقتی نشون می‌ده که حداقل با یکی از
// گروه‌های قابل‌مشاهده‌ی کاربر فعلی هم‌پوشانی داشته باشه. SuperAdmin همه‌چی
// رو می‌بینه، بدون فیلتر.
function useScope<T>(items: T[], getGroupIds: (item: T) => string[]) {
  const { visibleGroupIds, currentUser } = useGroups();

  let visibleItems = items;

  if (currentUser?.role === 'Instructor' || currentUser?.role === 'Student') {
    visibleItems = items.filter((item) =>
      getGroupIds(item).some((groupId) => visibleGroupIds.includes(groupId))
    );
  }

  return { currentUser, visibleItems };
}

export default useScope;
