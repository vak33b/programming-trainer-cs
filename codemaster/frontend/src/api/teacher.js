import api from "./client";

// Список студентов с прогрессом по всем курсам преподавателя
export async function getStudentsProgress() {
  const res = await api.get("/teacher/students-progress");
  return res.data;
}

// Курсы текущего преподавателя
export async function getTeacherCourses() {
  const res = await api.get("/teacher/courses");
  return res.data;
}

// Создать курс
export async function createCourse(payload) {
  // { title, description }
  const res = await api.post("/teacher/courses", payload);
  return res.data;
}

// Уроки выбранного курса
export async function getCourseLessons(courseId) {
  const res = await api.get(`/teacher/courses/${courseId}/lessons`);
  return res.data;
}

// Создать урок
export async function createLesson(courseId, payload) {
  // { title, content }
  const res = await api.post(`/teacher/courses/${courseId}/lessons`, payload);
  return res.data;
}

// Задания выбранного урока
export async function getLessonTasks(lessonId) {
  const res = await api.get(`/teacher/lessons/${lessonId}/tasks`);
  return res.data;
}

// Создать задание
export async function createTask(lessonId, payload) {
  // { title, body, has_autocheck }
  const res = await api.post(`/teacher/lessons/${lessonId}/tasks`, payload);
  return res.data;
}

export async function getCourse(courseId) {
  const res = await api.get(`/teacher/courses/${courseId}`);
  return res.data;
}
