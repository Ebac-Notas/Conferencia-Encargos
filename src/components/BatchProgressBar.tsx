import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { BatchProgress, ProcessedNotification } from '../types';

interface BatchProgressBarProps {
  progress: BatchProgress;
  notifications: ProcessedNotification[];
  onDismissNotification: (id: string) => void;
  onClearAllNotifications: () => void;
}

export const BatchProgressBar: React.FC<BatchProgressBarProps> = ({
  progress,
  notifications,
  onDismissNotification,
  onClearAllNotifications,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!progress.isProcessing && notifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      {/* Active Processing Bar */}
      {progress.isProcessing && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1.5">
            <span className="truncate max-w-md">
              {progress.statusText}
            </span>
            <span className="font-mono tabular-nums text-slate-600">
              {progress.current} / {progress.total} ({progress.percentage}%)
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 transition-all duration-200 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progress.percentage))}%` }}
            />
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">
              {notifications.length} {notifications.length === 1 ? 'arquivo processado' : 'arquivos processados'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <span>{isExpanded ? 'Ocultar' : 'Ver Lista'}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={onClearAllNotifications}
                className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
              >
                Limpar
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-2.5 max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/50">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-center justify-between p-2 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    {notif.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="font-medium text-slate-800 truncate">
                      {notif.title}
                    </span>
                    <span className="text-slate-400 text-[11px] truncate hidden sm:inline">
                      {notif.subtitle}
                    </span>
                  </div>

                  <button
                    onClick={() => onDismissNotification(notif.id)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 ml-2 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
