import React, { useState } from 'react';
import { 
  BarChart3, 
  Flag, 
  MessageSquare, 
  AlertTriangle
} from 'lucide-react';
import { FeedbackItem, FeedbackReport } from '../types';
import { calculateFeedbackAggregates } from '../utils/feedback';
import { reportFeedback } from '../services/storageService';

interface FeedbackSummaryProps {
  feedbacks: FeedbackItem[];
  onOpenFeedbackModal?: () => void;
  userFeedback?: FeedbackItem;
}

export const FeedbackSummary: React.FC<FeedbackSummaryProps> = ({
  feedbacks,
  onOpenFeedbackModal,
  userFeedback,
}) => {
  const [reportModalFeedbackId, setReportModalFeedbackId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<FeedbackReport['reason']>('Spam');
  const [reportedIds, setReportedIds] = useState<Record<string, boolean>>({});
  const [reporting, setReporting] = useState(false);

  const aggregates = calculateFeedbackAggregates(feedbacks);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalFeedbackId) return;
    setReporting(true);
    try {
      await reportFeedback(reportModalFeedbackId, reportReason);
      setReportedIds((prev) => ({ ...prev, [reportModalFeedbackId]: true }));
      setReportModalFeedbackId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setReporting(false);
    }
  };

  const writtenItems = feedbacks.filter((f) => f.written_suggestion && f.written_suggestion.trim().length > 0);

  const renderOptionBars = (
    title: string,
    data: Record<string, { count: number; percentage: number }>,
    barColor: string
  ) => {
    const sorted = Object.entries(data).sort((a, b) => b[1].percentage - a[1].percentage);

    return (
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
          <span>{title}</span>
        </h4>
        <div className="space-y-2.5">
          {sorted.map(([label, stats]) => (
            <div key={label} className="text-xs">
              <div className="flex justify-between items-center mb-1 font-medium">
                <span className="text-slate-700 dark:text-slate-300 truncate pr-2">{label}</span>
                <span className="text-slate-900 dark:text-white font-bold shrink-0">
                  {stats.percentage}% <span className="text-slate-400 dark:text-slate-500 font-normal">({stats.count})</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Community Feedback Insights
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Calculated directly from {aggregates.totalCount} peer review{aggregates.totalCount !== 1 ? 's' : ''}.
          </p>
        </div>

        {onOpenFeedbackModal && (
          <button
            onClick={onOpenFeedbackModal}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{userFeedback ? 'Edit Your Feedback' : 'Give Feedback'}</span>
          </button>
        )}
      </div>

      {aggregates.totalCount === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-white">No feedback yet</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Invite your peers to help validate this idea and highlight potential blind spots.
          </p>
          {onOpenFeedbackModal && (
            <button
              onClick={onOpenFeedbackModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Be the First to Review
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 4 Categorized Feedback Visualizations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderOptionBars('What is promising?', aggregates.promising, 'bg-indigo-600')}
            {renderOptionBars('Who would benefit most?', aggregates.beneficiaries, 'bg-emerald-600')}
            {renderOptionBars('What could be improved?', aggregates.improvements, 'bg-amber-600')}
            {renderOptionBars('What would users like to know?', aggregates.knowledge, 'bg-purple-600')}
          </div>

          {/* Written Suggestions List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center space-x-2">
              <span>Peer Suggestions</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {writtenItems.length}
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Qualitative peer observations and constructive suggestions.
            </p>

            {writtenItems.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No written suggestions provided yet.</p>
            ) : (
              <div className="space-y-3">
                {writtenItems.map((item, idx) => {
                  const isReported = reportedIds[item.id];
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-400" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Anonymous Peer #{idx + 1}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {new Date(item.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                          {item.written_suggestion}
                        </p>
                      </div>

                      {/* Report button */}
                      <div className="shrink-0">
                        {isReported ? (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60">
                            Reported
                          </span>
                        ) : (
                          <button
                            onClick={() => setReportModalFeedbackId(item.id)}
                            title="Report inappropriate or abusive comment"
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Report Inappropriate Feedback Modal */}
      {reportModalFeedbackId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Report Suggestion</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Help maintain a constructive, respectful environment for student innovators.
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for reporting:
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="Offensive">Offensive language</option>
                  <option value="Spam">Spam or promotional</option>
                  <option value="Irrelevant">Irrelevant / Nonsense</option>
                  <option value="Personal attack">Personal attack</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalFeedbackId(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {reporting ? 'Reporting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
