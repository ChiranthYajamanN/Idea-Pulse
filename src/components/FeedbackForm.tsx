import React, { useState } from 'react';
import { 
  CheckCircle2, 
  MessageSquarePlus, 
  AlertCircle, 
  Loader2, 
  ShieldCheck
} from 'lucide-react';
import { FeedbackItem } from '../types';
import { 
  PROMISING_OPTIONS, 
  BENEFICIARY_OPTIONS, 
  IMPROVEMENT_OPTIONS, 
  KNOWLEDGE_OPTIONS 
} from '../utils/feedback';
import { submitOrUpdateFeedback } from '../services/storageService';

interface FeedbackFormProps {
  ideaId: string;
  ideaTitle: string;
  existingFeedback?: FeedbackItem;
  onSuccess: (feedback: FeedbackItem) => void;
  onCancel?: () => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  ideaId,
  ideaTitle,
  existingFeedback,
  onSuccess,
  onCancel,
}) => {
  const [promising, setPromising] = useState<string[]>(existingFeedback?.promising_options || []);
  const [beneficiaries, setBeneficiaries] = useState<string[]>(existingFeedback?.beneficiary_options || []);
  const [improvements, setImprovements] = useState<string[]>(existingFeedback?.improvement_options || []);
  const [knowledge, setKnowledge] = useState<string[]>(existingFeedback?.knowledge_options || []);
  const [suggestion, setSuggestion] = useState<string>(existingFeedback?.written_suggestion || '');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleOption = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (promising.length === 0 && beneficiaries.length === 0 && improvements.length === 0 && knowledge.length === 0 && !suggestion.trim()) {
      setErrorMsg('Please select at least one constructive answer or write a suggestion.');
      return;
    }

    if (suggestion.length > 500) {
      setErrorMsg('Suggestions cannot exceed 500 characters.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const saved = await submitOrUpdateFeedback(ideaId, {
        promising_options: promising,
        beneficiary_options: beneficiaries,
        improvement_options: improvements,
        knowledge_options: knowledge,
        written_suggestion: suggestion.trim() || undefined,
      });
      onSuccess(saved);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400">
            <MessageSquarePlus className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {existingFeedback ? 'Edit Your Constructive Feedback' : 'Give Constructive Feedback'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Targeted advice for <span className="font-semibold text-slate-700 dark:text-slate-300">"{ideaTitle}"</span>
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Feedback is completely anonymous to the idea creator. 1 feedback submission per student (you can edit your feedback anytime).
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Guided Question 1 */}
      <div>
        <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">
          1. What is promising about this idea?
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">Select all aspects that show potential</p>
        <div className="flex flex-wrap gap-2">
          {PROMISING_OPTIONS.map((opt) => {
            const isSelected = promising.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleOption(promising, setPromising, opt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:bg-slate-700'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guided Question 2 */}
      <div>
        <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">
          2. Who would benefit most?
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">Identify the most viable target audiences</p>
        <div className="flex flex-wrap gap-2">
          {BENEFICIARY_OPTIONS.map((opt) => {
            const isSelected = beneficiaries.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleOption(beneficiaries, setBeneficiaries, opt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:bg-slate-700'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guided Question 3 */}
      <div>
        <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">
          3. What could be improved?
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">Constructive focus areas for refinement</p>
        <div className="flex flex-wrap gap-2">
          {IMPROVEMENT_OPTIONS.map((opt) => {
            const isSelected = improvements.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleOption(improvements, setImprovements, opt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300 hover:bg-amber-50/40 dark:hover:bg-slate-700'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guided Question 4 */}
      <div>
        <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">
          4. What would you like to know?
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">What questions should the creator answer next?</p>
        <div className="flex flex-wrap gap-2">
          {KNOWLEDGE_OPTIONS.map((opt) => {
            const isSelected = knowledge.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleOption(knowledge, setKnowledge, opt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:bg-purple-50/40 dark:hover:bg-slate-700'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Short Written Suggestion */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-bold text-slate-900 dark:text-white">
            Add one short suggestion (optional)
          </label>
          <span className={`text-xs ${suggestion.length > 500 ? 'text-rose-600 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
            {suggestion.length}/500
          </span>
        </div>
        <textarea
          rows={3}
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          placeholder="e.g. Try testing with off-the-shelf camera sensors to keep prototype costs under $40..."
          maxLength={500}
          className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          Constructive, actionable suggestions help fellow students pivot and improve.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Feedback...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{existingFeedback ? 'Update Feedback' : 'Submit Feedback'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
