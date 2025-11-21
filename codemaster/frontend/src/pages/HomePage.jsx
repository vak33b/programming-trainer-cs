import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  Typography,
  Button,
  Row,
  Col,
  Space,
  Divider,
} from "antd";
import {
  BookOutlined,
  UserOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  EditOutlined,
  RocketOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <BookOutlined style={{ fontSize: 32, color: "#1890ff" }} />,
      title: "Интерактивные курсы",
      description:
        "Создавайте и проходите курсы по программированию с уроками и практическими заданиями",
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: 32, color: "#52c41a" }} />,
      title: "Автопроверка заданий",
      description:
        "Тестовые задания с 4 вариантами ответов и автоматической проверкой результатов",
    },
    {
      icon: <BarChartOutlined style={{ fontSize: 32, color: "#722ed1" }} />,
      title: "Отслеживание прогресса",
      description:
        "Мониторинг выполнения уроков и заданий, статистика по курсам и средние баллы",
    },
    {
      icon: <EditOutlined style={{ fontSize: 32, color: "#fa8c16" }} />,
      title: "Панель преподавателя",
      description:
        "Удобный интерфейс для создания курсов, управления уроками и просмотра прогресса студентов",
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Hero секция */}
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: 12,
          marginBottom: 48,
          color: "#fff",
        }}
      >
        <RocketOutlined style={{ fontSize: 64, marginBottom: 24 }} />
        <Title level={1} style={{ color: "#fff", marginBottom: 16 }}>
          Добро пожаловать в Bereza TRPS!
        </Title>
        <Paragraph style={{ fontSize: 18, color: "#fff", maxWidth: 600, margin: "0 auto" }}>
          Платформа для обучения программированию с интерактивными курсами,
          автоматической проверкой заданий и отслеживанием прогресса
        </Paragraph>
        {!user && (
          <Space size="large" style={{ marginTop: 32 }}>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate("/register")}
              style={{ height: 48, fontSize: 16 }}
            >
              Начать обучение
            </Button>
            <Button
              size="large"
              onClick={() => navigate("/login")}
              style={{ height: 48, fontSize: 16, background: "#fff" }}
            >
              Войти
            </Button>
          </Space>
        )}
        {user && (
          <Space size="large" style={{ marginTop: 32 }}>
            {user.is_teacher ? (
              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/teacher")}
                style={{ height: 48, fontSize: 16 }}
              >
                Перейти в панель преподавателя
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/my-courses")}
                style={{ height: 48, fontSize: 16 }}
              >
                Мои курсы
              </Button>
            )}
          </Space>
        )}
      </div>

      {/* Описание функционала */}
      <Title level={2} style={{ textAlign: "center", marginBottom: 48 }}>
        Возможности платформы
      </Title>

      <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
        {features.map((feature, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              hoverable
              style={{
                height: "100%",
                textAlign: "center",
                borderRadius: 8,
              }}
            >
              <div style={{ marginBottom: 16 }}>{feature.icon}</div>
              <Title level={4}>{feature.title}</Title>
              <Text type="secondary">{feature.description}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider />

      {/* Для студентов */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 8,
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <Row gutter={24} align="middle">
          <Col xs={24} md={16}>
            <Title level={3}>
              <UserOutlined style={{ marginRight: 8 }} />
              Для студентов
            </Title>
            <Paragraph style={{ fontSize: 16 }}>
              <ul style={{ paddingLeft: 20 }}>
                <li>Просмотр и прохождение интерактивных курсов</li>
                <li>Выполнение тестовых заданий с автопроверкой</li>
                <li>Отслеживание своего прогресса по каждому курсу</li>
                <li>Просмотр статистики: завершенные уроки, выполненные задания, средний балл</li>
              </ul>
            </Paragraph>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: "center" }}>
            {!user && (
              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/register")}
              >
                Зарегистрироваться как студент
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* Для преподавателей */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 8,
          background: "linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)",
        }}
      >
        <Row gutter={24} align="middle">
          <Col xs={24} md={16}>
            <Title level={3}>
              <EditOutlined style={{ marginRight: 8 }} />
              Для преподавателей
            </Title>
            <Paragraph style={{ fontSize: 16 }}>
              <ul style={{ paddingLeft: 20 }}>
                <li>Создание и редактирование курсов</li>
                <li>Добавление уроков с теоретическим материалом</li>
                <li>Создание тестовых заданий с 4 вариантами ответов</li>
                <li>Просмотр статистики по студентам: количество приступивших, прогресс, средние баллы</li>
                <li>Мониторинг выполнения заданий в реальном времени</li>
              </ul>
            </Paragraph>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: "center" }}>
            {!user && (
              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/register")}
              >
                Зарегистрироваться как преподаватель
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* Технические детали */}
      <Card style={{ borderRadius: 8 }}>
        <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
          Технологии
        </Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Title level={5}>Frontend</Title>
              <Text>React + Vite</Text>
              <br />
              <Text type="secondary">Ant Design UI</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Title level={5}>Backend</Title>
              <Text>FastAPI (Python)</Text>
              <br />
              <Text type="secondary">SQLAlchemy ORM</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Title level={5}>База данных</Title>
              <Text>SQLite</Text>
              <br />
              <Text type="secondary">Alembic миграции</Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

