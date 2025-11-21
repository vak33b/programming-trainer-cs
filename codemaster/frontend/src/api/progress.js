import api from "./client";

export async function getMyCourses() {
  const response = await api.get("/progress/my-courses");
  return response.data;
}

// Отправить ответ на задачу с автопроверкой
export async function submitAnswer(taskId, optionId) {
  const response = await api.post(`/tasks/${taskId}/submit-answer`, {
    option_id: optionId,
  });
  return response.data;
}

// Записаться на курс
export async function enrollInCourse(courseId) {
  const response = await api.post(`/progress/courses/${courseId}/enroll`);
  return response.data;
}

// Завершить урок
export async function completeLesson(lessonId) {
  const response = await api.post(`/progress/lessons/${lessonId}/complete`);
  return response.data;
}
