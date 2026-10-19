import React, { useState } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  TrendingUp, 
  Gauge, 
  PlusCircle, 
  Compass,
  Lightbulb
} from 'lucide-react';
import { IdeaWithStats } from '../types';
import { IdeaCard } from '../components/IdeaCard';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

interface HomePageProps {
  ideas: IdeaWithStats[];
  onNavigate: (view: 'explore' | 'leaderboard' | 'submit' | 'my-ideas') => void;
  onSelectIdea: (idea: IdeaWithStats) => void;
  onOpenFeedback: (idea: IdeaWithStats) => void;
  onVoteChange?: (ideaId: string, newCount: number, hasVoted: boolean) => void;
  onDeleteIdea?: (ideaId: string) => Promise<void> | void;
}

export const HomePage: React.FC<HomePageProps> = ({
  ideas,
  onNavigate,
  onSelectIdea,
  onOpenFeedback,
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
  // Snapshot metrics
  const totalIdeas = ideas.length;
  const totalVotes = ideas.reduce((acc, i) => acc + i.vote_count, 0);
  const totalFeedback = ideas.reduce((acc, i) => acc + i.feedback_count, 0);
  const avgReadiness = ideas.length > 0
    ? Math.round(ideas.reduce((acc, i) => acc + i.overall_readiness_percentage, 0) / ideas.length)
    : 0;

  const topIdeas = ideas.slice(0, 3);

  const workflowSteps = [
    { step: 1, label: 'Submit', desc: 'Share your startup concept 100% anonymously.' },
    { step: 2, label: 'Vote', desc: 'Peers upvote ideas that resonate with campus needs.' },
    { step: 3, label: 'Feedback', desc: 'Receive structured, actionable feedback without trolls.' },
    { step: 4, label: 'Assess', desc: 'Measure readiness across 5 core startup parameters.' },
    { step: 5, label: 'Improve', desc: 'Follow your personalized rule-based improvement plan.' },
    { step: 6, label: 'Reassess', desc: 'Publish iteration evidence and boost your readiness.' },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 text-center">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-indigo-200/40 dark:from-indigo-950/40 via-emerald-100/30 dark:via-emerald-950/30 to-purple-200/40 dark:to-purple-950/40 blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Tagline Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Turn ideas into validated opportunities</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6">
            Your Idea Deserves to Be <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-600 dark:from-indigo-400 dark:via-indigo-300 dark:to-emerald-400 bg-clip-text text-transparent">Tested.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            Submit anonymously. Get real peer feedback. Measure your startup readiness score. Improve with confidence without fear of judgment.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('explore')}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Ideas</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onNavigate('submit')}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm px-6 py-3.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Submit Your Idea Anonymously</span>
            </button>
          </div>
        </div>
      </section>

      {/* COMMUNITY SNAPSHOT METRICS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Total Ideas
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{totalIdeas}</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">
              Campus Innovations
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Community Upvotes
            </span>
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{totalVotes}</div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1 inline-block">
              1 Vote Per Student Rule
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Constructive Reviews
            </span>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{totalFeedback}</div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1 inline-block">
              Structured Guided Feedback
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Avg. Readiness Score
            </span>
            <div className="text-3xl font-black text-purple-600 dark:text-purple-400">{avgReadiness}%</div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1 inline-block">
              5 Evaluation Parameters
            </span>
          </div>
        </div>
      </section>

      {/* THE 6-STEP VALIDATION WORKFLOW */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            The IdeaPulse Validation Loop
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            More than just an upvote board: a complete structured pipeline taking an idea from raw concept to validated execution.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {workflowSteps.map((item, idx) => (
            <div
              key={item.step}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative flex flex-col justify-between transition-colors"
            >
              <div>
                <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-400 font-black text-xs flex items-center justify-center mb-3">
                  0{item.step}
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">{item.label}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{item.desc}</p>
              </div>
              {idx < workflowSteps.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-300 dark:text-slate-600">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* TOP COMMUNITY IDEAS PREVIEW */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Top Validated Ideas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Leading the live campus leaderboard right now.
            </p>
          </div>
          {ideas.length > 0 && (
            <button
              onClick={() => onNavigate('leaderboard')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
            >
              <span>View All Ranks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {topIdeas.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center max-w-md mx-auto transition-colors">
            <Lightbulb className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
              No ideas submitted yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
              Be the first student to publish an anonymous idea and start collecting peer validation!
            </p>
            <button
              onClick={() => onNavigate('submit')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Your First Idea</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topIdeas.map((idea, index) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                rank={index + 1}
                onSelect={onSelectIdea}
                onOpenFeedback={onOpenFeedback}
                onVoteChange={onVoteChange}
                onDelete={(target) => setIdeaToDelete(target)}
              />
            ))}
          </div>
        )}
      </section>

      {/* CORE PILLARS EXPLANATION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl border border-white/5 dark:border-slate-800">
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-400 mb-2 block">
              Architected for University Innovation
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
              Why Anonymous Validation Works Better
            </h2>
            <p className="text-sm text-indigo-200 dark:text-indigo-300 leading-relaxed">
              When ideas are separated from personal egos and popularity contests, feedback becomes genuinely helpful, constructive, and focused on product-market fit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-xs">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
              <h3 className="font-extrabold text-sm mb-1.5 text-white">Anonymous by Design</h3>
              <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed">
                Zero public profiles, names, or bias. Ideas stand strictly on merit.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-xs">
              <CheckCircle2 className="w-6 h-6 text-indigo-400 mb-3" />
              <h3 className="font-extrabold text-sm mb-1.5 text-white">Guided Constructive Feedback</h3>
              <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed">
                Structured questions instead of blank boxes prevent toxicity and yield clear insights.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-xs">
              <Gauge className="w-6 h-6 text-amber-400 mb-3" />
              <h3 className="font-extrabold text-sm mb-1.5 text-white">5-Parameter Readiness</h3>
              <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed">
                Clarity, user value, feasibility, sustainability, and differentiation scored 1–5.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-xs">
              <TrendingUp className="w-6 h-6 text-purple-400 mb-3" />
              <h3 className="font-extrabold text-sm mb-1.5 text-white">Iterative Versioning</h3>
              <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed">
                Update descriptions, publish interview evidence, and reassess your scores over time.
              </p>
            </div>
          </div>
        </div>
      </section>
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

