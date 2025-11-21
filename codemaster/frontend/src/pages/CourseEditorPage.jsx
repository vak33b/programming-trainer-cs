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
  Radio,
  Space,
  Divider,
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
      const errorMessage = e.response?.data?.detail || "Ошибка при создании задания.";
      setError(errorMessage);
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
