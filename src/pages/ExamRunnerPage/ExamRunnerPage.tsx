import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout/AppLayout';
import Spinner from '../../components/Spinner/Spinner';
import useExamRunner from '../../hooks/useExamRunner';
import { useExamGuard } from '../../context/ExamGuardContext';
import IntroScreen from './components/IntroScreen';
import QuestionScreen from './components/QuestionScreen';
import ReviewScreen from './components/ReviewScreen';
import ResultScreen from './components/ResultScreen';

function ExamRunnerPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const {
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
  } = useExamRunner(examId ?? '');

  const { setExamActive } = useExamGuard();

  // به‌محض شروع واقعی آزمون، Context رو خبر می‌کنیم تا اگه کاربر خواست از
  // منو یا لوگو خارج بشه، اول مودال تایید لغو آزمون رو ببینه. با پایان یا
  // خروج از این صفحه، خودش خاموش می‌شه.
  useEffect(() => {
    setExamActive(hasStarted && !isFinished);
    return () => setExamActive(false);
  }, [hasStarted, isFinished, setExamActive]);

  // بستن یا رفرش تب مرورگر وسط آزمون هم باید هشدار بده (این یکی رو
  // خود مرورگر مدیریت می‌کنه، نه مودال ما - استاندارد وبه)
  useEffect(() => {
    if (!hasStarted || isFinished) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasStarted, isFinished]);

  if (loading) {
    return (
      <AppLayout title="در حال بارگذاری آزمون...">
        <Spinner />
      </AppLayout>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <AppLayout title="آزمون">
        <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm dark:bg-gray-900 dark:text-gray-400">
          این آزمون یافت نشد یا هنوز سوالی برایش ثبت نشده.
        </div>
      </AppLayout>
    );
  }

  if (!hasStarted) {
    return (
      <IntroScreen
        exam={exam}
        questionCount={questions.length}
        onBack={() => navigate('/exams')}
        onStart={startExam}
      />
    );
  }

  if (isFinished) {
    return (
      <ResultScreen
        exam={exam}
        score={score}
        endedByTimeout={endedByTimeout}
        onBackToList={() => navigate('/exams')}
      />
    );
  }

  if (isReviewing) {
    return (
      <ReviewScreen
        exam={exam}
        questions={questions}
        answers={answers}
        timeLeft={timeLeft}
        activeWarning={activeWarning}
        onDismissWarning={dismissWarning}
        onGoToQuestion={goToQuestion}
        onBackToCurrent={() => goToQuestion(currentIndex)}
        onFinish={finishExam}
      />
    );
  }

  return (
    <QuestionScreen
      exam={exam}
      questions={questions}
      currentQuestion={currentQuestion}
      currentIndex={currentIndex}
      isLastQuestion={isLastQuestion}
      answers={answers}
      timeLeft={timeLeft}
      activeWarning={activeWarning}
      onDismissWarning={dismissWarning}
      onSelectAnswer={selectAnswer}
      onPrevious={goToPrevious}
      onNext={goToNext}
      onLastQuestionAction={
        exam.allowReview ? proceedFromLastQuestion : finishExam
      }
    />
  );
}

export default ExamRunnerPage;
