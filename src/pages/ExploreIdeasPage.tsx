import React, { useState, useMemo } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Lightbulb, 
  PlusCircle
} from 'lucide-react';
import { IdeaWithStats, Category } from '../types';
import { IdeaCard } from '../components/IdeaCard';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

interface ExploreIdeasPageProps {
  ideas: IdeaWithStats[];
  onSelectIdea: (idea: IdeaWithStats) => void;
  onOpenFeedback: (idea: IdeaWithStats) => void;
  onNavigateToSubmit: () => void;
  onVoteChange?: (ideaId: string, newCount: number, hasVoted: boolean) => void;
  onDeleteIdea?: (ideaId: string) => Promise<void> | void;
}

type SortOption = 'votes' | 'newest' | 'readiness' | 'feedback';

const CATEGORIES: Category[] = [
  'Sustainability & Cleantech',
  'Campus Life & Mobility',
  'EdTech & Productivity',
  'Health & Wellness',
  'Social Impact',
  'FinTech & Commerce',
  'AI & DeepTech',
];

export const ExploreIdeasPage: React.FC<ExploreIdeasPageProps> = ({
  ideas,
  onSelectIdea,
  onOpenFeedback,
  onNavigateToSubmit,
  onVoteChange,
  onDeleteIdea,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('votes');
  const [ideaToDelete, setIdeaToDelete] = useState<IdeaWithStats | null>(null);

  const filteredIdeas = useMemo(() => {
    let result = [...ideas];

    // Filter by search query (title, description, category)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((i) => i.category === selectedCategory);
    }

    // Sort order
    result.sort((a, b) => {
      if (sortBy === 'votes') {
        if (b.vote_count !== a.vote_count) return b.vote_count - a.vote_count;
        return new Date(b.last_activity_at || b.created_at).getTime() - new Date(a.last_activity_at || a.created_at).getTime();
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'readiness') {
        return b.overall_readiness_percentage - a.overall_readiness_percentage;
      }
      if (sortBy === 'feedback') {
        return b.feedback_count - a.feedback_count;
      }
      return 0;
    });

    return result;
  }, [ideas, searchQuery, selectedCategory, sortBy]);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Explore Campus Ideas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse anonymously submitted student innovations. Upvote solutions you care about and leave constructive reviews.
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

      {/* Search and Filters Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, title, or category..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="votes" className="bg-white dark:bg-slate-900">Highest Votes</option>
              <option value="readiness" className="bg-white dark:bg-slate-900">Highest Readiness</option>
              <option value="feedback" className="bg-white dark:bg-slate-900">Most Feedback</option>
              <option value="newest" className="bg-white dark:bg-slate-900">Newest Submissions</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Categories ({ideas.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = ideas.filter((i) => i.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Ideas Grid or Empty State */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center max-w-md mx-auto transition-colors">
          <Lightbulb className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
            {ideas.length === 0 ? 'No ideas submitted yet' : 'No ideas found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            {ideas.length === 0
              ? 'Be the first student to publish an anonymous idea and get peer validation!'
              : `We couldn't find any ideas matching "${searchQuery || selectedCategory}".`}
          </p>
          <div className="flex justify-center gap-2">
            {ideas.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={onNavigateToSubmit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Submit an Idea
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map((idea, index) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              rank={sortBy === 'votes' ? index + 1 : undefined}
              onSelect={onSelectIdea}
              onOpenFeedback={onOpenFeedback}
              onVoteChange={onVoteChange}
              onDelete={(target) => setIdeaToDelete(target)}
            />
          ))}
        </div>
      )}

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
