import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  List,
  Typography,
  Form,
  Input,
  Button,
  Alert,
  Spin,
} from "antd";
import { getTeacherCourses, createCourse } from "../api/teacher";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState(null);
  const [courseForm] = Form.useForm();
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadCourses = async () => {
      setLoadingCourses(true);
      try {
        const data = await getTeacherCourses();
        setCourses(data);
      } catch (e) {
        console.error(e);
        setError("Не удалось загрузить курсы.");
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  const onCreateCourse = async (values) => {
    setError(null);
    setCreating(true);
    try {
      const newCourse = await createCourse({
        title: values.title,
        description: values.description,
      });
      setCourses((prev) => [...prev, newCourse]);
      courseForm.resetFields();
      // сразу переходим на страницу редактирования уроков этого курса
      navigate(`/teacher/courses/${newCourse.id}`);
    } catch (e) {
      console.error(e);
      setError("Ошибка при создании курса.");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenCourse = (course) => {
    navigate(`/teacher/courses/${course.id}`);
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/teacher">← На панель преподавателя</Link>
      </div>
      
      <Title level={2}>Мои курсы</Title>

      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <Card
          title="Список курсов"
          style={{ flex: 2, minHeight: 200 }}
          extra={loadingCourses && <Spin size="small" />}
        >
          {loadingCourses ? (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <Spin size="large" />
            </div>
          ) : courses.length === 0 ? (
            <Text type="secondary">
              У вас пока нет курсов. Создайте первый курс справа.
            </Text>
          ) : (
            <List
              dataSource={courses}
              renderItem={(course) => (
                <List.Item
                  style={{ cursor: "pointer" }}
                  onClick={() => handleOpenCourse(course)}
                >
                  <List.Item.Meta
                    title={course.title}
                    description={course.description}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        <Card title="Создать новый курс" style={{ flex: 1 }}>
          <Form
            layout="vertical"
            form={courseForm}
            onFinish={onCreateCourse}
          >
            <Form.Item
              label="Название курса"
              name="title"
              rules={[{ required: true, message: "Введите название курса" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Описание" name="description">
              <TextArea rows={4} />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={creating}
              >
                Создать курс
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
