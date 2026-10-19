import React from 'react';
import { 
  MessageSquare, 
  ArrowUpRight, 
  Activity,
  Trash2
} from 'lucide-react';
import { IdeaWithStats } from '../types';
import { VoteButton } from './VoteButton';
import { ReadinessScore } from './ReadinessScore';

interface IdeaCardProps {
  idea: IdeaWithStats;
  rank?: number;
  onSelect: (idea: IdeaWithStats) => void;
  onOpenFeedback: (idea: IdeaWithStats) => void;
  onVoteChange?: (ideaId: string, newCount: number, hasVoted: boolean) => void;
  onDelete?: (idea: IdeaWithStats) => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  rank,
  onSelect,
  onOpenFeedback,
  onVoteChange,
  onDelete,
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Sustainability & Cleantech':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      case 'Campus Life & Mobility':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
      case 'EdTech & Productivity':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
      case 'Social Impact':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
      case 'Health & Wellness':
        return 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800/60';
      case 'AI & DeepTech':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <article
      onClick={() => onSelect(idea)}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 p-5 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Meta: Rank, Category, Activity */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            {rank !== undefined && (
              <span
                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                  rank === 1
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-xs'
                    : rank === 2
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                    : rank === 3
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                #{rank}
              </span>
            )}
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryColor(idea.category)}`}>
              {idea.category}
            </span>
          </div>

          <div className="flex items-center space-x-1 text-[11px] text-slate-400 dark:text-slate-500">
            <Activity className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span>Active {timeAgo(idea.last_activity_at || idea.created_at)}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition tracking-tight line-clamp-1 mb-1.5">
          {idea.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mb-4">
          {idea.description}
        </p>
      </div>

      {/* Readiness Bar & Stats */}
      <div>
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1">
              <span>Readiness</span>
            </span>
            <span className="text-indigo-700 dark:text-indigo-400">
              {idea.overall_readiness_percentage}%
            </span>
          </div>
          <ReadinessScore
            overallPercentage={idea.overall_readiness_percentage}
            compact={true}
            peerAssessmentsCount={idea.peer_assessments_count}
          />
        </div>

        {/* Bottom Actions Footer */}
        <div className="flex items-center justify-between gap-2 pt-2">
          {/* Vote Button */}
          <div onClick={(e) => e.stopPropagation()}>
            <VoteButton
              ideaId={idea.id}
              initialVoteCount={idea.vote_count}
              initialHasVoted={idea.has_voted}
              layout="horizontal"
              size="sm"
              onVoteChange={(newCount, hasVoted) => {
                if (onVoteChange) {
                  onVoteChange(idea.id, newCount, hasVoted);
                }
              }}
            />
          </div>

          {/* Feedback & View actions */}
          <div className="flex items-center space-x-1.5">
            {idea.is_creator && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(idea);
                }}
                title="Delete this idea"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                aria-label="Delete idea"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenFeedback(idea);
              }}
              title="Give or edit constructive feedback"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{idea.feedback_count}</span>
            </button>

            <button
              onClick={() => onSelect(idea)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
            >
              <span>Details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
