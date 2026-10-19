import React, { useState } from 'react';
import { ChevronUp, Loader2 } from 'lucide-react';
import { toggleVote } from '../services/storageService';

interface VoteButtonProps {
  ideaId: string;
  initialVoteCount: number;
  initialHasVoted: boolean;
  onVoteChange?: (newCount: number, hasVoted: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'vertical' | 'horizontal';
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  ideaId,
  initialVoteCount,
  initialHasVoted,
  onVoteChange,
  size = 'md',
  layout = 'vertical',
}) => {
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [loading, setLoading] = useState(false);

  // Sync state if props change
  React.useEffect(() => {
    setHasVoted(initialHasVoted);
    setVoteCount(initialVoteCount);
  }, [initialHasVoted, initialVoteCount]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    // Optimistic UI update
    const nextHasVoted = !hasVoted;
    const nextCount = nextHasVoted ? voteCount + 1 : Math.max(0, voteCount - 1);
    setHasVoted(nextHasVoted);
    setVoteCount(nextCount);

    try {
      const result = await toggleVote(ideaId);
      setHasVoted(result.hasVoted);
      setVoteCount(result.newCount);
      if (onVoteChange) {
        onVoteChange(result.newCount, result.hasVoted);
      }
    } catch (err) {
      // Revert on error
      setHasVoted(hasVoted);
      setVoteCount(voteCount);
      console.error('Failed to toggle vote:', err);
    } finally {
      setLoading(false);
    }
  };

  const isVertical = layout === 'vertical';

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={hasVoted ? `Withdraw upvote (${voteCount} votes)` : `Upvote idea (${voteCount} votes)`}
      title={hasVoted ? 'Click to withdraw your upvote' : 'Click to upvote anonymously (1 vote per student)'}
      className={`group relative flex items-center justify-center transition-all duration-200 cursor-pointer rounded-xl font-bold select-none ${
        isVertical ? 'flex-col min-w-[56px] py-2 px-2.5' : 'flex-row space-x-1.5 px-3 py-2'
      } ${
        hasVoted
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none ring-2 ring-indigo-500/30'
          : 'bg-white dark:bg-slate-800 hover:bg-indigo-50/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500'
      } ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}
    >
      {loading ? (
        <Loader2 className={`animate-spin ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
      ) : (
        <ChevronUp
          className={`transition-transform duration-200 ${
            hasVoted ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:-translate-y-0.5'
          } ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}`}
        />
      )}
      <span className={`tracking-tight ${hasVoted ? 'text-white font-extrabold' : 'font-bold'}`}>
        {voteCount}
      </span>
      {layout === 'horizontal' && (
        <span className={`text-xs ml-1 font-semibold ${hasVoted ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
          {hasVoted ? 'Voted' : 'Upvote'}
        </span>
      )}
    </button>
  );
};
