import { Link as LinkIcon, Upload } from 'lucide-react';
import Modal from '../../../components/Modal/Modal';

type UploadedFile = { fileName: string; objectUrl: string };

type SessionFormModalProps = {
  isOpen: boolean;
  isEditing: boolean;
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  videoType: 'link' | 'upload';
  onVideoTypeChange: (type: 'link' | 'upload') => void;
  videoUrl: string;
  onVideoUrlChange: (value: string) => void;
  uploadedFile: UploadedFile | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
};

function SessionFormModal({
  isOpen,
  isEditing,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  videoType,
  onVideoTypeChange,
  videoUrl,
  onVideoUrlChange,
  uploadedFile,
  onFileChange,
  onSubmit,
  onClose,
}: SessionFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-lg font-bold mb-4 dark:text-white">
        {isEditing ? 'ویرایش جلسه' : 'جلسه جدید'}
      </h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            عنوان جلسه
          </label>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition"
            placeholder="مثلاً: جلسه ۱: معرفی متغیرها"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            توضیحات
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={2}
            className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition resize-none"
            placeholder="توضیح کوتاه درباره‌ی این جلسه"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            منبع ویدیو
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onVideoTypeChange('link')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                videoType === 'link'
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                  : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'
              }`}
            >
              <LinkIcon size={15} />
              لینک (یوتیوب/آپارات)
            </button>
            <button
              type="button"
              onClick={() => onVideoTypeChange('upload')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                videoType === 'upload'
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                  : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'
              }`}
            >
              <Upload size={15} />
              آپلود فایل
            </button>
          </div>

          {videoType === 'link' ? (
            <input
              value={videoUrl}
              onChange={(e) => onVideoUrlChange(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition"
              placeholder="https://www.aparat.com/video/..."
            />
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-800 dark:hover:bg-brand-950/20 transition">
              <Upload size={18} />
              {uploadedFile ? uploadedFile.fileName : 'فایل ویدیو را انتخاب کن'}
              <input
                type="file"
                accept="video/*"
                onChange={onFileChange}
                className="hidden"
              />
            </label>
          )}

          {videoType === 'upload' && (
            <p className="text-xs text-accent-600 dark:text-accent-400">
              توجه: چون بک‌اند فعلاً وصل نیست، فایل آپلودی فقط تو همین تب
              می‌مونه و با رفرش صفحه از بین می‌ره.
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-brand-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-brand-700 transition"
        >
          {isEditing ? 'ذخیره تغییرات' : 'افزودن جلسه'}
        </button>
      </form>
    </Modal>
  );
}

export default SessionFormModal;