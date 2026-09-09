import * as XLSX from 'xlsx';

export type ParsedQuestion = {
  text: string;
  options: string[];
  correctOptionIndex: number;
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const QUESTION_COLUMN = 'سوال';
const CORRECT_ANSWER_COLUMN = 'پاسخ صحیح';

function getOptionColumnLabels(headers: string[]): string[] {
  return headers.filter((header) => header.startsWith('گزینه'));
}

export async function parseQuestionsFromExcel(
  file: File
): Promise<ParsedQuestion[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: '',
  });

  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const optionColumns = getOptionColumnLabels(headers);

  const parsed: ParsedQuestion[] = [];

  for (const row of rows) {
    const text = String(row[QUESTION_COLUMN] ?? '').trim();
    if (!text) continue;

    // فقط گزینه‌های خالیِ انتهایی (مثلاً سوال ۲-گزینه‌ای که گزینه‌ی ۳/۴
    // خالی مونده) رو کنار می‌ذاریم - نه با filter رو کل آرایه، چون اون‌جوری
    // اگه یه گزینه‌ی وسط خالی باشه، اندیس بقیه‌ی گزینه‌ها جابه‌جا می‌شه و
    // پاسخ صحیح (که بر اساس حرف/اندیس ستون اصلیه) به گزینه‌ی غلط اشاره می‌کنه
    const rawOptions = optionColumns.map((col) =>
      String(row[col] ?? '').trim()
    );
    let lastFilledIndex = -1;
    rawOptions.forEach((opt, idx) => {
      if (opt) lastFilledIndex = idx;
    });
    const options = rawOptions.slice(0, lastFilledIndex + 1);

    // اگه کمتر از ۲ گزینه داشت یا وسط گزینه‌ها یه خونه‌ی خالی افتاده بود
    // (که یعنی داده خراب/ناقصه)، این سطر رو نادیده می‌گیریم
    if (options.length < 2 || options.some((opt) => opt.length === 0)) {
      continue;
    }

    const correctLetter = String(row[CORRECT_ANSWER_COLUMN] ?? '')
      .trim()
      .toUpperCase();
    const correctIndex = OPTION_LETTERS.indexOf(correctLetter);
    const validIndex =
      correctIndex >= 0 && correctIndex < options.length ? correctIndex : 0;

    parsed.push({
      text,
      options,
      correctOptionIndex: validIndex,
    });
  }

  return parsed;
}

export function downloadQuestionTemplate() {
  const templateRows = [
    {
      [QUESTION_COLUMN]: 'پایتخت ایران کدام است؟',
      'گزینه ۱': 'تهران',
      'گزینه ۲': 'مشهد',
      'گزینه ۳': 'اصفهان',
      'گزینه ۴': 'شیراز',
      [CORRECT_ANSWER_COLUMN]: 'A',
    },
    {
      [QUESTION_COLUMN]: 'نمونه‌ی سوال با ۳ گزینه',
      'گزینه ۱': 'گزینه‌ی اول',
      'گزینه ۲': 'گزینه‌ی دوم',
      'گزینه ۳': 'گزینه‌ی سوم',
      'گزینه ۴': '',
      [CORRECT_ANSWER_COLUMN]: 'B',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'سوالات');
  XLSX.writeFile(workbook, 'قالب-ایمپورت-سوالات.xlsx');
}
