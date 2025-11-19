import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spin, Typography } from "antd";

const { Text } = Typography;

export default function TeacherRoute({ children }) {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div style={{ textAlign: "center", marginTop: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user.is_teacher) {
    return (
      <div style={{ marginTop: 32 }}>
        <Text type="danger">
          Доступ к этой странице есть только у преподавателей.
        </Text>
      </div>
    );
  }

  return children;
}
