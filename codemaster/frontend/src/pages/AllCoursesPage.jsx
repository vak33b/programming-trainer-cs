import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllCourses } from "../api/courses";
import { enrollInCourse } from "../api/progress";
import {
  Card,
  List,
  Typography,
  Alert,
  Spin,
  Button,
  Tag,
  message,
} from "antd";
import { BookOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function AllCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllCourses();
        setCourses(data);
      } catch (e) {
        console.error(e);
        setError("Не удалось загрузить список курсов");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleEnroll = async (courseId) => {
    setEnrolling((prev) => ({ ...prev, [courseId]: true }));
    try {
      await enrollInCourse(courseId);
      message.success("Вы успешно записались на курс!");
      // Обновляем список курсов
      const data = await getAllCourses();
      setCourses(data);
    } catch (e) {
      console.error(e);
      const errorMessage =
        e.response?.data?.detail || "Ошибка при записи на курс";
      message.error(errorMessage);
    } finally {
      setEnrolling((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message={error}
        showIcon
        style={{ marginTop: 24 }}
      />
    );
  }

  return (
    <div>
      <Title level={2}>Все курсы</Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Просмотрите все доступные курсы и запишитесь на те, которые вас
        интересуют
      </Paragraph>

      {courses.length === 0 ? (
        <Text>Пока нет доступных курсов.</Text>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
          dataSource={courses}
          renderItem={(course) => (
            <List.Item>
              <Card
                hoverable
                style={{ height: "100%" }}
                actions={[
                  course.is_enrolled ? (
                    <Link to={`/courses/${course.id}`}>
                      <Button type="primary" icon={<BookOutlined />}>
                        Продолжить обучение
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      type="primary"
                      loading={enrolling[course.id]}
                      onClick={() => handleEnroll(course.id)}
                    >
                      Записаться на курс
                    </Button>
                  ),
                ]}
              >
                <Card.Meta
                  title={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{course.title}</span>
                      {course.is_enrolled && (
                        <Tag
                          icon={<CheckCircleOutlined />}
                          color="success"
                        >
                          Вы записаны
                        </Tag>
                      )}
                    </div>
                  }
                  description={
                    <div>
                      {course.description ? (
                        <Paragraph
                          ellipsis={{ rows: 3, expandable: false }}
                          style={{ marginBottom: 0 }}
                        >
                          {course.description}
                        </Paragraph>
                      ) : (
                        <Text type="secondary">Описание отсутствует</Text>
                      )}
                    </div>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}

