import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  UserCheck,
  Users
} from 'lucide-react';
import { AssessmentScores, ReadinessAssessment } from '../types';
import { submitOrUpdateAssessment } from '../services/storageService';
import { calculateAssessmentAverage, calculateReadinessPercentage } from '../utils/scoring';

interface AssessmentFormProps {
  ideaId: string;
  isCreator: boolean;
  existingAssessment?: ReadinessAssessment;
  onSuccess: (saved: ReadinessAssessment) => void;
  onCancel?: () => void;
}

const PARAMETER_META = [
  {
    key: 'problem_clarity' as keyof AssessmentScores,
    title: '1. Problem Clarity',
    question: 'How clearly has the problem and affected user persona been identified?',
    lowLabel: '1 = Unclear / Vague problem',
    highLabel: '5 = Pinpointed real-world problem',
  },
  {
    key: 'user_value' as keyof AssessmentScores,
    title: '2. User Value',
    question: 'How valuable and urgently needed is this solution to the target users?',
    lowLabel: '1 = Little to no obvious value',
    highLabel: '5 = Transformative & essential value',
  },
  {
    key: 'feasibility' as keyof AssessmentScores,
    title: '3. Technical & Operational Feasibility',
    question: 'How realistic and feasible is building and executing this solution?',
    lowLabel: '1 = Unrealistic / High roadblocks',
    highLabel: '5 = Highly feasible & executable',
  },
  {
    key: 'sustainability' as keyof AssessmentScores,
    title: '4. Sustainability & Practicality',
    question: 'How sustainable are the long-term unit costs, maintenance, and resources?',
    lowLabel: '1 = Impractical cost / high friction',
    highLabel: '5 = Highly sustainable & practical',
  },
  {
    key: 'validation' as keyof AssessmentScores,
    title: '5. Validation & Differentiation',
    question: 'How well validated is the concept against existing alternatives / competitors?',
    lowLabel: '1 = Zero validation / easily cloned',
    highLabel: '5 = Strong evidence & differentiated',
  },
];

export const AssessmentForm: React.FC<AssessmentFormProps> = ({
  ideaId,
  isCreator,
  existingAssessment,
  onSuccess,
  onCancel,
}) => {
  const assessmentType = isCreator ? 'self' : 'peer';

  const [scores, setScores] = useState<AssessmentScores>({
    problem_clarity: existingAssessment?.problem_clarity || 4,
    user_value: existingAssessment?.user_value || 4,
    feasibility: existingAssessment?.feasibility || 3,
    sustainability: existingAssessment?.sustainability || 3,
    validation: existingAssessment?.validation || 3,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentAverage = calculateAssessmentAverage(scores);
  const currentPercentage = calculateReadinessPercentage(currentAverage);

  const handleScoreChange = (paramKey: keyof AssessmentScores, val: number) => {
    setScores((prev) => ({
      ...prev,
      [paramKey]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const saved = await submitOrUpdateAssessment(ideaId, assessmentType, scores);
      onSuccess(saved);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            {isCreator ? (
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400">
                <UserCheck className="w-5 h-5" />
              </span>
            ) : (
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400">
                <Users className="w-5 h-5" />
              </span>
            )}
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isCreator ? 'Creator Self-Assessment' : 'Peer Readiness Assessment'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isCreator
              ? 'Evaluate your startup idea honestly to uncover blind spots and generate your action plan.'
              : 'Provide objective, constructive scores to help the creator validate and sharpen their idea.'}
          </p>
        </div>

        {/* Live score preview */}
        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
              {isCreator ? 'Self Score' : 'Your Peer Rating'}
            </div>
            <div className="text-lg font-extrabold text-indigo-900 dark:text-indigo-300">
              {currentAverage} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ 5</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
            {currentPercentage}%
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 5 Parameters Input */}
      <div className="space-y-6">
        {PARAMETER_META.map((param) => {
          const currentValue = scores[param.key];
          return (
            <div key={param.key} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/80">
              <div className="flex items-start justify-between mb-1">
                <label className="text-sm font-bold text-slate-900 dark:text-white">
                  {param.title}
                </label>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-400">
                  {currentValue} / 5
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                {param.question}
              </p>

              {/* 1 to 5 clickable buttons */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleScoreChange(param.key, val)}
                    className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex flex-col items-center justify-center border ${
                      currentValue === val
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-102'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{val}</span>
                  </button>
                ))}
              </div>

              {/* Scale guide labels */}
              <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium px-1">
                <span>{param.lowLabel}</span>
                <span>{param.highLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
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
              <span>Saving Assessment...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>
                {existingAssessment ? 'Update Assessment' : 'Submit Assessment'}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
