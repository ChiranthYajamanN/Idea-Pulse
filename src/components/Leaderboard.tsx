import React from 'react';
import { 
  Trophy, 
  Flame, 
  MessageSquare, 
  ArrowUpRight, 
  Activity,
  Trash2
} from 'lucide-react';
import { IdeaWithStats } from '../types';
import { VoteButton } from './VoteButton';

interface LeaderboardProps {
  ideas: IdeaWithStats[];
  onSelectIdea: (idea: IdeaWithStats) => void;
  onOpenFeedback: (idea: IdeaWithStats) => void;
  onVoteChange?: (ideaId: string, newCount: number, hasVoted: boolean) => void;
  onDelete?: (idea: IdeaWithStats) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  ideas,
  onSelectIdea,
  onOpenFeedback: _onOpenFeedback,
  onVoteChange,
  onDelete,
}) => {
  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
      {/* Table Header Info */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Community Leaderboard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ranked live by upvotes. Ties broken by latest vote activity and submission time.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Auto-Sorted</span>
        </div>
      </div>

      {/* Leaderboard List or Empty State */}
      {ideas.length === 0 ? (
        <div className="p-12 text-center">
          <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-extrabold text-slate-800 dark:text-white">
            Leaderboard is currently empty
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Submit a startup concept and collect student upvotes to claim the #1 spot on campus!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {ideas.map((idea, index) => {
            const rank = index + 1;
            return (
              <div
                key={idea.id}
                onClick={() => onSelectIdea(idea)}
                className="p-4 sm:p-5 hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
              >
                {/* Left Column: Rank + Title + Description */}
                <div className="flex items-start space-x-4 min-w-0 flex-1">
                  {/* Rank Badge */}
                  <div className="shrink-0 pt-0.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border shadow-2xs ${
                        rank === 1
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                          : rank === 2
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                          : rank === 3
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      #{rank}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                        {idea.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {idea.category}
                      </span>
                      {rank <= 3 && (
                        <span className="flex items-center space-x-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Top 3</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mb-2">
                      {idea.description}
                    </p>

                    {/* Metadata Chips */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="flex items-center space-x-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{idea.feedback_count} feedback responses</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Activity className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>Last active {timeAgo(idea.last_activity_at || idea.created_at)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Readiness Bar + Upvote + Actions */}
                <div className="flex items-center justify-between md:justify-end space-x-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Readiness Score Badge */}
                  <div className="text-right pr-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                      Readiness
                    </div>
                    <div className="text-sm font-extrabold text-indigo-700 dark:text-indigo-400">
                      {idea.overall_readiness_percentage}%
                    </div>
                    <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full"
                        style={{ width: `${idea.overall_readiness_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Upvote Button */}
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

                  {/* Delete button if creator */}
                  {idea.is_creator && onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(idea);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete this idea"
                      aria-label="Delete idea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* View Details Arrow */}
                  <button
                    onClick={() => onSelectIdea(idea)}
                    className="p-2 rounded-xl text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 transition cursor-pointer"
                    title="View full idea breakdown"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
