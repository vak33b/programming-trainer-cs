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
  Radio,
  Space,
  Divider,
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
      // Формируем массив вариантов ответов
      const options = [
        { text: values.option1, is_correct: values.correct_option === 1 },
        { text: values.option2, is_correct: values.correct_option === 2 },
        { text: values.option3, is_correct: values.correct_option === 3 },
        { text: values.option4, is_correct: values.correct_option === 4 },
      ];

      // Проверяем, что все варианты заполнены
      if (!options.every(opt => opt.text && opt.text.trim())) {
        setError("Все 4 варианта ответа должны быть заполнены.");
        return;
      }

      // Проверяем, что выбран правильный ответ
      if (!values.correct_option) {
        setError("Выберите правильный вариант ответа.");
        return;
      }

      const newTask = await createTask(selectedLesson.id, {
        title: values.title,
        body: values.body,
        options: options,
      });
      setTasks((prev) => [...prev, newTask]);
      taskForm.resetFields();
    } catch (e) {
      console.error(e);
      const errorMessage = e.response?.data?.detail || "Ошибка при создании тестового задания.";
      setError(errorMessage);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", gap: 16 }}>
        <Link to="/teacher/courses">← Назад к списку курсов</Link>
        <Link to="/teacher">← На панель преподавателя</Link>
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
                        <div style={{ width: "100%" }}>
                          <List.Item.Meta
                            title={
                              <Space>
                                {task.title}
                                {task.has_autocheck && (
                                  <Text type="success" style={{ fontSize: 12 }}>
                                    ✓ Автопроверка
                                  </Text>
                                )}
                              </Space>
                            }
                            description={
                              <div>
                                {task.body && (
                                  <Text style={{ display: "block", marginBottom: 8 }}>
                                    {task.body}
                                  </Text>
                                )}
                                {task.options && task.options.length > 0 && (
                                  <div>
                                    <Text strong style={{ display: "block", marginBottom: 4 }}>
                                      Варианты ответов:
                                    </Text>
                                    {task.options.map((opt, idx) => (
                                      <Text
                                        key={opt.id}
                                        style={{
                                          display: "block",
                                          marginLeft: 16,
                                          color: opt.is_correct ? "#52c41a" : undefined,
                                        }}
                                      >
                                        {idx + 1}. {opt.text}
                                        {opt.is_correct && " ✓"}
                                      </Text>
                                    ))}
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </div>
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
                    <TextArea rows={4} placeholder="Вопрос к заданию" />
                  </Form.Item>
                  
                  <Divider>Варианты ответов (4 варианта)</Divider>
                  
                  <Form.Item
                    label="Вариант 1"
                    name="option1"
                    rules={[
                      { required: true, message: "Введите вариант ответа" },
                    ]}
                  >
                    <Input placeholder="Текст первого варианта" />
                  </Form.Item>
                  
                  <Form.Item
                    label="Вариант 2"
                    name="option2"
                    rules={[
                      { required: true, message: "Введите вариант ответа" },
                    ]}
                  >
                    <Input placeholder="Текст второго варианта" />
                  </Form.Item>
                  
                  <Form.Item
                    label="Вариант 3"
                    name="option3"
                    rules={[
                      { required: true, message: "Введите вариант ответа" },
                    ]}
                  >
                    <Input placeholder="Текст третьего варианта" />
                  </Form.Item>
                  
                  <Form.Item
                    label="Вариант 4"
                    name="option4"
                    rules={[
                      { required: true, message: "Введите вариант ответа" },
                    ]}
                  >
                    <Input placeholder="Текст четвертого варианта" />
                  </Form.Item>
                  
                  <Form.Item
                    label="Правильный ответ"
                    name="correct_option"
                    rules={[
                      { required: true, message: "Выберите правильный вариант" },
                    ]}
                  >
                    <Radio.Group>
                      <Space direction="vertical">
                        <Radio value={1}>Вариант 1</Radio>
                        <Radio value={2}>Вариант 2</Radio>
                        <Radio value={3}>Вариант 3</Radio>
                        <Radio value={4}>Вариант 4</Radio>
                      </Space>
                    </Radio.Group>
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
