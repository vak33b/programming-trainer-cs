import api from "./client";

export async function getMyCourses() {
  const response = await api.get("/progress/my-courses");
  return response.data;
}
