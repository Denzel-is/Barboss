type SubmissionFileRecord = {
  id: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
};

type SubmissionFilesProps = {
  files: SubmissionFileRecord[];
  taskTitle: string;
};

function isCircleVideoTask(taskTitle: string) {
  return taskTitle.toLowerCase().includes("кружоч");
}

function isCircleVideoFile(taskTitle: string, fileType: string) {
  return fileType.startsWith("video/") && isCircleVideoTask(taskTitle);
}

export function SubmissionFiles({ files, taskTitle }: SubmissionFilesProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <p className="text-sm font-medium text-neutral-800">Вложения</p>
      <section className="space-y-3">
        {files.map((file) => {
          const circleVideo = isCircleVideoFile(taskTitle, file.fileType);

          if (file.fileType.startsWith("image/")) {
            return (
              <figure className="overflow-hidden rounded-[8px] border border-neutral-200" key={file.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={file.fileName} className="max-h-80 w-full object-contain bg-neutral-100" src={file.fileUrl} />
                <figcaption className="border-t border-neutral-200 px-3 py-2 text-xs text-neutral-500">{file.fileName}</figcaption>
              </figure>
            );
          }

          if (file.fileType.startsWith("video/")) {
            if (circleVideo) {
              return (
                <figure className="flex flex-col items-center gap-2" key={file.id}>
                  <section className="relative h-44 w-44 overflow-hidden rounded-full border-4 border-emerald-700 bg-neutral-900 shadow-md">
                    <video className="h-full w-full object-cover" controls playsInline preload="metadata" src={file.fileUrl} />
                  </section>
                  <figcaption className="text-center text-xs font-medium text-emerald-800">кружочек</figcaption>
                  <p className="max-w-full truncate text-xs text-neutral-500">{file.fileName}</p>
                </figure>
              );
            }

            return (
              <figure className="overflow-hidden rounded-[8px] border border-neutral-200" key={file.id}>
                <video className="max-h-80 w-full bg-black" controls playsInline preload="metadata" src={file.fileUrl} />
                <figcaption className="border-t border-neutral-200 px-3 py-2 text-xs text-neutral-500">{file.fileName}</figcaption>
              </figure>
            );
          }

          if (file.fileType.startsWith("audio/")) {
            return (
              <figure className="rounded-[8px] border border-neutral-200 bg-white p-3" key={file.id}>
                <audio className="w-full" controls preload="metadata" src={file.fileUrl} />
                <figcaption className="mt-2 text-xs text-neutral-500">{file.fileName}</figcaption>
              </figure>
            );
          }

          return (
            <p className="text-sm text-neutral-600" key={file.id}>
              <a className="text-emerald-800 underline" href={file.fileUrl} rel="noreferrer" target="_blank">
                {file.fileName}
              </a>
            </p>
          );
        })}
      </section>
    </section>
  );
}
