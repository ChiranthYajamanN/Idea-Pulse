export interface SortableIdea {
  id: string;
  vote_count: number;
  last_activity_at: string;
  created_at: string;
}

export function sortIdeasByLeaderboard<T extends SortableIdea>(ideas: T[]): T[] {
  return [...ideas].sort((a, b) => {
    // 1. Primary: highest votes first
    if (b.vote_count !== a.vote_count) {
      return b.vote_count - a.vote_count;
    }

    // 2. First tie-breaker: most recent vote activity wins
    const activityA = new Date(a.last_activity_at || a.created_at).getTime();
    const activityB = new Date(b.last_activity_at || b.created_at).getTime();
    if (activityB !== activityA) {
      return activityB - activityA;
    }

    // 3. Second tie-breaker: most recent submission wins
    const createdA = new Date(a.created_at).getTime();
    const createdB = new Date(b.created_at).getTime();
    return createdB - createdA;
  });
}
