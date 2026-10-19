import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { ExploreIdeasPage } from './pages/ExploreIdeasPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SubmitIdeaPage } from './pages/SubmitIdeaPage';
import { IdeaDetailPage } from './pages/IdeaDetailPage';
import { MyIdeasPage } from './pages/MyIdeasPage';
import { AccountUpgradeModal } from './components/AccountUpgradeModal';
import { FeedbackForm } from './components/FeedbackForm';
import { IdeaWithStats, Idea } from './types';
import { fetchAllIdeasWithStats, getAnonymousUserId, initRealtimeSync, deleteIdea, recordIdeaDeleted, getDeletedIdeaIds } from './services/storageService';
import { Theme, getInitialTheme, applyTheme } from './utils/theme';
import { Lightbulb } from 'lucide-react';

export function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [currentView, setCurrentView] = useState<'home' | 'explore' | 'leaderboard' | 'submit' | 'my-ideas' | 'detail'>('home');
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<IdeaWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [feedbackModalIdea, setFeedbackModalIdea] = useState<IdeaWithStats | null>(null);

  // Apply theme class to document root
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const loadAllIdeas = async (isBackground = false) => {
    if (!isBackground && ideas.length === 0) {
      setLoading(true);
    }
    try {
      const data = await fetchAllIdeasWithStats();
      if (data) {
        const deletedIds = getDeletedIdeaIds();
        setIdeas(data.filter((i) => !deletedIds.has(i.id)));
      }
    } catch (err) {
      console.error('Error loading ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize anonymous session
    getAnonymousUserId();

    loadAllIdeas();

    // Listen to local reactive storage events in background
    const handleSync = () => {
      loadAllIdeas(true);
    };
    window.addEventListener('ideapulse_sync', handleSync);

    // Listen to live Supabase Realtime changes across all devices in background
    const unsubscribeRealtime = initRealtimeSync(() => {
      loadAllIdeas(true);
    });

    return () => {
      window.removeEventListener('ideapulse_sync', handleSync);
      unsubscribeRealtime();
    };
  }, []);

  const handleSelectIdea = (idea: IdeaWithStats) => {
    setSelectedIdeaId(idea.id);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenFeedback = (idea: IdeaWithStats) => {
    setFeedbackModalIdea(idea);
  };

  const handleVoteChange = (ideaId: string, newCount: number, hasVoted: boolean) => {
    setIdeas((prev) =>
      prev.map((item) =>
        item.id === ideaId
          ? {
              ...item,
              vote_count: newCount,
              has_voted: hasVoted,
              last_activity_at: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const handleIdeaCreated = (newIdea: Idea) => {
    const optimisticIdea: IdeaWithStats = {
      ...newIdea,
      vote_count: 0,
      feedback_count: 0,
      has_voted: false,
      self_assessment: {
        id: 'self-' + newIdea.id,
        idea_id: newIdea.id,
        assessor_id: newIdea.creator_id,
        assessment_type: 'self',
        problem_clarity: 4,
        user_value: 4,
        feasibility: 3,
        sustainability: 3,
        validation: 3,
        created_at: newIdea.created_at,
        updated_at: newIdea.updated_at,
      },
      peer_assessments_count: 0,
      peer_average_scores: {
        problem_clarity: 4,
        user_value: 4,
        feasibility: 3,
        sustainability: 3,
        validation: 3,
      },
      overall_readiness_percentage: 68,
      is_creator: true,
    };

    setIdeas((prev) => [optimisticIdea, ...prev.filter((i) => i.id !== newIdea.id)]);
    setSelectedIdeaId(newIdea.id);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    loadAllIdeas(true);
  };

  const handleDeleteIdea = async (ideaId: string) => {
    // 1. Immediately record in persistent deleted registry synchronously
    recordIdeaDeleted(ideaId);

    // 2. Immediately remove from React state optimistically
    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    if (selectedIdeaId === ideaId) {
      setSelectedIdeaId(null);
      setCurrentView('my-ideas');
    }

    // 3. Blacklist and remove in storage and Supabase
    await deleteIdea(ideaId);

    // 4. Refresh fresh ideas list and guarantee deleted idea is filtered out
    const freshData = await fetchAllIdeasWithStats();
    if (freshData) {
      const deletedIds = getDeletedIdeaIds();
      setIdeas(freshData.filter((i) => !deletedIds.has(i.id) && i.id !== ideaId));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Header Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          setSelectedIdeaId(null);
        }}
        onOpenRecoveryModal={() => setIsRecoveryModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {loading && ideas.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Loading IdeaPulse Platform...
            </p>
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <HomePage
                ideas={ideas}
                onNavigate={(view) => setCurrentView(view)}
                onSelectIdea={handleSelectIdea}
                onOpenFeedback={handleOpenFeedback}
                onVoteChange={handleVoteChange}
                onDeleteIdea={handleDeleteIdea}
              />
            )}

            {currentView === 'explore' && (
              <ExploreIdeasPage
                ideas={ideas}
                onSelectIdea={handleSelectIdea}
                onOpenFeedback={handleOpenFeedback}
                onNavigateToSubmit={() => setCurrentView('submit')}
                onVoteChange={handleVoteChange}
                onDeleteIdea={handleDeleteIdea}
              />
            )}

            {currentView === 'leaderboard' && (
              <LeaderboardPage
                ideas={ideas}
                onSelectIdea={handleSelectIdea}
                onOpenFeedback={handleOpenFeedback}
                onNavigateToSubmit={() => setCurrentView('submit')}
                onVoteChange={handleVoteChange}
                onDeleteIdea={handleDeleteIdea}
              />
            )}

            {currentView === 'submit' && (
              <SubmitIdeaPage
                onSuccess={handleIdeaCreated}
                onCancel={() => setCurrentView('explore')}
              />
            )}

            {currentView === 'my-ideas' && (
              <MyIdeasPage
                ideas={ideas}
                onSelectIdea={handleSelectIdea}
                onOpenFeedback={handleOpenFeedback}
                onNavigateToSubmit={() => setCurrentView('submit')}
                onOpenRecoveryModal={() => setIsRecoveryModalOpen(true)}
                onVoteChange={handleVoteChange}
                onDeleteIdea={handleDeleteIdea}
              />
            )}

            {currentView === 'detail' && selectedIdeaId && (
              <IdeaDetailPage
                ideaId={selectedIdeaId}
                initialIdea={ideas.find((i) => i.id === selectedIdeaId)}
                onBack={() => {
                  setSelectedIdeaId(null);
                  setCurrentView('explore');
                }}
                onVoteChange={handleVoteChange}
                onDeleteIdea={handleDeleteIdea}
              />
            )}
          </>
        )}
      </main>

      {/* Standalone Feedback Modal when invoked from Idea Cards */}
      {feedbackModalIdea && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full my-8">
            <FeedbackForm
              ideaId={feedbackModalIdea.id}
              ideaTitle={feedbackModalIdea.title}
              existingFeedback={feedbackModalIdea.user_feedback}
              onSuccess={() => {
                setFeedbackModalIdea(null);
                loadAllIdeas();
              }}
              onCancel={() => setFeedbackModalIdea(null)}
            />
          </div>
        </div>
      )}

      {/* Account Upgrade & Recovery Credentials Modal */}
      <AccountUpgradeModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">IdeaPulse</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Turn ideas into validated opportunities • Anonymous Student Validation
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <button onClick={() => setCurrentView('home')} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
              Home
            </button>
            <button onClick={() => setCurrentView('explore')} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
              Explore Ideas
            </button>
            <button onClick={() => setCurrentView('leaderboard')} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
              Leaderboard
            </button>
            <button onClick={() => setCurrentView('submit')} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
              Submit Idea
            </button>
            <button onClick={() => setCurrentView('my-ideas')} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
              My Ideas
            </button>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center md:text-right">
            <span>Protected by cryptographic anonymous authentication.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
