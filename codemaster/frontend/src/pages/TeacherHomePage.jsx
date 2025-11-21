import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  Table,
  Typography,
  Alert,
  Spin,
  Button,
  List,
  Row,
  Col,
  Tag,
} from "antd";
import { getStudentsProgress, getTeacherCourses } from "../api/teacher";
import { EditOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function TeacherHomePage() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getStudentsProgress();
        setStudents(data);
      } catch (e) {
        console.error(e);
        setError("Не удалось загрузить список студентов.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await getTeacherCourses();
        setCourses(data);
      } catch (e) {
        console.error(e);
        setError("Не удалось загрузить список курсов.");
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  const columns = [
    {
      title: "Студент",
      dataIndex: "full_name",
      key: "full_name",
      render: (text, record) => text || record.email,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Курсов",
      dataIndex: "courses_count",
      key: "courses_count",
      width: 100,
    },
    {
      title: "Уроков завершено",
      dataIndex: "lessons_completed",
      key: "lessons_completed",
      width: 150,
    },
    {
      title: "Заданий выполнено",
      dataIndex: "tasks_completed",
      key: "tasks_completed",
      width: 160,
    },
    {
      title: "Средний балл",
      dataIndex: "score_avg",
      key: "score_avg",
      width: 130,
      render: (value) =>
        value !== null && value !== undefined ? value.toFixed(2) : "-",
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 16,
          justifyContent: "space-between",
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Панель преподавателя
        </Title>
        <Button
  type="primary"
  icon={<EditOutlined />}
  onClick={() => navigate("/teacher/courses")}
>
  Редактор курсов
</Button>

      </div>

      <Row gutter={16}>
        {/* Левая колонка: Курсы */}
        <Col span={12}>
          <Card>
            <Title level={4}>Мои курсы</Title>

            {loadingCourses ? (
              <div style={{ textAlign: "center", marginTop: 32 }}>
                <Spin size="large" />
              </div>
            ) : courses.length === 0 ? (
              <Text>У вас пока нет курсов.</Text>
            ) : (
              <List
                dataSource={courses}
                renderItem={(course) => (
                  <List.Item
                    actions={[
                      <Link to={`/teacher/courses/${course.id}`} key="edit">
                        <Button type="link">Редактировать</Button>
                      </Link>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div>
                          {course.title}
                          <Tag
                            icon={<UserOutlined />}
                            color="blue"
                            style={{ marginLeft: 8 }}
                          >
                            {course.students_count} студент
                            {course.students_count !== 1 ? "ов" : ""}
                          </Tag>
                        </div>
                      }
                      description={course.description}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* Правая колонка: Студенты и прогресс */}
        <Col span={12}>
          <Card>
            <Title level={4}>Студенты и прогресс</Title>

            {loading ? (
              <div style={{ textAlign: "center", marginTop: 32 }}>
                <Spin size="large" />
              </div>
            ) : error ? (
              <Alert
                type="error"
                message={error}
                showIcon
                style={{ marginTop: 16 }}
              />
            ) : students.length === 0 ? (
              <Text>Пока нет студентов с прогрессом по вашим курсам.</Text>
            ) : (
              <Table
                dataSource={students}
                columns={columns}
                rowKey={(record) => record.user_id}
                style={{ marginTop: 16 }}
                pagination={{ pageSize: 10 }}
                size="small"
                scroll={{ x: 600 }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
