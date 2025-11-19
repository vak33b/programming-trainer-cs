import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";
import TeacherHomePage from "./pages/TeacherHomePage";
import CourseEditorPage from "./pages/CourseEditorPage";
import TeacherRoute from "./components/TeacherRoute";
import TeacherCoursesPage from "./pages/TeacherCoursesPage";
import CourseLessonsEditorPage from "./pages/CourseLessonsEditorPage";


import LoginPage from "./pages/LoginPage";
import MyCoursesPage from "./pages/MyCoursesPage";

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MyCoursesPage />
          </ProtectedRoute>
        }
      />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/my-courses"
        element={
          <ProtectedRoute>
            <MyCoursesPage />
          </ProtectedRoute>
        }
      />

      {/* Панель преподавателя */}
      <Route
        path="/teacher"
        element={
          <TeacherRoute>
            <TeacherHomePage />
          </TeacherRoute>
        }
      />
      <Route
        path="/teacher/courses"
        element={
          <TeacherRoute>
            <TeacherCoursesPage />
          </TeacherRoute>
        }
      />
      <Route
        path="/teacher/courses/:courseId"
        element={
          <TeacherRoute>
            <CourseLessonsEditorPage />
          </TeacherRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}




export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <AppRoutes />
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
