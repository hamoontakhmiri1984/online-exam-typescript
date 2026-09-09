import type { LessonSession } from '../../../api/lessonApi';
import { toEmbedUrl } from '../../../utils/video';

type SessionPlayerProps = {
  session: LessonSession | null;
};

function SessionPlayer({ session }: SessionPlayerProps) {
  if (!session) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm dark:bg-gray-900 dark:text-gray-400">
        یک جلسه را برای پخش انتخاب کن.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
      <div className="mb-4 aspect-video overflow-hidden rounded-xl bg-black">
        {session.video.type === 'link' ? (
          <iframe
            key={session.id}
            src={toEmbedUrl(session.video.url)}
            className="h-full w-full"
            allowFullScreen
            title={session.title}
          />
        ) : (
          <video
            key={session.id}
            src={session.video.objectUrl}
            controls
            className="h-full w-full"
          />
        )}
      </div>
      <h2 className="font-bold text-gray-900 dark:text-white">
        {session.title}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {session.description}
      </p>
    </div>
  );
}

export default SessionPlayer;