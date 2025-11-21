import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyCourses } from "../api/progress";
import {
  Card,
  List,
  Typography,
  Progress,
  Alert,
  Spin,
  Button,
} from "antd";

const { Title, Text } = Typography;

export default function MyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyCourses();
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Мои курсы</Title>
        <Link to="/all-courses">
          <Button type="default">Все курсы</Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
            Вы пока не начали ни один курс.
          </Text>
          <Link to="/all-courses">
            <Button type="primary">Посмотреть все курсы</Button>
          </Link>
        </div>
      ) : (
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={courses}
          style={{ marginTop: 16 }}
          renderItem={(c) => {
            // Рассчитываем процент прогресса
            const totalUnits = (c.total_lessons || 0) + (c.total_tasks || 0);
            const completedUnits = (c.lessons_completed || 0) + (c.tasks_completed || 0);
            const progressPercent = totalUnits > 0 
              ? Math.min(100, Math.round((completedUnits / totalUnits) * 100))
              : 0;

            return (
              <List.Item>
                <Card
                  title={c.course_title}
                  bordered={false}
                  extra={
                    <Link to={`/courses/${c.course_id}`}>
                      <Button type="primary">Открыть курс</Button>
                    </Link>
                  }
                >
                  {c.course_description && (
                    <Text type="secondary">
                      {c.course_description}
                    </Text>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <Text style={{ display: "block", marginBottom: 4 }}>
                      Уроков завершено:{" "}
                      <b>{c.lessons_completed}</b>
                      {c.total_lessons > 0 && ` из ${c.total_lessons}`}
                    </Text>
                    <Text style={{ display: "block", marginBottom: 4 }}>
                      Заданий выполнено:{" "}
                      <b>{c.tasks_completed}</b>
                      {c.total_tasks > 0 && ` из ${c.total_tasks}`}
                    </Text>
                    <Text style={{ display: "block", marginBottom: 8 }}>
                      Средний балл:{" "}
                      <b>{c.score_avg?.toFixed(2) || "0.00"}</b>
                    </Text>
                    <Progress 
                      percent={progressPercent} 
                      strokeColor="#52c41a"
                      showInfo={true}
                    />
                  </div>
                </Card>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
}
