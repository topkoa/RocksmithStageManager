interface LoadingSpinnerProps {
  message?: string;
  progress?: { completed: number; total: number; current: string };
}

export function LoadingSpinner({ message, progress }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="w-8 h-8 border-2 border-slate-600 border-t-orange-500 rounded-full animate-spin" />
      {message && <p className="text-sm text-slate-400">{message}</p>}
      {progress && progress.total > 0 && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{progress.current}</span>
            <span>{progress.completed}/{progress.total}</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
