import { Pencil, Trash2, PlayCircle, ListChecks } from 'lucide-react';
import type { Exam } from '../../../api/examApi';

type ExamRowProps = {
  exam: Exam;
  canManage: boolean;
  participantCount: number;
  onTake: (exam: Exam) => void;
  onOpenQuestions: (exam: Exam) => void;
  onEdit: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
};

function ExamRow({
  exam,
  canManage,
  participantCount,
  onTake,
  onOpenQuestions,
  onEdit,
  onDelete,
}: ExamRowProps) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200">
      <td className="py-3">{exam.title}</td>
      <td className="py-3">{exam.category}</td>
      <td className="py-3">{exam.date}</td>
      {canManage && (
        <td className="py-3">{participantCount.toLocaleString('fa-IR')}</td>
      )}
      <td className="py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTake(exam)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-success-500/10 hover:text-success-600 dark:text-gray-400 dark:hover:bg-success-500/15 dark:hover:text-success-500 transition"
            title="شروع آزمون"
          >
            <PlayCircle size={16} />
          </button>
          {canManage && (
            <>
              <button
                onClick={() => onOpenQuestions(exam)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-accent-500/10 hover:text-accent-600 dark:text-gray-400 dark:hover:bg-accent-500/15 dark:hover:text-accent-500 transition"
                title="بانک سوال"
              >
                <ListChecks size={16} />
              </button>
              <button
                onClick={() => onEdit(exam)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-brand-950/40 dark:hover:text-brand-400 transition"
                title="ویرایش"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(exam)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-danger-50 hover:text-danger-600 dark:text-gray-400 dark:hover:bg-danger-950/40 dark:hover:text-danger-400 transition"
                title="حذف"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default ExamRow;