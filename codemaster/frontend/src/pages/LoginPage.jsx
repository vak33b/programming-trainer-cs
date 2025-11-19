import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  Form,
  Input,
  Button,
  Alert,
  Typography,
} from "antd";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setError(null);
    const res = await login(values.email, values.password);
    if (res.success) {
      navigate("/my-courses");
    } else {
      setError(res.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: 64,
      }}
    >
      <Card style={{ width: 400 }} bordered={false}>
        <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
          Вход в Codemaster
        </Title>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          layout="vertical"
          initialValues={{
            email: "student@example.com",
            password: "secret123",
          }}
          onFinish={onFinish}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Введите email" },
              { type: "email", message: "Некорректный email" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={[
              { required: true, message: "Введите пароль" },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
            >
              Войти
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 8, textAlign: "center" }}>
          <Text type="secondary">
            Нет аккаунта?{" "}
            <Link to="/register">Зарегистрироваться</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
