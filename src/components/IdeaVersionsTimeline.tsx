import React, { useState } from 'react';
import { 
  GitBranch, 
  Plus, 
  Calendar
} from 'lucide-react';
import { IdeaVersion } from '../types';
import { addIdeaVersion } from '../services/storageService';

interface IdeaVersionsTimelineProps {
  ideaId: string;
  isCreator: boolean;
  versions: IdeaVersion[];
  onVersionAdded: () => void;
  onOpenReassessModal?: () => void;
}

export const IdeaVersionsTimeline: React.FC<IdeaVersionsTimelineProps> = ({
  ideaId,
  isCreator,
  versions,
  onVersionAdded,
  onOpenReassessModal,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitNewIteration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      await addIdeaVersion(ideaId, title.trim(), description.trim(), evidence.trim());
      setTitle('');
      setDescription('');
      setEvidence('');
      setShowAddForm(false);
      onVersionAdded();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400">
              <GitBranch className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Idea Iteration & Validation History
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tracking how this concept matures across research, prototypes, and user interviews.
          </p>
        </div>

        {isCreator && !showAddForm && (
          <div className="flex items-center space-x-2">
            {onOpenReassessModal && (
              <button
                onClick={onOpenReassessModal}
                className="px-3 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 rounded-xl transition cursor-pointer"
              >
                Reassess Idea
              </button>
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Iteration</span>
            </button>
          </div>
        )}
      </div>

      {/* New Iteration Form (Creator only) */}
      {showAddForm && isCreator && (
        <form onSubmit={handleSubmitNewIteration} className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Publish Iteration (Version {versions.length + 1})
          </h4>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Iteration Milestone Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. After 15 Student Interviews, or Prototype v0.2 Testing"
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Updated Idea Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How has the concept refined or pivoted based on feedback?"
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              New Evidence & Findings (Interviews, Tests, Metrics)
            </label>
            <textarea
              rows={2}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="e.g. Benchmarked MobileNetV2 with 89% accuracy; verified $35 BOM cost."
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
            >
              {submitting ? 'Publishing...' : 'Save & Publish Version'}
            </button>
          </div>
        </form>
      )}

      {/* Timeline entries */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {versions.map((ver, idx) => (
          <div key={ver.id} className="relative">
            {/* Timeline bullet */}
            <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white dark:bg-slate-900 ${
              idx === 0 ? 'border-indigo-600 text-indigo-600' : 'border-slate-300 dark:border-slate-700 text-slate-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`} />
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300">
                    Version {ver.version_number}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ver.title}</h4>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(ver.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 mb-2 leading-relaxed">
                {ver.description}
              </p>

              {ver.evidence && (
                <div className="mt-2 text-xs p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300">
                  <strong className="font-semibold block text-[11px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-0.5">
                    Validation Evidence:
                  </strong>
                  <span>{ver.evidence}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
