import React from 'react';
import { 
  Users, 
  UserCheck, 
  Gauge 
} from 'lucide-react';
import { ReadinessAssessment, AssessmentScores } from '../types';
import { calculateReadinessPercentage } from '../utils/scoring';

interface ReadinessScoreProps {
  selfAssessment?: ReadinessAssessment;
  peerAssessmentsCount: number;
  peerAverageScores?: AssessmentScores;
  overallPercentage: number;
  compact?: boolean;
}

export const ReadinessScore: React.FC<ReadinessScoreProps> = ({
  selfAssessment,
  peerAssessmentsCount,
  peerAverageScores,
  overallPercentage,
  compact = false,
}) => {
  const isAwaitingPeers = peerAssessmentsCount === 0;

  // Parameters list with human-friendly descriptions
  const parameters: Array<{
    id: keyof AssessmentScores;
    label: string;
    description: string;
    selfVal: number;
    peerVal: number | null;
  }> = [
    {
      id: 'problem_clarity',
      label: 'Problem Clarity',
      description: 'Clear articulation of the pain point & target personas',
      selfVal: selfAssessment?.problem_clarity || 3,
      peerVal: peerAverageScores?.problem_clarity ?? null,
    },
    {
      id: 'user_value',
      label: 'User Value',
      description: 'Significance & urgency of value delivered to users',
      selfVal: selfAssessment?.user_value || 3,
      peerVal: peerAverageScores?.user_value ?? null,
    },
    {
      id: 'feasibility',
      label: 'Feasibility',
      description: 'Technical, architectural, and operational execution',
      selfVal: selfAssessment?.feasibility || 3,
      peerVal: peerAverageScores?.feasibility ?? null,
    },
    {
      id: 'sustainability',
      label: 'Sustainability',
      description: 'Cost structure, maintenance, and long-term viability',
      selfVal: selfAssessment?.sustainability || 3,
      peerVal: peerAverageScores?.sustainability ?? null,
    },
    {
      id: 'validation',
      label: 'Validation & Differentiation',
      description: 'User interviews, prototype benchmarks & competitive edge',
      selfVal: selfAssessment?.validation || 3,
      peerVal: peerAverageScores?.validation ?? null,
    },
  ];

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-indigo-600';
    if (percentage >= 45) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1 min-w-[70px] bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(overallPercentage)}`}
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {overallPercentage}%
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
      {/* Top Header & Big Score Callout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 rounded-lg">
              <Gauge className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Idea Readiness Score
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              5 Parameters
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Combines 50% creator self-assessment with 50% community peer validation.
          </p>
        </div>

        {/* Circular / Badge overall readiness display */}
        <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
              Overall Readiness
            </div>
            <div className="text-2xl font-black text-indigo-900 dark:text-indigo-300 tracking-tight">
              {overallPercentage}%
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
              {((overallPercentage / 100) * 5).toFixed(1)}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">/5</span>
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Notice / Mode */}
      <div className="my-4 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Self-Assessment: Active</span>
          </span>
          <span className="flex items-center space-x-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {peerAssessmentsCount > 0
                ? `${peerAssessmentsCount} Peer Assessment${peerAssessmentsCount > 1 ? 's' : ''}`
                : 'Awaiting peer assessments'}
            </span>
          </span>
        </div>
        {isAwaitingPeers && (
          <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[11px] font-semibold">
            Peer weighting pending
          </span>
        )}
      </div>

      {/* 5 Parameters Parameter List */}
      <div className="space-y-4 mt-6">
        {parameters.map((param) => {
          const combinedScore = param.peerVal !== null
            ? Number(((param.selfVal * 0.5) + (param.peerVal * 0.5)).toFixed(1))
            : param.selfVal;
          const paramPercentage = calculateReadinessPercentage(combinedScore);

          return (
            <div key={param.id} className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <span>{param.label}</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      ({combinedScore} / 5)
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {param.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs shrink-0">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400" title="Self score">
                    Self: <strong className="text-slate-700 dark:text-slate-200">{param.selfVal}/5</strong>
                  </span>
                  {param.peerVal !== null && (
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold" title="Peer average">
                      Peers: <strong>{param.peerVal}/5</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-slate-200/80 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(paramPercentage)}`}
                    style={{ width: `${paramPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-9 text-right">
                  {paramPercentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
