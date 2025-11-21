import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  List,
  Typography,
  Button,
  Alert,
  Spin,
  Radio,
  Space,
  Divider,
  message,
} from "antd";
import { getCourseLessons, getLessonTasks } from "../api/courses";
import { submitAnswer, completeLesson } from "../api/progress";

const { Title, Text, Paragraph } = Typography;

export default function CoursePage() {
  const { courseId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submittedTasks, setSubmittedTasks] = useState(new Set());
  const [taskResults, setTaskResults] = useState({});
  const [completedLessons, setCompletedLessons] = useState(new Set());

  const [loadingLessons, setLoadingLessons] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoadingLessons(true);
      try {
        const data = await getCourseLessons(courseId);
        setLessons(data);
        // Загружаем информацию о завершенных уроках
        const completedIds = data
          .filter((lesson) => lesson.is_completed)
          .map((lesson) => lesson.id);
        setCompletedLessons(new Set(completedIds));
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
    setSelectedTask(null);
    setSelectedAnswers({});
    setSubmittedTasks(new Set());
    setTaskResults({});
    setError(null);

    setLoadingTasks(true);
    try {
      const data = await getLessonTasks(lesson.id);
      setTasks(data);
      
      // Восстанавливаем выбранные ответы и статус выполнения
      const restoredAnswers = {};
      const restoredSubmitted = new Set();
      const restoredResults = {};
      
      data.forEach((task) => {
        if (task.selected_option_id) {
          restoredAnswers[task.id] = task.selected_option_id;
        }
        if (task.is_completed) {
          restoredSubmitted.add(task.id);
          // Определяем, правильный ли был ответ
          const selectedOption = task.options.find(opt => opt.id === task.selected_option_id);
          if (selectedOption) {
            restoredResults[task.id] = {
              is_correct: selectedOption.is_correct,
              message: selectedOption.is_correct 
                ? "Правильный ответ! Задача отмечена как выполненная."
                : "Неправильный ответ. Попробуйте еще раз.",
            };
          }
        }
      });
      
      setSelectedAnswers(restoredAnswers);
      setSubmittedTasks(restoredSubmitted);
      setTaskResults(restoredResults);
      
      if (data.length > 0) {
        setSelectedTask(data[0]);
      }
    } catch (e) {
      console.error(e);
      setError("Не удалось загрузить задания.");
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleSelectTask = (task) => {
    setSelectedTask(task);
  };

  const handleAnswerChange = (taskId, optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [taskId]: optionId,
    }));
  };

  const handleSubmitAnswer = async (task) => {
    if (!task.has_autocheck) {
      message.warning("Это задание не поддерживает автопроверку.");
      return;
    }

    const selectedOptionId = selectedAnswers[task.id];
    if (!selectedOptionId) {
      message.warning("Выберите вариант ответа.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitAnswer(task.id, selectedOptionId);
      setTaskResults((prev) => ({
        ...prev,
        [task.id]: result,
      }));
      setSubmittedTasks((prev) => new Set([...prev, task.id]));

      if (result.is_correct) {
        message.success(result.message);
      } else {
        message.error(result.message);
      }
    } catch (e) {
      console.error(e);
      const errorMessage =
        e.response?.data?.detail || "Ошибка при отправке ответа.";
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!selectedLesson) {
      return;
    }

    setCompletingLesson(true);
    try {
      await completeLesson(selectedLesson.id);
      setCompletedLessons((prev) => new Set([...prev, selectedLesson.id]));
      message.success("Урок отмечен как завершенный!");
      // Обновляем список уроков, чтобы обновить статус
      const data = await getCourseLessons(courseId);
      setLessons(data);
    } catch (e) {
      console.error(e);
      const errorMessage =
        e.response?.data?.detail || "Ошибка при завершении урока.";
      message.error(errorMessage);
    } finally {
      setCompletingLesson(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/my-courses">← Назад к моим курсам</Link>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ display: "flex", gap: 16 }}>
        {/* Левая колонка: список уроков */}
        <div style={{ width: "30%", minWidth: 250 }}>
          <Card title="Уроки" style={{ marginBottom: 16 }}>
            {loadingLessons ? (
              <div style={{ textAlign: "center" }}>
                <Spin />
              </div>
            ) : lessons.length === 0 ? (
              <Text type="secondary">В курсе пока нет уроков.</Text>
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
                      borderRadius: 4,
                      padding: 8,
                    }}
                  >
                    <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text>{lesson.title}</Text>
                      {completedLessons.has(lesson.id) && (
                        <Text type="success" style={{ fontSize: 12 }}>✓</Text>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* Список заданий выбранного урока */}
          {selectedLesson && (
            <Card title="Задания урока">
              {loadingTasks ? (
                <div style={{ textAlign: "center" }}>
                  <Spin />
                </div>
              ) : tasks.length === 0 ? (
                <Text type="secondary">
                  В этом уроке пока нет заданий.
                </Text>
              ) : (
                <List
                  dataSource={tasks}
                  renderItem={(task) => (
                    <List.Item
                      onClick={() => handleSelectTask(task)}
                      style={{
                        cursor: "pointer",
                        background:
                          selectedTask?.id === task.id
                            ? "#e6f7ff"
                            : "transparent",
                        borderRadius: 4,
                        padding: 8,
                      }}
                    >
                      <div style={{ width: "100%" }}>
                        <Text>{task.title}</Text>
                        {task.has_autocheck && (
                          <Text
                            type="success"
                            style={{ fontSize: 11, marginLeft: 8 }}
                          >
                            ✓ Автопроверка
                          </Text>
                        )}
                        {submittedTasks.has(task.id) && (
                          <Text
                            type={taskResults[task.id]?.is_correct ? "success" : "danger"}
                            style={{ fontSize: 11, marginLeft: 8 }}
                          >
                            {taskResults[task.id]?.is_correct ? "✓" : "✗"}
                          </Text>
                        )}
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          )}
        </div>

        {/* Правая колонка: содержимое урока и задания */}
        <div style={{ flex: 1 }}>
          {selectedLesson && (
            <Card
              title={selectedLesson.title}
              style={{ marginBottom: 16 }}
              extra={
                <Button
                  type={completedLessons.has(selectedLesson.id) ? "default" : "primary"}
                  onClick={handleCompleteLesson}
                  loading={completingLesson}
                  disabled={completedLessons.has(selectedLesson.id)}
                >
                  {completedLessons.has(selectedLesson.id)
                    ? "✓ Урок завершен"
                    : "Завершить урок"}
                </Button>
              }
            >
              {selectedLesson.content && (
                <Paragraph>{selectedLesson.content}</Paragraph>
              )}
            </Card>
          )}

          {selectedTask && (
            <Card
              title={selectedTask.title}
              extra={
                selectedTask.has_autocheck && (
                  <Text type="success">Автопроверка</Text>
                )
              }
            >
              {selectedTask.body && (
                <Paragraph style={{ marginBottom: 16 }}>
                  {selectedTask.body}
                </Paragraph>
              )}

              {selectedTask.has_autocheck && selectedTask.options && (
                <>
                  <Divider>Варианты ответов</Divider>
                  <Radio.Group
                    value={selectedAnswers[selectedTask.id]}
                    onChange={(e) =>
                      handleAnswerChange(selectedTask.id, e.target.value)
                    }
                    disabled={submittedTasks.has(selectedTask.id)}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      {selectedTask.options.map((option) => (
                        <Radio key={option.id} value={option.id}>
                          {option.text}
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>

                  {submittedTasks.has(selectedTask.id) && (
                    <Alert
                      type={
                        taskResults[selectedTask.id]?.is_correct
                          ? "success"
                          : "error"
                      }
                      message={taskResults[selectedTask.id]?.message}
                      style={{ marginTop: 16 }}
                    />
                  )}

                  <div style={{ marginTop: 16 }}>
                    <Button
                      type="primary"
                      onClick={() => handleSubmitAnswer(selectedTask)}
                      loading={submitting}
                      disabled={submittedTasks.has(selectedTask.id)}
                      block
                    >
                      {submittedTasks.has(selectedTask.id)
                        ? "Ответ отправлен"
                        : "Отправить ответ"}
                    </Button>
                  </div>
                </>
              )}

              {!selectedTask.has_autocheck && (
                <Text type="secondary">
                  Это задание не поддерживает автопроверку.
                </Text>
              )}
            </Card>
          )}

          {!selectedLesson && (
            <Card>
              <Text type="secondary">
                Выберите урок слева, чтобы начать обучение.
              </Text>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

