import api from "./client";

// Получить все курсы
export async function getAllCourses() {
  const response = await api.get("/courses");
  return response.data;
}

// Получить уроки курса
export async function getCourseLessons(courseId) {
  const response = await api.get("/lessons", {
    params: { course_id: courseId },
  });
  return response.data;
}

// Получить урок по id
export async function getLesson(lessonId) {
  const response = await api.get(`/lessons/${lessonId}`);
  return response.data;
}

// Получить задачи урока
export async function getLessonTasks(lessonId) {
  const response = await api.get("/tasks", {
    params: { lesson_id: lessonId },
  });
  return response.data;
}

// Получить задачу по id
export async function getTask(taskId) {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
}

