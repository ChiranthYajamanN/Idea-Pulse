import React, { useState } from 'react';
import { 
  Trophy, 
  PlusCircle,
  TrendingUp
} from 'lucide-react';
import { IdeaWithStats } from '../types';
import { Leaderboard } from '../components/Leaderboard';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

interface LeaderboardPageProps {
  ideas: IdeaWithStats[];
  onSelectIdea: (idea: IdeaWithStats) => void;
  onOpenFeedback: (idea: IdeaWithStats) => void;
  onNavigateToSubmit: () => void;
  onVoteChange?: (ideaId: string, newCount: number, hasVoted: boolean) => void;
  onDeleteIdea?: (ideaId: string) => Promise<void> | void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  ideas,
  onSelectIdea,
  onOpenFeedback,
  onNavigateToSubmit,
  onVoteChange,
  onDeleteIdea,
}) => {
  const [ideaToDelete, setIdeaToDelete] = useState<IdeaWithStats | null>(null);

  const handleConfirmDelete = async () => {
    if (ideaToDelete && onDeleteIdea) {
      const targetId = ideaToDelete.id;
      try {
        await onDeleteIdea(targetId);
      } finally {
        setIdeaToDelete(null);
      }
    }
  };
  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
              <Trophy className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Campus Innovation Leaderboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time community validated ranking. High upvotes rise to the top; ties are settled by most recent active engagement.
          </p>
        </div>

        <button
          onClick={onNavigateToSubmit}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit Your Idea</span>
        </button>
      </div>

      {/* Rules callout */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            <strong>Ranking Algorithm:</strong> Primary = Upvotes Count. Tie-breaker 1 = Latest Vote Activity. Tie-breaker 2 = Submission Date.
          </span>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
          Auto-Sorted & Live
        </span>
      </div>

      {/* Leaderboard Table Component */}
      <Leaderboard
        ideas={ideas}
        onSelectIdea={onSelectIdea}
        onOpenFeedback={onOpenFeedback}
        onVoteChange={onVoteChange}
        onDelete={(target) => setIdeaToDelete(target)}
      />

      {/* Delete Confirmation Modal */}
      {ideaToDelete && (
        <DeleteConfirmModal
          isOpen={true}
          ideaTitle={ideaToDelete.title}
          onConfirm={handleConfirmDelete}
          onClose={() => setIdeaToDelete(null)}
        />
      )}
    </div>
  );
};
