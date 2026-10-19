import React, { useState } from 'react';
import { 
  UserCheck, 
  PlusCircle, 
  Lightbulb, 
  ShieldCheck, 
  KeyRound
} from 'lucide-react';
import { IdeaWithStats } from '../types';
import { IdeaCard } from '../components/IdeaCard';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

interface MyIdeasPageProps {
  ideas: IdeaWithStats[];
  onSelectIdea: (idea: IdeaWithStats) => void;
  onOpenFeedback: (idea: IdeaWithStats) => void;
  onNavigateToSubmit: () => void;
  onOpenRecoveryModal: () => void;
  onVoteChange?: (ideaId: string, newCount: number, hasVoted: boolean) => void;
  onDeleteIdea?: (ideaId: string) => Promise<void> | void;
}

export const MyIdeasPage: React.FC<MyIdeasPageProps> = ({
  ideas,
  onSelectIdea,
  onOpenFeedback,
  onNavigateToSubmit,
  onOpenRecoveryModal,
  onVoteChange,
  onDeleteIdea,
}) => {
  const [ideaToDelete, setIdeaToDelete] = useState<IdeaWithStats | null>(null);
  const myIdeas = ideas.filter((i) => i.is_creator);

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
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
              <UserCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              My Anonymous Ideas
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Startup concepts created by you in this session. Manage iterations, review feedback, and complete action plans.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenRecoveryModal}
            className="inline-flex items-center space-x-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 transition cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Recovery Credentials</span>
          </button>

          <button
            onClick={onNavigateToSubmit}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Another</span>
          </button>
        </div>
      </div>

      {/* Anonymity Banner */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>Your Anonymity is Protected:</strong> Other students only see your ideas as anonymous submissions. Your cryptographic ID is hidden.
          </span>
        </div>
        <button
          onClick={onOpenRecoveryModal}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline cursor-pointer shrink-0"
        >
          Backup Session Key
        </button>
      </div>

      {/* Ideas List / Empty State */}
      {myIdeas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center max-w-md mx-auto">
          <Lightbulb className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
            You haven't submitted an idea yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Have a startup or campus innovation concept? Submit it 100% anonymously to start collecting peer validation.
          </p>
          <button
            onClick={onNavigateToSubmit}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Your First Idea</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
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
