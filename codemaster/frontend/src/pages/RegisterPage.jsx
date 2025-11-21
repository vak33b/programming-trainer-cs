import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Alert,
  Typography,
  Radio,
} from "antd";
import { registerUser } from "../api/auth";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const payload = {
        email: values.email,
        password: values.password,
        full_name: values.full_name || null,
        // Радиокнопки возвращают true / false
        is_teacher: values.is_teacher === true,
      };

      await registerUser(payload);
      setSuccessMsg("Аккаунт успешно создан. Теперь вы можете войти.");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (e) {
      console.error(e);
      const msg =
        e.response?.data?.detail ||
        "Ошибка регистрации. Проверьте введённые данные.";
      setError(msg);
    } finally {
      setLoading(false);
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
      <Card style={{ width: 450 }} bordered={false}>
        <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
          Регистрация в Bereza TRPS
        </Title>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {successMsg && (
          <Alert
            type="success"
            message={successMsg}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Введите email" },
              { type: "email", message: "Некорректный email" },
            ]}
          >
            <Input placeholder="you@example.com" />
          </Form.Item>

          <Form.Item label="Имя (опционально)" name="full_name">
            <Input placeholder="Иван Иванов" />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={[
              { required: true, message: "Введите пароль" },
              { min: 6, message: "Минимум 6 символов" },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Подтверждение пароля"
            name="password2"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Повторите пароль" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Пароли не совпадают"),
                  );
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Роль"
            name="is_teacher"
            initialValue={false}
          >
            <Radio.Group>
              <Radio value={false}>Студент</Radio>
              <Radio value={true}>Преподаватель</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
            >
              Зарегистрироваться
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 8, textAlign: "center" }}>
          <Text type="secondary">
            Уже есть аккаунт?{" "}
            <Link to="/login">Войти</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
