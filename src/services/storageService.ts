import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Idea,
  Vote,
  FeedbackItem,
  FeedbackReport,
  ReadinessAssessment,
  IdeaVersion,
  ImprovementTask,
  IdeaWithStats,
  AssessmentScores,
} from '../types';
import { calculateOverallReadiness, generateImprovementRecommendations } from '../utils/scoring';
import { calculateFeedbackAggregates } from '../utils/feedback';
import { sortIdeasByLeaderboard } from '../utils/sorting';

const ANONYMOUS_USER_KEY = 'ideapulse_anonymous_uid';
const RECOVERY_KEY_PREFIX = 'ideapulse_recovery_code';
const STORAGE_PREFIX = 'ideapulse_db_v1_';
const DELETED_IDEAS_KEY = `${STORAGE_PREFIX}deleted_idea_ids`;
const MY_CREATOR_IDS_KEY = `${STORAGE_PREFIX}my_creator_ids`;
const MY_IDEA_IDS_KEY = `${STORAGE_PREFIX}my_idea_ids`;

const memoryStore: Record<string, string> = {};
export const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof localStorage !== 'undefined') {
      try {
        const val = localStorage.getItem(key);
        if (val !== null) return val;
      } catch {
        return memoryStore[key] || null;
      }
    }
    return memoryStore[key] || null;
  },
  setItem: (key: string, value: string): void => {
    memoryStore[key] = value;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Fallback to memoryStore
      }
    }
  },
  removeItem: (key: string): void => {
    delete memoryStore[key];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {
        // Fallback
      }
    }
  },
};

const inMemoryDeletedIds = new Set<string>();

export function getDeletedIdeaIds(): Set<string> {
  try {
    const raw = safeStorage.getItem(DELETED_IDEAS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      parsed.forEach((id) => {
        if (id) inMemoryDeletedIds.add(id);
      });
    }
  } catch {
    // Ignore parse error
  }
  return inMemoryDeletedIds;
}

export function isIdeaDeleted(id: string): boolean {
  if (!id) return false;
  return getDeletedIdeaIds().has(id);
}

export function recordIdeaDeleted(id: string): void {
  if (!id) return;
  inMemoryDeletedIds.add(id);
  try {
    safeStorage.setItem(DELETED_IDEAS_KEY, JSON.stringify(Array.from(inMemoryDeletedIds)));
  } catch (e) {
    console.warn('Failed to record deleted idea id:', e);
  }
}

export function getMyIdeaIds(): Set<string> {
  const set = new Set<string>();
  try {
    const raw = safeStorage.getItem(MY_IDEA_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      parsed.forEach((id) => set.add(id));
    }
    const localIdeas: Idea[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}ideas`) || '[]');
    localIdeas.forEach((i) => {
      if (i && i.id) set.add(i.id);
    });
  } catch {
    // Ignore
  }
  return set;
}

export function recordMyIdea(ideaId: string): void {
  if (!ideaId) return;
  try {
    const set = getMyIdeaIds();
    set.add(ideaId);
    safeStorage.setItem(MY_IDEA_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore
  }
}

export function getMyCreatorIds(): Set<string> {
  const set = new Set<string>();
  try {
    const raw = safeStorage.getItem(MY_CREATOR_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      parsed.forEach((id) => set.add(id));
    }
    const current = safeStorage.getItem(ANONYMOUS_USER_KEY);
    if (current) set.add(current);
    if (cachedSupabaseUserId) set.add(cachedSupabaseUserId);

    const localIdeas: Idea[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}ideas`) || '[]');
    localIdeas.forEach((i) => {
      if (i && i.creator_id) set.add(i.creator_id);
    });
  } catch {
    // Ignore
  }
  return set;
}

export function recordCreatorId(creatorId: string): void {
  if (!creatorId) return;
  try {
    const set = getMyCreatorIds();
    set.add(creatorId);
    safeStorage.setItem(MY_CREATOR_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore
  }
}


/**
 * Universal UUID v4 generator that works in all browsers,
 * including insecure contexts (e.g., local network IP on mobile devices)
 * where window.crypto.randomUUID is not available.
 */
export function safeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback below
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
}

/**
 * Promise timeout utility so Supabase calls never freeze the UI.
 */
export async function withTimeout<T>(
  promiseLike: PromiseLike<T> | Promise<T>,
  ms = 4000,
  fallbackValue?: T
): Promise<T> {
  const promise = Promise.resolve(promiseLike);
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      resolve(fallbackValue as T);
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

let cachedSupabaseUserId: string | null = null;
let authInitPromise: Promise<string> | null = null;

export async function getAnonymousUserId(): Promise<string> {
  if (cachedSupabaseUserId && isValidUUID(cachedSupabaseUserId)) {
    return cachedSupabaseUserId;
  }

  // Retrieve or sanitize local storage UID
  let localUid = safeStorage.getItem(ANONYMOUS_USER_KEY);
  if (localUid && localUid.startsWith('anon-')) {
    // Strip old non-standard prefix so PostgreSQL UUID columns don't fail
    const stripped = localUid.replace(/^anon-/, '');
    localUid = isValidUUID(stripped) ? stripped : safeUUID();
    safeStorage.setItem(ANONYMOUS_USER_KEY, localUid);
  } else if (!localUid || !isValidUUID(localUid)) {
    localUid = safeUUID();
    safeStorage.setItem(ANONYMOUS_USER_KEY, localUid);
  }

  if (isSupabaseConfigured() && supabase) {
    if (authInitPromise) {
      return authInitPromise;
    }

    authInitPromise = (async () => {
      try {
        // Check existing authenticated session with safety timeout
        const sessionRes = await withTimeout(
          supabase.auth.getSession(),
          3000,
          { data: { session: null }, error: null } as any
        );

        if (sessionRes?.data?.session?.user?.id && isValidUUID(sessionRes.data.session.user.id)) {
          const validId = sessionRes.data.session.user.id;
          cachedSupabaseUserId = validId;
          safeStorage.setItem(ANONYMOUS_USER_KEY, validId);
          recordCreatorId(validId);
          return validId;
        }

        // Sign in anonymously to get an authentic UUID for Supabase RLS
        const signInRes = await withTimeout(
          supabase.auth.signInAnonymously(),
          3500,
          { data: { user: null }, error: new Error('Auth timeout') } as any
        );

        if (!signInRes?.error && signInRes?.data?.user?.id && isValidUUID(signInRes.data.user.id)) {
          const validId = signInRes.data.user.id;
          cachedSupabaseUserId = validId;
          safeStorage.setItem(ANONYMOUS_USER_KEY, validId);
          recordCreatorId(validId);
          return validId;
        }
      } catch (err) {
        console.warn('Supabase anonymous sign-in note:', err);
      } finally {
        authInitPromise = null;
      }

      cachedSupabaseUserId = localUid;
      recordCreatorId(localUid);
      return localUid;
    })();

    return authInitPromise;
  }

  cachedSupabaseUserId = localUid;
  recordCreatorId(localUid);
  return localUid;
}

export function getRecoveryCode(): string {
  let code = safeStorage.getItem(RECOVERY_KEY_PREFIX);
  if (!code) {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                      Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                      Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `PULSE-${randomHex}`;
    safeStorage.setItem(RECOVERY_KEY_PREFIX, code);
  }
  return code;
}

export function restoreSessionWithRecoveryCode(code: string): boolean {
  if (!code || !code.startsWith('PULSE-')) return false;
  safeStorage.setItem(RECOVERY_KEY_PREFIX, code.trim());
  return true;
}

// Global active Realtime channel reference for cross-device broadcast
let activeRealtimeChannel: any = null;

// Broadcast event helper for live reactive UI across local tabs and remote devices
export function notifyStorageChange() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('ideapulse_sync', { detail: { timestamp: Date.now() } }));
  }

  // Also broadcast over Supabase Realtime channel to other devices instantly
  if (isSupabaseConfigured() && supabase && activeRealtimeChannel) {
    try {
      activeRealtimeChannel.send({
        type: 'broadcast',
        event: 'ideapulse_device_sync',
        payload: { timestamp: Date.now() },
      }).catch(() => {});
    } catch {
      // Ignored
    }
  }
}

// ==========================================
// REALTIME MULTI-DEVICE SUBSCRIPTION
// ==========================================

export function initRealtimeSync(onUpdate: () => void): () => void {
  if (!isSupabaseConfigured() || !supabase) {
    return () => {};
  }

  try {
    const channelName = 'ideapulse-realtime-global';
    const channel = supabase.channel(channelName);
    activeRealtimeChannel = channel;

    channel
      .on('broadcast', { event: 'ideapulse_device_sync' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'readiness_assessments' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'idea_versions' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'improvement_tasks' }, () => {
        onUpdate();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime synchronized across all devices');
        }
      });

    // Periodic heartbeat sync every 15s when tab is active (ensures mobile devices & sleep wakeups stay fresh)
    const intervalTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        onUpdate();
      }
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        onUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      activeRealtimeChannel = null;
      supabase?.removeChannel(channel);
    };
  } catch (e) {
    console.warn('Realtime subscription error:', e);
    return () => {};
  }
}

// ==========================================
// SEED DATA: Realistic student startup ideas
// ==========================================
// SEED DATA: Removed default ideas as requested
// ==========================================

const SEED_IDEAS: Idea[] = [];

const SEED_DEMO_IDS = [
  'b1111111-1111-4111-8111-111111111111',
  'b2222222-2222-4222-8222-222222222222',
  'b3333333-3333-4333-8333-333333333333',
  'b4444444-4444-4444-8444-444444444444',
  'b5555555-5555-4555-8555-555555555555',
];

// Local storage init & demo purge helper
function initializeLocalStorage() {
  const isPurged = safeStorage.getItem(`${STORAGE_PREFIX}demo_purged_v3`);
  if (!isPurged) {
    try {
      const storedIdeas: Idea[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}ideas`) || '[]');
      const userIdeas = storedIdeas.filter((i) => !i.is_demo && !SEED_DEMO_IDS.includes(i.id));
      safeStorage.setItem(`${STORAGE_PREFIX}ideas`, JSON.stringify(userIdeas));

      const storedVotes: Vote[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}votes`) || '[]');
      safeStorage.setItem(`${STORAGE_PREFIX}votes`, JSON.stringify(storedVotes.filter((v) => !SEED_DEMO_IDS.includes(v.idea_id))));

      const storedFeedback: FeedbackItem[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}feedback`) || '[]');
      safeStorage.setItem(`${STORAGE_PREFIX}feedback`, JSON.stringify(storedFeedback.filter((f) => !SEED_DEMO_IDS.includes(f.idea_id))));

      const storedAssessments: ReadinessAssessment[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}assessments`) || '[]');
      safeStorage.setItem(`${STORAGE_PREFIX}assessments`, JSON.stringify(storedAssessments.filter((a) => !SEED_DEMO_IDS.includes(a.idea_id))));

      const storedVersions: IdeaVersion[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}versions`) || '[]');
      safeStorage.setItem(`${STORAGE_PREFIX}versions`, JSON.stringify(storedVersions.filter((v) => !SEED_DEMO_IDS.includes(v.idea_id))));

      const storedTasks: ImprovementTask[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}tasks`) || '[]');
      safeStorage.setItem(`${STORAGE_PREFIX}tasks`, JSON.stringify(storedTasks.filter((t) => !SEED_DEMO_IDS.includes(t.idea_id))));
    } catch (e) {
      console.warn('Storage purge error:', e);
    }
    safeStorage.setItem(`${STORAGE_PREFIX}demo_purged_v3`, 'true');
  }

  if (!safeStorage.getItem(`${STORAGE_PREFIX}initialized`)) {
    safeStorage.setItem(`${STORAGE_PREFIX}ideas`, JSON.stringify([]));
    safeStorage.setItem(`${STORAGE_PREFIX}votes`, JSON.stringify([]));
    safeStorage.setItem(`${STORAGE_PREFIX}feedback`, JSON.stringify([]));
    safeStorage.setItem(`${STORAGE_PREFIX}assessments`, JSON.stringify([]));
    safeStorage.setItem(`${STORAGE_PREFIX}versions`, JSON.stringify([]));
    safeStorage.setItem(`${STORAGE_PREFIX}tasks`, JSON.stringify([]));
    safeStorage.setItem(`${STORAGE_PREFIX}reports`, JSON.stringify([]));
    safeStorage.setItem(`${STORAGE_PREFIX}initialized`, 'true');
  }
}
initializeLocalStorage();

// ==========================================
// DATA ACCESS LAYER (HYBRID SUPABASE + LOCAL)
// ==========================================

export async function fetchAllIdeasWithStats(): Promise<IdeaWithStats[]> {
  const currentUserId = await getAnonymousUserId();
  const deletedIds = getDeletedIdeaIds();

  // If Supabase is configured and live, pull from PostgreSQL with a safe timeout
  if (isSupabaseConfigured() && supabase) {
    try {
      const ideasPromise = supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false });

      const res = await withTimeout(ideasPromise, 4500, { data: null, error: new Error('Timeout') } as any);

      if (!res.error && res.data) {
        const filtered = (res.data as Idea[]).filter(
          (idea) =>
            !deletedIds.has(idea.id) &&
            !SEED_DEMO_IDS.includes(idea.id) &&
            idea.category !== '[DELETED]' &&
            !idea.title.startsWith('[DELETED]') &&
            idea.description !== '[DELETED]'
        );
        return processSupabaseIdeas(filtered, currentUserId);
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back locally:', err);
    }
  }

  // Local storage fallback
  return getLocalIdeasWithStats(currentUserId);
}

async function processSupabaseIdeas(rawIdeas: Idea[], currentUserId: string): Promise<IdeaWithStats[]> {
  if (!supabase) return [];
  const deletedIds = getDeletedIdeaIds();
  const myCreatorIds = getMyCreatorIds();
  const myIdeaIds = getMyIdeaIds();

  const filteredRaw = rawIdeas.filter(
    (i) =>
      !deletedIds.has(i.id) &&
      !SEED_DEMO_IDS.includes(i.id) &&
      i.category !== '[DELETED]' &&
      !i.title.startsWith('[DELETED]') &&
      i.description !== '[DELETED]'
  );

  try {
    const statsPromise = Promise.all([
      supabase.from('votes').select('*'),
      supabase.from('feedback').select('*'),
      supabase.from('readiness_assessments').select('*'),
    ]);

    const [votesRes, feedbackRes, assessRes] = await withTimeout(
      statsPromise,
      3500,
      [{ data: [] }, { data: [] }, { data: [] }] as any
    );

    const allVotes: Vote[] = votesRes?.data || [];
    const allFeedback: FeedbackItem[] = feedbackRes?.data || [];
    const allAssessments: ReadinessAssessment[] = assessRes?.data || [];

    const enriched: IdeaWithStats[] = filteredRaw.map((idea) => {
      const ideaVotes = allVotes.filter((v) => v.idea_id === idea.id);
      const ideaFeedback = allFeedback.filter((f) => f.idea_id === idea.id);
      const ideaAssessments = allAssessments.filter((a) => a.idea_id === idea.id);

      const hasVoted = ideaVotes.some((v) => v.user_id === currentUserId);
      const selfAssessment = ideaAssessments.find((a) => a.assessment_type === 'self');
      const peerAssessments = ideaAssessments.filter((a) => a.assessment_type === 'peer');
      const userFeedback = ideaFeedback.find((f) => f.user_id === currentUserId);
      const userPeerAssessment = peerAssessments.find((a) => a.assessor_id === currentUserId);

      const selfAvg = selfAssessment
        ? (selfAssessment.problem_clarity +
            selfAssessment.user_value +
            selfAssessment.feasibility +
            selfAssessment.sustainability +
            selfAssessment.validation) / 5
        : 3.5;

      const readinessResult = calculateOverallReadiness(selfAvg, peerAssessments);
      const isCreator =
        idea.creator_id === currentUserId ||
        myCreatorIds.has(idea.creator_id) ||
        myIdeaIds.has(idea.id);

      return {
        ...idea,
        vote_count: ideaVotes.length,
        feedback_count: ideaFeedback.length,
        has_voted: hasVoted,
        self_assessment: selfAssessment,
        peer_assessments_count: peerAssessments.length,
        peer_average_scores: readinessResult.parameterAverages,
        overall_readiness_percentage: readinessResult.overallPercentage,
        is_creator: isCreator,
        user_feedback: userFeedback,
        user_peer_assessment: userPeerAssessment,
      };
    });

    return sortIdeasByLeaderboard(enriched);
  } catch (e) {
    console.warn('Error processing Supabase ideas, returning basic mapped:', e);
    return sortIdeasByLeaderboard(
      filteredRaw.map((idea) => ({
        ...idea,
        vote_count: 0,
        feedback_count: 0,
        has_voted: false,
        peer_assessments_count: 0,
        overall_readiness_percentage: 60,
        is_creator:
          idea.creator_id === currentUserId ||
          myCreatorIds.has(idea.creator_id) ||
          myIdeaIds.has(idea.id),
      }))
    );
  }
}

function getLocalIdeasWithStats(currentUserId: string): IdeaWithStats[] {
  const deletedIds = getDeletedIdeaIds();
  const myCreatorIds = getMyCreatorIds();
  const myIdeaIds = getMyIdeaIds();

  const rawIdeas: Idea[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}ideas`) || '[]');
  const ideas: Idea[] = rawIdeas.filter(
    (i) =>
      !deletedIds.has(i.id) &&
      !SEED_DEMO_IDS.includes(i.id) &&
      i.category !== '[DELETED]' &&
      !i.title.startsWith('[DELETED]') &&
      i.description !== '[DELETED]'
  );
  const votes: Vote[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}votes`) || '[]');
  const feedback: FeedbackItem[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}feedback`) || '[]');
  const assessments: ReadinessAssessment[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}assessments`) || '[]');

  const enriched: IdeaWithStats[] = ideas.map((idea) => {
    const ideaVotes = votes.filter((v) => v.idea_id === idea.id);
    const ideaFeedback = feedback.filter((f) => f.idea_id === idea.id);
    const ideaAssessments = assessments.filter((a) => a.idea_id === idea.id);

    const hasVoted = ideaVotes.some((v) => v.user_id === currentUserId);
    const selfAssessment = ideaAssessments.find((a) => a.assessment_type === 'self');
    const peerAssessments = ideaAssessments.filter((a) => a.assessment_type === 'peer');
    const userFeedback = ideaFeedback.find((f) => f.user_id === currentUserId);
    const userPeerAssessment = peerAssessments.find((a) => a.assessor_id === currentUserId);

    const selfAvg = selfAssessment
      ? (selfAssessment.problem_clarity +
          selfAssessment.user_value +
          selfAssessment.feasibility +
          selfAssessment.sustainability +
          selfAssessment.validation) / 5
      : 3.5;

    const readinessResult = calculateOverallReadiness(selfAvg, peerAssessments);
    const isCreator =
      idea.creator_id === currentUserId ||
      myCreatorIds.has(idea.creator_id) ||
      myIdeaIds.has(idea.id);

    return {
      ...idea,
      vote_count: ideaVotes.length,
      feedback_count: ideaFeedback.length,
      has_voted: hasVoted,
      self_assessment: selfAssessment,
      peer_assessments_count: peerAssessments.length,
      peer_average_scores: readinessResult.parameterAverages,
      overall_readiness_percentage: readinessResult.overallPercentage,
      is_creator: isCreator,
      user_feedback: userFeedback,
      user_peer_assessment: userPeerAssessment,
    };
  });

  return sortIdeasByLeaderboard(enriched);
}

export async function fetchIdeaById(id: string): Promise<{
  idea: IdeaWithStats | null;
  versions: IdeaVersion[];
  tasks: ImprovementTask[];
  feedbacks: FeedbackItem[];
  peerAssessments: ReadinessAssessment[];
}> {
  if (!id || isIdeaDeleted(id)) {
    return {
      idea: null,
      versions: [],
      tasks: [],
      feedbacks: [],
      peerAssessments: [],
    };
  }

  const currentUserId = await getAnonymousUserId();

  let idea: IdeaWithStats | null = null;
  let versions: IdeaVersion[] = [];
  let tasks: ImprovementTask[] = [];
  let feedbacks: FeedbackItem[] = [];
  let peerAssessments: ReadinessAssessment[] = [];

  // 1. Direct fetch from Supabase if configured with quick timeout
  if (isSupabaseConfigured() && supabase) {
    try {
      const ideaQuery = supabase.from('ideas').select('*').eq('id', id).maybeSingle();
      const res = await withTimeout(ideaQuery, 3500, { data: null, error: null } as any);
      if (res?.data) {
        if (
          res.data.category === '[DELETED]' ||
          res.data.title.startsWith('[DELETED]') ||
          res.data.description === '[DELETED]'
        ) {
          recordIdeaDeleted(id);
          return {
            idea: null,
            versions: [],
            tasks: [],
            feedbacks: [],
            peerAssessments: [],
          };
        }
        const enrichedList = await processSupabaseIdeas([res.data], currentUserId);
        idea = enrichedList[0] || null;
      }

      // Fetch related sub-records
      const subQuery = Promise.all([
        supabase.from('idea_versions').select('*').eq('idea_id', id).order('version_number', { ascending: false }),
        supabase.from('improvement_tasks').select('*').eq('idea_id', id).order('priority', { ascending: true }),
        supabase.from('feedback').select('*').eq('idea_id', id).order('created_at', { ascending: false }),
        supabase.from('readiness_assessments').select('*').eq('idea_id', id).eq('assessment_type', 'peer'),
      ]);

      const [versionsRes, tasksRes, feedbackRes, assessRes] = await withTimeout(
        subQuery,
        3500,
        [{ data: [] }, { data: [] }, { data: [] }, { data: [] }] as any
      );

      versions = versionsRes?.data || [];
      tasks = tasksRes?.data || [];
      feedbacks = feedbackRes?.data || [];
      peerAssessments = assessRes?.data || [];
    } catch (e) {
      console.warn('Direct fetch from Supabase note:', e);
    }
  }

  // 2. If not found remotely, check local storage
  if (!idea) {
    const localList = getLocalIdeasWithStats(currentUserId);
    idea = localList.find((i) => i.id === id) || null;
  }

  // 3. Fallback versions, tasks, feedbacks from local storage if remote has none
  if (versions.length === 0) {
    versions = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}versions`) || '[]')
      .filter((v: IdeaVersion) => v.idea_id === id)
      .sort((a: IdeaVersion, b: IdeaVersion) => b.version_number - a.version_number);
  }
  if (tasks.length === 0) {
    tasks = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}tasks`) || '[]')
      .filter((t: ImprovementTask) => t.idea_id === id)
      .sort((a: ImprovementTask, b: ImprovementTask) => a.priority - b.priority);
  }
  if (feedbacks.length === 0) {
    feedbacks = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}feedback`) || '[]')
      .filter((f: FeedbackItem) => f.idea_id === id)
      .sort((a: FeedbackItem, b: FeedbackItem) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return { idea, versions, tasks, feedbacks, peerAssessments };
}

// ==========================================
// UPVOTE & WITHDRAW VOTE
// ==========================================

export async function toggleVote(ideaId: string): Promise<{ hasVoted: boolean; newCount: number }> {
  const currentUserId = await getAnonymousUserId();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: existing } = await withTimeout(
        supabase
          .from('votes')
          .select('id')
          .eq('idea_id', ideaId)
          .eq('user_id', currentUserId)
          .maybeSingle(),
        3500,
        { data: null } as any
      );

      let hasVoted = false;
      if (existing) {
        await supabase.from('votes').delete().eq('id', existing.id);
        hasVoted = false;
      } else {
        await supabase.from('votes').insert({ idea_id: ideaId, user_id: currentUserId });
        hasVoted = true;
      }

      const { count } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('idea_id', ideaId);
      notifyStorageChange();
      return { hasVoted, newCount: count || 0 };
    } catch (e) {
      console.warn('Supabase toggleVote error, falling back locally:', e);
    }
  }

  // Local storage fallback
  const votes: Vote[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}votes`) || '[]');
  const existingIndex = votes.findIndex((v) => v.idea_id === ideaId && v.user_id === currentUserId);

  let hasVoted = false;
  if (existingIndex >= 0) {
    votes.splice(existingIndex, 1);
    hasVoted = false;
  } else {
    votes.push({
      id: 'vote-' + safeUUID(),
      idea_id: ideaId,
      user_id: currentUserId,
      created_at: new Date().toISOString(),
    });
    hasVoted = true;
  }

  safeStorage.setItem(`${STORAGE_PREFIX}votes`, JSON.stringify(votes));
  notifyStorageChange();
  const newCount = votes.filter((v) => v.idea_id === ideaId).length;
  return { hasVoted, newCount };
}

// ==========================================
// SUBMIT NEW IDEA
// ==========================================

export async function submitIdea(data: {
  title: string;
  description: string;
  category: Idea['category'];
  problem_statement?: string;
  target_users?: string;
  initial_self_scores?: AssessmentScores;
}): Promise<Idea> {
  const currentUserId = await getAnonymousUserId();
  const ideaId = safeUUID();
  const now = new Date().toISOString();

  const newIdea: Idea = {
    id: ideaId,
    creator_id: currentUserId,
    title: data.title.trim(),
    description: data.description.trim(),
    category: data.category,
    problem_statement: data.problem_statement?.trim() || undefined,
    target_users: data.target_users?.trim() || undefined,
    created_at: now,
    updated_at: now,
    last_activity_at: now,
    is_demo: false,
  };

  const selfScores = data.initial_self_scores || {
    problem_clarity: 4,
    user_value: 4,
    feasibility: 3,
    sustainability: 3,
    validation: 3,
  };

  // 1. Always store locally first for instant, optimistic responsiveness
  const localIdeas: Idea[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}ideas`) || '[]');
  localIdeas.unshift(newIdea);
  safeStorage.setItem(`${STORAGE_PREFIX}ideas`, JSON.stringify(localIdeas));

  const localVersions: IdeaVersion[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}versions`) || '[]');
  localVersions.push({
    id: 'ver-' + safeUUID(),
    idea_id: ideaId,
    version_number: 1,
    title: 'Initial Concept',
    description: newIdea.description,
    evidence: newIdea.problem_statement ? `Problem: ${newIdea.problem_statement}` : 'Initial anonymous submission.',
    created_at: now,
  });
  safeStorage.setItem(`${STORAGE_PREFIX}versions`, JSON.stringify(localVersions));

  const localAssessments: ReadinessAssessment[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}assessments`) || '[]');
  localAssessments.push({
    id: 'assessment-' + safeUUID(),
    idea_id: ideaId,
    assessor_id: currentUserId,
    assessment_type: 'self',
    ...selfScores,
    created_at: now,
    updated_at: now,
  });
  safeStorage.setItem(`${STORAGE_PREFIX}assessments`, JSON.stringify(localAssessments));

  const recs = generateImprovementRecommendations(selfScores);
  const localTasks: ImprovementTask[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}tasks`) || '[]');
  recs.forEach((rec, idx) => {
    localTasks.push({
      id: 'task-' + safeUUID(),
      idea_id: ideaId,
      task: rec.recommendation,
      category: rec.category,
      priority: idx + 1,
      status: 'not_started',
      created_at: now,
    });
  });
  safeStorage.setItem(`${STORAGE_PREFIX}tasks`, JSON.stringify(localTasks));

  // 2. Synchronize to Supabase PostgreSQL with non-blocking resilience
  if (isSupabaseConfigured() && supabase) {
    try {
      const dbPayload = {
        id: ideaId,
        creator_id: currentUserId,
        title: newIdea.title,
        description: newIdea.description,
        category: newIdea.category,
        problem_statement: newIdea.problem_statement || null,
        target_users: newIdea.target_users || null,
        created_at: now,
        updated_at: now,
        last_activity_at: now,
      };

      const insertRes = await withTimeout(
        supabase.from('ideas').insert(dbPayload),
        5000,
        { error: new Error('Database insert timeout (idea saved locally)') } as any
      );

      if (insertRes?.error) {
        console.warn('Supabase idea insert note:', insertRes.error.message || insertRes.error);
      } else {
        // Attempt sub-tables asynchronously with Promise.allSettled so RLS policies on sub-tables
        // never abort or block idea publishing!
        Promise.allSettled([
          supabase.from('readiness_assessments').insert({
            idea_id: ideaId,
            assessor_id: currentUserId,
            assessment_type: 'self',
            ...selfScores,
          }),
          supabase.from('idea_versions').insert({
            idea_id: ideaId,
            version_number: 1,
            title: 'Initial Concept',
            description: newIdea.description,
            evidence: newIdea.problem_statement || 'Initial anonymous submission.',
          }),
          recs.length > 0
            ? supabase.from('improvement_tasks').insert(
                recs.map((rec, idx) => ({
                  idea_id: ideaId,
                  task: rec.recommendation,
                  category: rec.category,
                  priority: idx + 1,
                  status: 'not_started',
                }))
              )
            : Promise.resolve(),
        ]).then((settled) => {
          settled.forEach((res, index) => {
            if (res.status === 'rejected') {
              console.warn(`Sub-table ${index} insert note:`, res.reason);
            }
          });
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Supabase sync warning:', e);
    }
  }

  // Record idea and creator ownership in persistent storage
  recordMyIdea(ideaId);
  recordCreatorId(currentUserId);

  notifyStorageChange();
  return newIdea;
}

// ==========================================
// DELETE IDEA
// ==========================================

export async function deleteIdea(id: string): Promise<boolean> {
  if (!id) return false;

  // 1. Immediately record in persistent deleted registry synchronously
  recordIdeaDeleted(id);

  // 2. Delete from local storage collections
  try {
    const ideas: Idea[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}ideas`) || '[]');
    const updatedIdeas = ideas.filter((i) => i.id !== id);
    safeStorage.setItem(`${STORAGE_PREFIX}ideas`, JSON.stringify(updatedIdeas));

    const votes: Vote[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}votes`) || '[]');
    safeStorage.setItem(`${STORAGE_PREFIX}votes`, JSON.stringify(votes.filter((v) => v.idea_id !== id)));

    const feedback: FeedbackItem[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}feedback`) || '[]');
    safeStorage.setItem(`${STORAGE_PREFIX}feedback`, JSON.stringify(feedback.filter((f) => f.idea_id !== id)));

    const assessments: ReadinessAssessment[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}assessments`) || '[]');
    safeStorage.setItem(`${STORAGE_PREFIX}assessments`, JSON.stringify(assessments.filter((a) => a.idea_id !== id)));

    const versions: IdeaVersion[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}versions`) || '[]');
    safeStorage.setItem(`${STORAGE_PREFIX}versions`, JSON.stringify(versions.filter((v) => v.idea_id !== id)));

    const tasks: ImprovementTask[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}tasks`) || '[]');
    safeStorage.setItem(`${STORAGE_PREFIX}tasks`, JSON.stringify(tasks.filter((t) => t.idea_id !== id)));

    const reports: any[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}reports`) || '[]');
    safeStorage.setItem(`${STORAGE_PREFIX}reports`, JSON.stringify(reports.filter((r) => r.idea_id !== id)));
  } catch (err) {
    console.error('Local delete idea failed:', err);
  }

  // 3. Mark and delete in Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      // 3a. Update in Supabase to [DELETED] (supported by UPDATE RLS policy)
      // This immediately propagates via Realtime and marks the database record deleted across all devices
      await withTimeout(
        supabase
          .from('ideas')
          .update({
            category: '[DELETED]',
            title: '[DELETED]',
            description: '[DELETED] This idea was deleted by creator.',
            last_activity_at: new Date().toISOString(),
          })
          .eq('id', id),
        2500,
        null
      );

      // 3b. Hard-delete from Supabase tables
      await Promise.allSettled([
        supabase.from('idea_versions').delete().eq('idea_id', id),
        supabase.from('improvement_tasks').delete().eq('idea_id', id),
        supabase.from('feedback').delete().eq('idea_id', id),
        supabase.from('readiness_assessments').delete().eq('idea_id', id),
        supabase.from('votes').delete().eq('idea_id', id),
        supabase.from('ideas').delete().eq('id', id),
      ]);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  }

  notifyStorageChange();
  return true;
}

// ==========================================
// SUBMIT OR EDIT FEEDBACK
// ==========================================

export async function submitOrUpdateFeedback(
  ideaId: string,
  data: {
    promising_options: string[];
    beneficiary_options: string[];
    improvement_options: string[];
    knowledge_options: string[];
    written_suggestion?: string;
  }
): Promise<FeedbackItem> {
  const currentUserId = await getAnonymousUserId();
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      const feedbackPayload = {
        idea_id: ideaId,
        user_id: currentUserId,
        promising_options: data.promising_options,
        beneficiary_options: data.beneficiary_options,
        improvement_options: data.improvement_options,
        knowledge_options: data.knowledge_options,
        written_suggestion: data.written_suggestion?.slice(0, 500) || null,
        updated_at: now,
      };

      const { data: upserted, error } = await withTimeout(
        supabase
          .from('feedback')
          .upsert(feedbackPayload, { onConflict: 'user_id,idea_id' })
          .select()
          .single(),
        4000,
        { data: null, error: new Error('Timeout') } as any
      );

      if (!error && upserted) {
        notifyStorageChange();
        return upserted;
      }
    } catch (e) {
      console.warn('Supabase feedback error, falling back locally:', e);
    }
  }

  // Local storage fallback
  const feedbackList: FeedbackItem[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}feedback`) || '[]');
  const existingIdx = feedbackList.findIndex((f) => f.idea_id === ideaId && f.user_id === currentUserId);

  let savedItem: FeedbackItem;
  if (existingIdx >= 0) {
    feedbackList[existingIdx] = {
      ...feedbackList[existingIdx],
      ...data,
      written_suggestion: data.written_suggestion?.slice(0, 500) || undefined,
      updated_at: now,
    };
    savedItem = feedbackList[existingIdx];
  } else {
    savedItem = {
      id: 'feedback-' + safeUUID(),
      idea_id: ideaId,
      user_id: currentUserId,
      ...data,
      written_suggestion: data.written_suggestion?.slice(0, 500) || undefined,
      created_at: now,
      updated_at: now,
    };
    feedbackList.unshift(savedItem);
  }

  safeStorage.setItem(`${STORAGE_PREFIX}feedback`, JSON.stringify(feedbackList));
  notifyStorageChange();
  return savedItem;
}

// ==========================================
// REPORT INAPPROPRIATE FEEDBACK
// ==========================================

export async function reportFeedback(
  feedbackId: string,
  reason: FeedbackReport['reason']
): Promise<boolean> {
  const currentUserId = await getAnonymousUserId();

  if (isSupabaseConfigured() && supabase) {
    try {
      await withTimeout(
        supabase.from('feedback_reports').insert({
          feedback_id: feedbackId,
          reporter_id: currentUserId,
          reason,
          status: 'pending',
        }),
        3500
      );
      return true;
    } catch (e) {
      console.warn('Supabase report error:', e);
    }
  }

  const reports: FeedbackReport[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}reports`) || '[]');
  reports.push({
    id: 'report-' + safeUUID(),
    feedback_id: feedbackId,
    reporter_id: currentUserId,
    reason,
    created_at: new Date().toISOString(),
    status: 'pending',
  });
  safeStorage.setItem(`${STORAGE_PREFIX}reports`, JSON.stringify(reports));
  return true;
}

// ==========================================
// SUBMIT OR EDIT READINESS ASSESSMENT
// ==========================================

export async function submitOrUpdateAssessment(
  ideaId: string,
  assessmentType: 'self' | 'peer',
  scores: AssessmentScores
): Promise<ReadinessAssessment> {
  const currentUserId = await getAnonymousUserId();
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      const payload = {
        idea_id: ideaId,
        assessor_id: currentUserId,
        assessment_type: assessmentType,
        ...scores,
        updated_at: now,
      };

      const { data: upserted, error } = await withTimeout(
        supabase
          .from('readiness_assessments')
          .upsert(payload, { onConflict: 'idea_id,assessor_id' })
          .select()
          .single(),
        4000,
        { data: null, error: new Error('Timeout') } as any
      );

      if (!error && upserted) {
        notifyStorageChange();
        return upserted;
      }
    } catch (e) {
      console.warn('Supabase assessment error:', e);
    }
  }

  // Local storage fallback
  const assessments: ReadinessAssessment[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}assessments`) || '[]');
  const existingIdx = assessments.findIndex((a) => a.idea_id === ideaId && a.assessor_id === currentUserId);

  let savedItem: ReadinessAssessment;
  if (existingIdx >= 0) {
    assessments[existingIdx] = {
      ...assessments[existingIdx],
      assessment_type: assessmentType,
      ...scores,
      updated_at: now,
    };
    savedItem = assessments[existingIdx];
  } else {
    savedItem = {
      id: 'assessment-' + safeUUID(),
      idea_id: ideaId,
      assessor_id: currentUserId,
      assessment_type: assessmentType,
      ...scores,
      created_at: now,
      updated_at: now,
    };
    assessments.push(savedItem);
  }

  safeStorage.setItem(`${STORAGE_PREFIX}assessments`, JSON.stringify(assessments));
  notifyStorageChange();
  return savedItem;
}

// ==========================================
// ITERATE IDEA (VERSIONS & EVIDENCE)
// ==========================================

export async function addIdeaVersion(
  ideaId: string,
  title: string,
  description: string,
  evidence: string
): Promise<IdeaVersion> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: existingVersions } = await withTimeout(
        supabase
          .from('idea_versions')
          .select('version_number')
          .eq('idea_id', ideaId),
        3500,
        { data: [] } as any
      );

      const nextVersionNum = (existingVersions?.length || 0) + 1;

      const { data: inserted, error } = await withTimeout(
        supabase
          .from('idea_versions')
          .insert({
            idea_id: ideaId,
            version_number: nextVersionNum,
            title: title.trim(),
            description: description.trim(),
            evidence: evidence.trim(),
          })
          .select()
          .single(),
        3500,
        { data: null, error: new Error('Timeout') } as any
      );

      // Update idea description & updated_at
      await Promise.resolve(
        supabase
          .from('ideas')
          .update({ description: description.trim(), updated_at: now, last_activity_at: now })
          .eq('id', ideaId)
      ).catch(() => {});

      if (!error && inserted) {
        notifyStorageChange();
        return inserted;
      }
    } catch (e) {
      console.warn('Supabase version error:', e);
    }
  }

  // Local storage fallback
  const versions: IdeaVersion[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}versions`) || '[]');
  const existingVersions = versions.filter((v) => v.idea_id === ideaId);
  const nextVersionNum = existingVersions.length + 1;

  const newVersion: IdeaVersion = {
    id: 'ver-' + safeUUID(),
    idea_id: ideaId,
    version_number: nextVersionNum,
    title: title.trim(),
    description: description.trim(),
    evidence: evidence.trim(),
    created_at: now,
  };

  versions.push(newVersion);
  safeStorage.setItem(`${STORAGE_PREFIX}versions`, JSON.stringify(versions));
  notifyStorageChange();
  return newVersion;
}

// ==========================================
// IMPROVEMENT TASKS MANAGEMENT
// ==========================================

export async function updateTaskStatus(
  taskId: string,
  newStatus: ImprovementTask['status']
): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await withTimeout(
        supabase
          .from('improvement_tasks')
          .update({ status: newStatus })
          .eq('id', taskId),
        3500
      );
      notifyStorageChange();
      return true;
    } catch (e) {
      console.warn('Supabase task update error:', e);
    }
  }

  const tasks: ImprovementTask[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}tasks`) || '[]');
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return false;

  task.status = newStatus;
  safeStorage.setItem(`${STORAGE_PREFIX}tasks`, JSON.stringify(tasks));
  notifyStorageChange();
  return true;
}

export async function addTask(
  ideaId: string,
  taskDescription: string,
  category = 'Custom Task'
): Promise<ImprovementTask> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: existing } = await withTimeout(
        supabase
          .from('improvement_tasks')
          .select('id')
          .eq('idea_id', ideaId),
        3500,
        { data: [] } as any
      );

      const nextPriority = (existing?.length || 0) + 1;

      const { data: inserted } = await withTimeout(
        supabase
          .from('improvement_tasks')
          .insert({
            idea_id: ideaId,
            task: taskDescription.trim(),
            category,
            priority: nextPriority,
            status: 'not_started',
          })
          .select()
          .single(),
        3500,
        { data: null } as any
      );

      if (inserted) {
        notifyStorageChange();
        return inserted;
      }
    } catch (e) {
      console.warn('Supabase add task error:', e);
    }
  }

  const tasks: ImprovementTask[] = JSON.parse(safeStorage.getItem(`${STORAGE_PREFIX}tasks`) || '[]');
  const existingForIdea = tasks.filter((t) => t.idea_id === ideaId);

  const newTask: ImprovementTask = {
    id: 'task-' + safeUUID(),
    idea_id: ideaId,
    task: taskDescription.trim(),
    category,
    priority: existingForIdea.length + 1,
    status: 'not_started',
    created_at: new Date().toISOString(),
  };

  tasks.push(newTask);
  safeStorage.setItem(`${STORAGE_PREFIX}tasks`, JSON.stringify(tasks));
  notifyStorageChange();
  return newTask;
}
