import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
  getCourse,
  getCourseLessons,
  createLesson,
  getLessonTasks,
  createTask,
} from "../api/teacher";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CourseLessonsEditorPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState(null);

  const [lessonForm] = Form.useForm();
  const [taskForm] = Form.useForm();

  // Загружаем данные курса
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCourse(true);
        const data = await getCourse(courseId);
        setCourse(data);
      } catch (e) {
        console.error(e);
        setError("Не удалось загрузить данные курса.");
      } finally {
        setLoadingCourse(false);
      }

      setLoadingLessons(true);
      try {
        const list = await getCourseLessons(courseId);
        setLessons(list);
      } catch (e) {
        console.error(e);
        setError("Не удалось загрузить уроки.");
      } finally {
        setLoadingLessons(false);
      }
    };

    load();
  }, [courseId]);

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
      setError("Не удалось загрузить тестовые задания для урока.");
    } finally {
      setLoadingTasks(false);
    }
  };

  const onCreateLesson = async (values) => {
    setError(null);
    try {
      const newLesson = await createLesson(courseId, {
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
      setError("Сначала выберите урок слева.");
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
      setError("Ошибка при создании тестового задания.");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/teacher/courses">← Назад к списку курсов</Link>
      </div>

      {loadingCourse ? (
        <div style={{ textAlign: "center", marginTop: 64 }}>
          <Spin size="large" />
        </div>
      ) : !course ? (
        <Alert
          type="error"
          message={error || "Курс не найден."}
          showIcon
        />
      ) : (
        <>
          <Title level={2}>{course.title}</Title>
          {course.description && (
            <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
              {course.description}
            </Text>
          )}

          {error && (
            <Alert
              type="error"
              message={error}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Row gutter={16}>
            {/* Левая колонка: уроки + создание урока */}
            <Col span={10}>
              <Card
                title="Уроки курса"
                style={{ marginBottom: 16 }}
                extra={loadingLessons && <Spin size="small" />}
              >
                {lessons.length === 0 && !loadingLessons ? (
                  <Text type="secondary">
                    В курсе пока нет уроков. Добавьте первый урок ниже.
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
                            lesson.content && lesson.content.slice(0, 80)
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>

              <Card title="Добавить урок">
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
                  <Form.Item label="Содержимое урока" name="content">
                    <TextArea rows={4} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                      Создать урок
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            {/* Правая колонка: тестовые задания выбранного урока */}
            <Col span={14}>
              <Card
                title={
                  selectedLesson
                    ? `Тест к уроку: ${selectedLesson.title}`
                    : "Тестовые задания"
                }
                style={{ marginBottom: 16 }}
                extra={
                  selectedLesson && loadingTasks && <Spin size="small" />
                }
              >
                {!selectedLesson ? (
                  <Text type="secondary">
                    Выберите урок слева, чтобы просмотреть или добавить тест.
                  </Text>
                ) : tasks.length === 0 && !loadingTasks ? (
                  <Text type="secondary">
                    У этого урока пока нет теста. Вы можете добавить задания ниже —
                    тест не обязателен, урок может быть и без него.
                  </Text>
                ) : (
                  <List
                    dataSource={tasks}
                    renderItem={(task) => (
                      <List.Item>
                        <List.Item.Meta
                          title={task.title}
                          description={task.body && task.body.slice(0, 120)}
                        />
                        {task.has_autocheck && (
                          <Text type="success">Автопроверка</Text>
                        )}
                      </List.Item>
                    )}
                  />
                )}
              </Card>

              <Card title="Добавить тестовое задание">
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
                      Добавить задание
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
