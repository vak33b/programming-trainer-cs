import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  List,
  Typography,
  Form,
  Input,
  Button,
  Alert,
  Spin,
  Switch,
} from "antd";
import {
  getTeacherCourses,
  createCourse,
  getCourseLessons,
  createLesson,
  getLessonTasks,
  createTask,
} from "../api/teacher";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CourseEditorPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [error, setError] = useState(null);

  const [courseForm] = Form.useForm();
  const [lessonForm] = Form.useForm();
  const [taskForm] = Form.useForm();

  // Загрузка курсов при входе
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

  const handleSelectCourse = async (course) => {
    setSelectedCourse(course);
    setSelectedLesson(null);
    setTasks([]);
    setLessons([]);
    setError(null);

    setLoadingLessons(true);
    try {
      const data = await getCourseLessons(course.id);
      setLessons(data);
    } catch (e) {
      console.error(e);
      setError("Не удалось загрузить уроки.");
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleSelectLesson = async (lesson) => {
    setSelectedLesson(lesson);
    setTasks([]);
    setError(null);

    setLoadingTasks(true);
    try {
      const data = await getLessonTasks(lesson.id);
      setTasks(data);
    } catch (e) {
      console.error(e);
      setError("Не удалось загрузить задания.");
    } finally {
      setLoadingTasks(false);
    }
  };

  const onCreateCourse = async (values) => {
    setError(null);
    try {
      const newCourse = await createCourse({
        title: values.title,
        description: values.description,
      });
      setCourses((prev) => [...prev, newCourse]);
      courseForm.resetFields();
    } catch (e) {
      console.error(e);
      setError("Ошибка при создании курса.");
    }
  };

  const onCreateLesson = async (values) => {
    if (!selectedCourse) {
      setError("Сначала выберите курс.");
      return;
    }
    setError(null);
    try {
      const newLesson = await createLesson(selectedCourse.id, {
        title: values.title,
        content: values.content,
      });
      setLessons((prev) => [...prev, newLesson]);
      lessonForm.resetFields();
    } catch (e) {
      console.error(e);
      setError("Ошибка при создании урока.");
    }
  };

  const onCreateTask = async (values) => {
    if (!selectedLesson) {
      setError("Сначала выберите урок.");
      return;
    }
    setError(null);
    try {
      const newTask = await createTask(selectedLesson.id, {
        title: values.title,
        body: values.body,
        has_autocheck: values.has_autocheck || false,
      });
      setTasks((prev) => [...prev, newTask]);
      taskForm.resetFields();
    } catch (e) {
      console.error(e);
      setError("Ошибка при создании задания.");
    }
  };

  return (
    <div>
      <Title level={2}>Редактор курсов</Title>

      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16}>
        {/* 1 колонка: Курсы */}
        <Col span={8}>
          <Card
            title="Мои курсы"
            style={{ marginBottom: 16 }}
            extra={
              loadingCourses && <Spin size="small" />
            }
          >
            {courses.length === 0 && !loadingCourses ? (
              <Text type="secondary">
                У вас пока нет курсов. Создайте первый курс ниже.
              </Text>
            ) : (
              <List
                dataSource={courses}
                renderItem={(course) => (
                  <List.Item
                    onClick={() => handleSelectCourse(course)}
                    style={{
                      cursor: "pointer",
                      background:
                        selectedCourse?.id === course.id
                          ? "#e6f7ff"
                          : "transparent",
                    }}
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

          <Card title="Создать курс">
            <Form
              layout="vertical"
              form={courseForm}
              onFinish={onCreateCourse}
            >
              <Form.Item
                label="Название курса"
                name="title"
                rules={[
                  { required: true, message: "Введите название курса" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item label="Описание" name="description">
                <TextArea rows={3} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Создать курс
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 2 колонка: Уроки */}
        <Col span={8}>
          <Card
            title={
              selectedCourse
                ? `Уроки курса: ${selectedCourse.title}`
                : "Уроки"
            }
            style={{ marginBottom: 16 }}
            extra={
              loadingLessons && <Spin size="small" />
            }
          >
            {!selectedCourse ? (
              <Text type="secondary">
                Выберите курс слева, чтобы посмотреть уроки.
              </Text>
            ) : lessons.length === 0 ? (
              <Text type="secondary">
                В этом курсе пока нет уроков.
              </Text>
            ) : (
              <List
                dataSource={lessons}
                renderItem={(lesson) => (
                  <List.Item
                    onClick={() => handleSelectLesson(lesson)}
                    style={{
                      cursor: "pointer",
                      background:
                        selectedLesson?.id === lesson.id
                          ? "#e6f7ff"
                          : "transparent",
                    }}
                  >
                    <List.Item.Meta
                      title={lesson.title}
                      description={
                        lesson.content &&
                        lesson.content.slice(0, 80)
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card title="Создать урок">
            <Form
              layout="vertical"
              form={lessonForm}
              onFinish={onCreateLesson}
            >
              <Form.Item
                label="Название урока"
                name="title"
                rules={[
                  { required: true, message: "Введите название урока" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item label="Содержимое" name="content">
                <TextArea rows={4} />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  disabled={!selectedCourse}
                >
                  Создать урок
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 3 колонка: Задания */}
        <Col span={8}>
          <Card
            title={
              selectedLesson
                ? `Задания урока: ${selectedLesson.title}`
                : "Задания"
            }
            style={{ marginBottom: 16 }}
            extra={
              loadingTasks && <Spin size="small" />
            }
          >
            {!selectedLesson ? (
              <Text type="secondary">
                Выберите урок, чтобы посмотреть задания.
              </Text>
            ) : tasks.length === 0 ? (
              <Text type="secondary">
                В этом уроке пока нет заданий.
              </Text>
            ) : (
              <List
                dataSource={tasks}
                renderItem={(task) => (
                  <List.Item>
                    <List.Item.Meta
                      title={task.title}
                      description={
                        task.body && task.body.slice(0, 80)
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card title="Создать задание">
            <Form
              layout="vertical"
              form={taskForm}
              onFinish={onCreateTask}
            >
              <Form.Item
                label="Название задания"
                name="title"
                rules={[
                  { required: true, message: "Введите название задания" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item label="Текст задания" name="body">
                <TextArea rows={4} />
              </Form.Item>
              <Form.Item
                label="Автопроверка"
                name="has_autocheck"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  disabled={!selectedLesson}
                >
                  Создать задание
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
