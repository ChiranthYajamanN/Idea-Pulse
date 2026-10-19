import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAssessmentAverage,
  calculateReadinessPercentage,
  calculateOverallReadiness,
  generateImprovementRecommendations,
} from './scoring.ts';
import { sortIdeasByLeaderboard } from './sorting.ts';

test('calculateAssessmentAverage computes accurate arithmetic mean across 5 parameters', () => {
  const scores = {
    problem_clarity: 4,
    user_value: 5,
    feasibility: 3,
    sustainability: 4,
    validation: 4,
  };
  const avg = calculateAssessmentAverage(scores);
  assert.equal(avg, 4.0);

  const decimalScores = {
    problem_clarity: 4.5,
    user_value: 4.2,
    feasibility: 2.8,
    sustainability: 3.1,
    validation: 2.5,
  };
  const avg2 = calculateAssessmentAverage(decimalScores);
  assert.equal(avg2, 3.42);
});

test('calculateReadinessPercentage converts 1-5 score to 0-100 percentage', () => {
  assert.equal(calculateReadinessPercentage(5), 100);
  assert.equal(calculateReadinessPercentage(2.5), 50);
  assert.equal(calculateReadinessPercentage(3.4), 68);
  assert.equal(calculateReadinessPercentage(0), 0);
});

test('calculateOverallReadiness handles awaiting peer assessments correctly', () => {
  const res = calculateOverallReadiness(4.0, []);
  assert.equal(res.isAwaitingPeers, true);
  assert.equal(res.overallScore, 4.0);
  assert.equal(res.overallPercentage, 80);
  assert.equal(res.peerAverageOutOfFive, null);
});

test('calculateOverallReadiness combines 50% self and 50% peer assessments', () => {
  const peerScores = [
    { problem_clarity: 4, user_value: 4, feasibility: 2, sustainability: 3, validation: 2 }, // avg 3.0
    { problem_clarity: 5, user_value: 4, feasibility: 3, sustainability: 4, validation: 4 }, // avg 4.0
  ];
  // peer avg = 3.5
  // self = 4.5
  // combined = 0.5 * 4.5 + 0.5 * 3.5 = 4.0
  const res = calculateOverallReadiness(4.5, peerScores);
  assert.equal(res.isAwaitingPeers, false);
  assert.equal(res.peerCount, 2);
  assert.equal(res.selfScoreOutOfFive, 4.5);
  assert.equal(res.peerAverageOutOfFive, 3.5);
  assert.equal(res.overallScore, 4.0);
  assert.equal(res.overallPercentage, 80);
});

test('generateImprovementRecommendations flags weak areas and prioritizes lowest score', () => {
  const scores = {
    problem_clarity: 4.5,
    user_value: 4.2,
    feasibility: 2.8,
    sustainability: 3.1,
    validation: 2.5,
  };
  const recs = generateImprovementRecommendations(scores, ['Cost']);
  assert.ok(recs.length >= 3);
  // Lowest is validation (2.5), then feasibility (2.8)
  assert.equal(recs[0].parameter, 'validation');
  assert.equal(recs[1].parameter, 'feasibility');
  assert.equal(recs[2].parameter, 'sustainability');
});

test('sortIdeasByLeaderboard resolves ties by most recent activity, then created_at', () => {
  const ideas = [
    {
      id: 'idea-1',
      vote_count: 50,
      last_activity_at: '2026-10-18T10:00:00Z',
      created_at: '2026-10-17T10:00:00Z',
    },
    {
      id: 'idea-2',
      vote_count: 100,
      last_activity_at: '2026-10-18T09:00:00Z',
      created_at: '2026-10-17T09:00:00Z',
    },
    {
      id: 'idea-3',
      vote_count: 50,
      last_activity_at: '2026-10-18T12:00:00Z', // More recent activity
      created_at: '2026-10-17T08:00:00Z',
    },
    {
      id: 'idea-4',
      vote_count: 50,
      last_activity_at: '2026-10-18T10:00:00Z', // Same activity as idea-1, but created later
      created_at: '2026-10-17T11:00:00Z',
    },
  ];

  const sorted = sortIdeasByLeaderboard(ideas);
  assert.equal(sorted[0].id, 'idea-2'); // 100 votes
  assert.equal(sorted[1].id, 'idea-3'); // 50 votes, latest activity (12:00)
  assert.equal(sorted[2].id, 'idea-4'); // 50 votes, 10:00 activity, newer created_at
  assert.equal(sorted[3].id, 'idea-1'); // 50 votes, 10:00 activity, older created_at
});
