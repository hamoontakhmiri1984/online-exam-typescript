import { useState } from 'react';
import {
  parseQuestionsFromExcel,
  type ParsedQuestion,
} from '../utils/questionExcel';
import type { LimitedQuota } from './useInstructorPlanLimit';

type UseQuestionImportModalParams = {
  addMany: (inputs: ParsedQuestion[]) => Promise<unknown>;
  getQuotaIfGated: () => Promise<LimitedQuota | null>;
  onLimitExceeded: (quota: LimitedQuota) => void;
};

function useQuestionImportModal({
  addMany,
  getQuotaIfGated,
  onLimitExceeded,
}: UseQuestionImportModalParams) {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<ParsedQuestion[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');

  function open() {
    setPreview([]);
    setImportError('');
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  async function handleFileSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setImportError('');

    try {
      const parsed = await parseQuestionsFromExcel(file);
      if (parsed.length === 0) {
        setImportError(
          'هیچ سوال معتبری تو فایل پیدا نشد. مطمئن شو از قالب درست استفاده کردی.'
        );
      }
      setPreview(parsed);
    } catch {
      setImportError('خطا در خواندن فایل. مطمئن شو فرمتش Excel یا CSV است.');
    } finally {
      setIsParsing(false);
      event.target.value = '';
    }
  }

  async function confirmImport() {
    if (preview.length === 0) return;

    const quota = await getQuotaIfGated();
    if (quota) {
      if (quota.expired || quota.remaining === 0) {
        setIsOpen(false);
        onLimitExceeded(quota);
        return;
      }
      if (preview.length > quota.remaining) {
        setImportError(
          `این فایل ${preview.length.toLocaleString(
            'fa-IR'
          )} سوال داره ولی پلن فعلیت فقط ${quota.remaining.toLocaleString(
            'fa-IR'
          )} سوال دیگه جا داره. فایل رو کوچیک‌تر کن یا پلنت رو ارتقا بده.`
        );
        return;
      }
    }

    setIsImporting(true);
    await addMany(preview);
    setIsImporting(false);
    setIsOpen(false);
    setPreview([]);
  }

  return {
    isOpen,
    preview,
    isParsing,
    isImporting,
    importError,
    open,
    close,
    handleFileSelected,
    confirmImport,
  };
}

export default useQuestionImportModal;