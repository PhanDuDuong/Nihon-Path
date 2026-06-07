const STORAGE_PREFIX = "nihonpath.lessonProgress";

export function lessonProgressKey(user) {
  const identity = user?.id ?? user?.email ?? "guest";
  return `${STORAGE_PREFIX}.${identity}`;
}

export function loadCompletedLessons(user) {
  if (!user || typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(lessonProgressKey(user));
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isLessonCompleted(user, lessonId) {
  return loadCompletedLessons(user).includes(lessonId);
}

export function markLessonCompleted(user, lessonId) {
  if (!user || !lessonId || typeof localStorage === "undefined") return [];
  const next = Array.from(new Set([...loadCompletedLessons(user), lessonId]));
  localStorage.setItem(lessonProgressKey(user), JSON.stringify(next));
  window.dispatchEvent(new Event("nihonpath:lesson-progress"));
  return next;
}

export function countCompletedLessonsForPrefix(user, prefix) {
  return loadCompletedLessons(user).filter((id) => String(id).startsWith(prefix)).length;
}
