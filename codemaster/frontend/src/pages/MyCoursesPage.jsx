import { useEffect, useState } from "react";
import { getMyCourses } from "../api/progress";
import {
  Card,
  List,
  Typography,
  Progress,
  Alert,
  Spin,
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
      <Title level={2}>Мои курсы</Title>

      {courses.length === 0 ? (
        <Text>Вы пока не начали ни один курс.</Text>
      ) : (
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={courses}
          style={{ marginTop: 16 }}
          renderItem={(c) => {
            // пока нет общего числа уроков/задач — просто показываем прогресс-бар как заглушку
            const totalUnits =
              c.lessons_completed + c.tasks_completed || 1;
            const progressPercent = Math.min(
              100,
              (totalUnits / totalUnits) * 100,
            );

            return (
              <List.Item>
                <Card title={c.course_title} bordered={false}>
                  {c.course_description && (
                    <Text type="secondary">
                      {c.course_description}
                    </Text>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <Text style={{ display: "block", marginBottom: 4 }}>
                      Уроков завершено:{" "}
                      <b>{c.lessons_completed}</b>
                    </Text>
                    <Text style={{ display: "block", marginBottom: 4 }}>
                      Заданий выполнено:{" "}
                      <b>{c.tasks_completed}</b>
                    </Text>
                    <Text style={{ display: "block", marginBottom: 8 }}>
                      Средний балл:{" "}
                      <b>{c.score_avg?.toFixed(2)}</b>
                    </Text>
                    <Progress percent={progressPercent} />
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
