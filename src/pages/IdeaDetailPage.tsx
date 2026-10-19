import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Gauge, 
  MessageSquare, 
  Target, 
  GitBranch, 
  Info,
  Trash2
} from 'lucide-react';
import { IdeaWithStats, IdeaVersion, ImprovementTask, FeedbackItem, ReadinessAssessment } from '../types';
import { fetchIdeaById, isIdeaDeleted } from '../services/storageService';
import { VoteButton } from '../components/VoteButton';
import { ReadinessScore } from '../components/ReadinessScore';
import { FeedbackForm } from '../components/FeedbackForm';
import { FeedbackSummary } from '../components/FeedbackSummary';
import { AssessmentForm } from '../components/AssessmentForm';
import { ImprovementPlan } from '../components/ImprovementPlan';
import { IdeaVersionsTimeline } from '../components/IdeaVersionsTimeline';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

interface IdeaDetailPageProps {
  ideaId: string;
  initialIdea?: IdeaWithStats;
  onBack: () => void;
  onVoteChange?: (ideaId: string, newCount: number, hasVoted: boolean) => void;
  onDeleteIdea?: (ideaId: string) => Promise<void> | void;
}

type TabType = 'overview' | 'feedback' | 'assessment' | 'plan' | 'iterations';

export const IdeaDetailPage: React.FC<IdeaDetailPageProps> = ({
  ideaId,
  initialIdea,
  onBack,
  onVoteChange,
  onDeleteIdea,
}) => {
  const [data, setData] = useState<{
    idea: IdeaWithStats | null;
    versions: IdeaVersion[];
    tasks: ImprovementTask[];
    feedbacks: FeedbackItem[];
    peerAssessments: ReadinessAssessment[];
  } | null>(
    initialIdea
      ? {
          idea: initialIdea,
          versions: [],
          tasks: [],
          feedbacks: [],
          peerAssessments: [],
        }
      : null
  );

  const [loading, setLoading] = useState(!initialIdea);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copyShareFeedback, setCopyShareFeedback] = useState(false);

  const loadData = async () => {
    if (isIdeaDeleted(ideaId)) {
      setData(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetchIdeaById(ideaId);
      if (res && res.idea && !isIdeaDeleted(res.idea.id)) {
        setData(res);
      } else if (initialIdea && !isIdeaDeleted(initialIdea.id)) {
        setData({
          idea: initialIdea,
          versions: res?.versions || [],
          tasks: res?.tasks || [],
          feedbacks: res?.feedbacks || [],
          peerAssessments: res?.peerAssessments || [],
        });
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Error loading idea details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!initialIdea || initialIdea.id !== ideaId) {
      setLoading(true);
    }

    // Safety timeout: Never stay stuck in loading state for more than 2.5s
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    loadData().finally(() => {
      if (isMounted) {
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    });

    const handleSync = () => loadData();
    window.addEventListener('ideapulse_sync', handleSync);
    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      window.removeEventListener('ideapulse_sync', handleSync);
    };
  }, [ideaId]);

  if (loading && (!data || !data.idea)) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading idea details...</p>
      </div>
    );
  }

  if (!data || !data.idea || isIdeaDeleted(data.idea.id)) {
    return (
      <div className="py-16 text-center max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mx-auto mb-3">
          <Info className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Idea Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          This idea has been deleted or is not available.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
        >
          Browse All Ideas
        </button>
      </div>
    );
  }

  const { idea, versions, tasks, feedbacks } = data;
  const isCreator = idea.is_creator;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyShareFeedback(true);
    setTimeout(() => setCopyShareFeedback(false), 2000);
  };

  const handleConfirmDelete = async () => {
    if (onDeleteIdea && idea) {
      setShowDeleteModal(false);
      const targetId = idea.id;
      setData(null);
      await onDeleteIdea(targetId);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Navigation & Back Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Ideas</span>
        </button>

        <div className="flex items-center space-x-2">
          {isCreator && (
            <>
              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>You Created This</span>
              </span>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 transition cursor-pointer"
                title="Delete this idea"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Idea</span>
              </button>
            </>
          )}

          <button
            onClick={handleShare}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copyShareFeedback ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {idea.category}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Anonymous Student Submission</span>
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                • {new Date(idea.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {idea.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              "{idea.description}"
            </p>

            {/* Problem & Target Users Badges */}
            {(idea.problem_statement || idea.target_users) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                {idea.problem_statement && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <strong className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                      Problem Statement
                    </strong>
                    <p className="text-slate-800 dark:text-slate-200">{idea.problem_statement}</p>
                  </div>
                )}
                {idea.target_users && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <strong className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                      Target Users
                    </strong>
                    <p className="text-slate-800 dark:text-slate-200">{idea.target_users}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Action Side-Card (Upvote, Readiness, Feedback Button) */}
          <div className="flex flex-row lg:flex-col items-center justify-between lg:justify-center p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 shrink-0 gap-4">
            <div className="flex items-center space-x-3">
              <VoteButton
                ideaId={idea.id}
                initialVoteCount={idea.vote_count}
                initialHasVoted={idea.has_voted}
                layout="vertical"
                size="md"
                onVoteChange={(newCount, hasVoted) => {
                  if (onVoteChange) {
                    onVoteChange(idea.id, newCount, hasVoted);
                  }
                  loadData();
                }}
              />
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Readiness
                </span>
                <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400">
                  {idea.overall_readiness_percentage}%
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('feedback');
                setShowFeedbackModal(true);
              }}
              className="w-full text-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              {idea.user_feedback ? 'Edit Feedback' : 'Give Feedback'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-2 border-b border-slate-200 dark:border-slate-800 mt-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview & Scores', icon: Gauge },
            { id: 'feedback', label: `Feedback (${feedbacks.length})`, icon: MessageSquare },
            { id: 'assessment', label: isCreator ? 'Self-Assessment' : 'Peer Assessment', icon: isCreator ? UserCheck : Users },
            { id: 'plan', label: `Action Plan (${tasks.length})`, icon: Target },
            { id: 'iterations', label: `Iterations (${versions.length})`, icon: GitBranch },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setShowFeedbackModal(false);
                  setShowAssessmentModal(false);
                }}
                className={`flex items-center space-x-1.5 px-3.5 py-3 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/40 rounded-t-xl'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT SECTIONS */}

      {/* 1. OVERVIEW & READINESS BREAKDOWN */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ReadinessScore
              selfAssessment={idea.self_assessment}
              peerAssessmentsCount={idea.peer_assessments_count}
              peerAverageScores={idea.peer_average_scores}
              overallPercentage={idea.overall_readiness_percentage}
            />

            {/* Quick action cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setActiveTab('feedback')}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/60 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>Constructive Feedback</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {feedbacks.length} reviews submitted by verified peers.
                </p>
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">View aggregate responses →</span>
              </div>

              <div
                onClick={() => setActiveTab('plan')}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/60 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-1">
                  <Target className="w-4 h-4" />
                  <span>Improvement Roadmap</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {tasks.filter((t) => t.status === 'completed').length} of {tasks.length} milestones complete.
                </p>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">View action tasks →</span>
              </div>
            </div>
          </div>

          {/* Right sidebar: Peer Assessment Quick Card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Validate This Idea</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {isCreator
                  ? 'As the creator, you can perform self-assessments and publish iterative evidence.'
                  : 'Your peer score counts directly toward the 50% community validation readiness score.'}
              </p>

              {isCreator ? (
                <button
                  onClick={() => {
                    setActiveTab('assessment');
                    setShowAssessmentModal(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800/60 transition cursor-pointer"
                >
                  Edit Self-Assessment
                </button>
              ) : (
                <button
                  onClick={() => {
                    setActiveTab('assessment');
                    setShowAssessmentModal(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  {idea.user_peer_assessment ? 'Update Peer Assessment' : 'Rate Readiness (1–5)'}
                </button>
              )}
            </div>

            {/* Validation loop reminder */}
            <div className="bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-5 text-xs text-indigo-950 dark:text-indigo-200">
              <span className="font-bold block mb-1 text-indigo-900 dark:text-indigo-300">
                The Product Loop in Action
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Submit → Vote → Feedback → Assess → Improve → Reassess.
                Ideas continuously mature based on empirical feedback.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONSTRUCTIVE FEEDBACK TAB */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {showFeedbackModal && (
            <FeedbackForm
              ideaId={idea.id}
              ideaTitle={idea.title}
              existingFeedback={idea.user_feedback}
              onSuccess={() => {
                setShowFeedbackModal(false);
                loadData();
              }}
              onCancel={() => setShowFeedbackModal(false)}
            />
          )}

          <FeedbackSummary
            feedbacks={feedbacks}
            userFeedback={idea.user_feedback}
            onOpenFeedbackModal={() => setShowFeedbackModal(true)}
          />
        </div>
      )}

      {/* 3. READINESS ASSESSMENT TAB */}
      {activeTab === 'assessment' && (
        <div className="space-y-6">
          <AssessmentForm
            ideaId={idea.id}
            isCreator={isCreator}
            existingAssessment={isCreator ? idea.self_assessment : idea.user_peer_assessment}
            onSuccess={() => {
              loadData();
            }}
          />

          <ReadinessScore
            selfAssessment={idea.self_assessment}
            peerAssessmentsCount={idea.peer_assessments_count}
            peerAverageScores={idea.peer_average_scores}
            overallPercentage={idea.overall_readiness_percentage}
          />
        </div>
      )}

      {/* 4. IMPROVEMENT PLAN TAB */}
      {activeTab === 'plan' && (
        <ImprovementPlan
          ideaId={idea.id}
          isCreator={isCreator}
          tasks={tasks}
          scores={idea.peer_average_scores || (idea.self_assessment as any)}
          onTasksUpdated={loadData}
        />
      )}

      {/* 5. ITERATION & VERSIONS TAB */}
      {activeTab === 'iterations' && (
        <IdeaVersionsTimeline
          ideaId={idea.id}
          isCreator={isCreator}
          versions={versions}
          onVersionAdded={loadData}
          onOpenReassessModal={() => setActiveTab('assessment')}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        ideaTitle={idea.title}
        onConfirm={handleConfirmDelete}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
