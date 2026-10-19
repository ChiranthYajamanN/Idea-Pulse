import React, { useState } from 'react';
import { 
  Lightbulb, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Category, AssessmentScores, Idea } from '../types';
import { submitIdea } from '../services/storageService';

interface SubmitIdeaPageProps {
  onSuccess: (newIdea: Idea) => void;
  onCancel: () => void;
}

const CATEGORIES: Category[] = [
  'Sustainability & Cleantech',
  'Campus Life & Mobility',
  'EdTech & Productivity',
  'Health & Wellness',
  'Social Impact',
  'FinTech & Commerce',
  'AI & DeepTech',
];

export const SubmitIdeaPage: React.FC<SubmitIdeaPageProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Sustainability & Cleantech');
  const [problemStatement, setProblemStatement] = useState('');
  const [targetUsers, setTargetUsers] = useState('');

  // Self assessment state
  const [selfScores, setSelfScores] = useState<AssessmentScores>({
    problem_clarity: 4,
    user_value: 4,
    feasibility: 3,
    sustainability: 3,
    validation: 3,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || title.trim().length < 3) {
      setErrorMsg('Idea title must be at least 3 characters.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg('Description must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    // Watchdog to guarantee button is never locked
    const watchdogTimer = setTimeout(() => {
      setSubmitting(false);
    }, 6000);

    try {
      const created = await submitIdea({
        title: title.trim(),
        description: description.trim(),
        category,
        problem_statement: problemStatement.trim() || undefined,
        target_users: targetUsers.trim() || undefined,
        initial_self_scores: selfScores,
      });

      clearTimeout(watchdogTimer);

      // Launch celebration confetti safely
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback
      }

      onSuccess(created);
    } catch (err: any) {
      clearTimeout(watchdogTimer);
      setErrorMsg(err.message || 'Failed to submit idea. Please try again.');
    } finally {
      clearTimeout(watchdogTimer);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Lightbulb className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Submit Your Idea Anonymously
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Share your startup concept freely. Your identity is cryptographically protected and never shown to the campus community.
        </p>
      </div>

      {/* Anonymous Assurance Box */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-200 flex items-center space-x-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
        <div>
          <span className="font-bold block">Anonymous Submission Guarantee</span>
          <p className="text-emerald-800 dark:text-emerald-300">
            No name, college roll number, or personal email will be attached to your public card.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
            Idea Title *
          </label>
          <input
            type="text"
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Smart Waste Segregator"
            className="w-full text-sm sm:text-base p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold"
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Keep it clear, concise, and recognizable.
          </p>
        </div>

        {/* One-Sentence Description */}
        <div>
          <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
            One-Sentence Description *
          </label>
          <textarea
            required
            rows={2}
            maxLength={300}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='e.g. "An affordable smart bin that automatically identifies and separates different types of waste."'
            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Explain what the product does and why it matters in one punchy sentence.
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Optional Problem Being Solved */}
        <div>
          <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Problem Being Solved (Optional)</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Highly recommended for validation</span>
          </label>
          <textarea
            rows={2}
            maxLength={500}
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            placeholder="e.g. 70% of recyclable campus trash is contaminated because students don't know which bin to use."
            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
          />
        </div>

        {/* Optional Target Users */}
        <div>
          <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
            Target Users (Optional)
          </label>
          <input
            type="text"
            maxLength={200}
            value={targetUsers}
            onChange={(e) => setTargetUsers(e.target.value)}
            placeholder="e.g. University dining halls, student libraries, dorm residents"
            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        {/* Initial Self-Assessment Ratings Accordion */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 mb-2">
            <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Initial Self-Assessment (1–5)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Honest baseline rating helps generate your initial Priority Improvement Plan.
          </p>

          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            {[
              { key: 'problem_clarity', label: 'Problem Clarity', desc: 'How clearly have you defined the problem?' },
              { key: 'user_value', label: 'User Value', desc: 'How valuable is the solution to users?' },
              { key: 'feasibility', label: 'Technical Feasibility', desc: 'How technically feasible is your solution?' },
              { key: 'sustainability', label: 'Sustainability & Practicality', desc: 'How sustainable are long-term costs?' },
              { key: 'validation', label: 'Validation & Differentiation', desc: 'How tested is it against competitors?' },
            ].map((param) => (
              <div key={param.key} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-1.5 border-b last:border-0 border-slate-200/60 dark:border-slate-700/60 gap-2">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{param.label}</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{param.desc}</p>
                </div>
                <div className="flex space-x-1.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSelfScores((prev) => ({ ...prev, [param.key]: val }))}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                        (selfScores as any)[param.key] === val
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Anonymously...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Submit Idea Anonymously</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
