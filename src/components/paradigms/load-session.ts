/**
 * Separate chunks. Lesson routes call these only after the server boolean is true,
 * so the tables are not in the ordinary lesson bundle.
 */
export function loadParadigmLessonSession() {
  return import("@/components/paradigms/lesson-session");
}

export function loadParadigmsHome() {
  return import("@/components/paradigms/paradigms-home");
}
