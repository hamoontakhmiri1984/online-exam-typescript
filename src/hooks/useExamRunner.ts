import { useEffect, useMemo, useRef, useState } from 'react';
import { getExamById, type Exam } from '../api/examApi';
import { getQuestionsByExamId, type Question } from '../api/questionApi';
import { getCurrentUser } from '../api/authApi';
import { submitAttempt } from '../api/examAttemptApi';

type AnswersMap = Record<string, number>; // questionId -> selectedOptionIndex
type TimeWarning = '5min' | '1min' | null;

const FIVE_MIN_SECONDS = 5 * 60;
const ONE_MIN_SECONDS = 60;

function useExamRunner(examId: string) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [endedByTimeout, setEndedByTimeout] = useState<boolean>(false);
  const [activeWarning, setActiveWarning] = useState<TimeWarning>(null);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);

  // جلوگیری از نمایش تکراری هشدار در هر ثانیه‌ای که زیر آستانه‌ست
  const warnedRef = useRef<{ five: boolean; one: boolean }>({
    five: false,
    one: false,
  });
  const startedAtRef = useRef<string | null>(null);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    async function loadExam() {
      const [examData, questionsData] = await Promise.all([
        getExamById(examId),
        getQuestionsByExamId(examId),
      ]);

      if (examData) {
        setExam(examData);
        setTimeLeft(examData.durationMinutes * 60);
      }
      setQuestions(questionsData);
      setLoading(false);
    }

    loadExam();
  }, [examId]);

  // شمارش معکوس: یک interval واحد که خودش دقیق تا صفر می‌شمره و متوقف می‌شه
  // فقط بعد از تایید شروع آزمون فعال می‌شه
  useEffect(() => {
    if (loading || isFinished || !hasStarted) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [loading, isFinished, hasStarted]);

  // پایان خودکار آزمون وقتی زمان تمام شد
  useEffect(() => {
    if (hasStarted && !loading && timeLeft <= 0 && !isFinished) {
      setEndedByTimeout(true);
      setIsFinished(true);
    }
  }, [timeLeft, loading, isFinished, hasStarted]);

  // هشدارهای زمانی: هرکدوم دقیقاً یک‌بار فعال می‌شن
  useEffect(() => {
    if (loading || isFinished || !hasStarted) return;

    if (timeLeft <= ONE_MIN_SECONDS && timeLeft > 0 && !warnedRef.current.one) {
      warnedRef.current.one = true;
      setActiveWarning('1min');
    } else if (
      timeLeft <= FIVE_MIN_SECONDS &&
      timeLeft > ONE_MIN_SECONDS &&
      !warnedRef.current.five
    ) {
      warnedRef.current.five = true;
      setActiveWarning('5min');
    }
  }, [timeLeft, loading, isFinished]);

  function dismissWarning() {
    setActiveWarning(null);
  }

  function startExam() {
    setHasStarted(true);
    startedAtRef.current = new Date().toISOString();
  }

  const currentQuestion = questions[currentIndex] ?? null;
  const isLastQuestion = currentIndex === questions.length - 1;

  function selectAnswer(optionIndex: number) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
  }

  function goToNext() {
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  }

  function goToPrevious() {
    if (exam && !exam.allowReview) return;
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }

  function goToQuestion(index: number) {
    setCurrentIndex(Math.max(0, Math.min(index, questions.length - 1)));
    setIsReviewing(false);
  }

  // از سوال آخر صدا زده می‌شه: اگه آزمون اجازه‌ی مرور داره میره صفحه‌ی مرور،
  // وگرنه مستقیم مثل قبل آزمون تموم می‌شه
  function proceedFromLastQuestion() {
    if (exam?.allowReview) {
      setIsReviewing(true);
    } else {
      setIsFinished(true);
    }
  }

  function finishExam() {
    setIsFinished(true);
  }

  const score = useMemo(() => {
    const correctCount = questions.filter(
      (q) => answers[q.id] === q.correctOptionIndex
    ).length;

    return { correctCount, total: questions.length };
  }, [questions, answers]);

  // ثبت خودکار نتیجه‌ی آزمون - دقیقاً یک‌بار، همون لحظه‌ای که آزمون تموم می‌شه
  useEffect(() => {
    if (!isFinished || hasSubmittedRef.current || !exam) return;
    hasSubmittedRef.current = true;

    const user = getCurrentUser();

    submitAttempt({
      examId: exam.id,
      studentId: user?.id ?? 'unknown',
      studentName: user?.username ?? 'ناشناس',
      answers,
      correctCount: score.correctCount,
      totalQuestions: score.total,
      startedAt: startedAtRef.current ?? new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      endedByTimeout,
    });
  }, [isFinished, exam, answers, score, endedByTimeout]);

  return {
    exam,
    questions,
    loading,
    currentQuestion,
    currentIndex,
    isLastQuestion,
    answers,
    timeLeft,
    hasStarted,
    startExam,
    isFinished,
    endedByTimeout,
    activeWarning,
    dismissWarning,
    score,
    selectAnswer,
    goToNext,
    goToPrevious,
    finishExam,
    isReviewing,
    goToQuestion,
    proceedFromLastQuestion,
  };
}

export default useExamRunner;
