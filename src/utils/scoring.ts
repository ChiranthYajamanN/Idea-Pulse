export interface ScoreParameters {
  problem_clarity: number;
  user_value: number;
  feasibility: number;
  sustainability: number;
  validation: number;
}

/**
 * Calculates the mean score across the 5 core parameters (1 to 5 scale).
 */
export function calculateAssessmentAverage(scores: ScoreParameters): number {
  const sum = 
    (scores.problem_clarity || 0) +
    (scores.user_value || 0) +
    (scores.feasibility || 0) +
    (scores.sustainability || 0) +
    (scores.validation || 0);
  return Number((sum / 5).toFixed(2));
}

/**
 * Converts a 1-5 score to a percentage (0-100%).
 */
export function calculateReadinessPercentage(scoreOutOfFive: number): number {
  if (scoreOutOfFive <= 0) return 0;
  const percentage = (scoreOutOfFive / 5) * 100;
  return Math.min(100, Math.max(0, Math.round(percentage)));
}

/**
 * Calculates overall readiness:
 * 50% Self Assessment + 50% Peer Assessment.
 * If peer assessments count is 0, defaults to Self Assessment with awaitingPeers flag.
 */
export function calculateOverallReadiness(
  selfScore: number | null,
  peerScores: ScoreParameters[] = []
): {
  overallScore: number;
  overallPercentage: number;
  selfScoreOutOfFive: number;
  peerAverageOutOfFive: number | null;
  peerCount: number;
  isAwaitingPeers: boolean;
  parameterAverages: ScoreParameters;
} {
  const selfAverage = selfScore !== null ? Math.min(5, Math.max(1, selfScore)) : 3;

  if (!peerScores || peerScores.length === 0) {
    return {
      overallScore: Number(selfAverage.toFixed(2)),
      overallPercentage: calculateReadinessPercentage(selfAverage),
      selfScoreOutOfFive: Number(selfAverage.toFixed(2)),
      peerAverageOutOfFive: null,
      peerCount: 0,
      isAwaitingPeers: true,
      parameterAverages: {
        problem_clarity: selfAverage,
        user_value: selfAverage,
        feasibility: selfAverage,
        sustainability: selfAverage,
        validation: selfAverage,
      },
    };
  }

  // Calculate peer averages for each parameter
  const peerCount = peerScores.length;
  const sums = peerScores.reduce(
    (acc, curr) => ({
      problem_clarity: acc.problem_clarity + curr.problem_clarity,
      user_value: acc.user_value + curr.user_value,
      feasibility: acc.feasibility + curr.feasibility,
      sustainability: acc.sustainability + curr.sustainability,
      validation: acc.validation + curr.validation,
    }),
    { problem_clarity: 0, user_value: 0, feasibility: 0, sustainability: 0, validation: 0 }
  );

  const peerParamAverages: ScoreParameters = {
    problem_clarity: Number((sums.problem_clarity / peerCount).toFixed(1)),
    user_value: Number((sums.user_value / peerCount).toFixed(1)),
    feasibility: Number((sums.feasibility / peerCount).toFixed(1)),
    sustainability: Number((sums.sustainability / peerCount).toFixed(1)),
    validation: Number((sums.validation / peerCount).toFixed(1)),
  };

  const peerAverage = calculateAssessmentAverage(peerParamAverages);
  const combined = (selfAverage * 0.5) + (peerAverage * 0.5);

  return {
    overallScore: Number(combined.toFixed(2)),
    overallPercentage: calculateReadinessPercentage(combined),
    selfScoreOutOfFive: Number(selfAverage.toFixed(2)),
    peerAverageOutOfFive: Number(peerAverage.toFixed(2)),
    peerCount,
    isAwaitingPeers: false,
    parameterAverages: peerParamAverages,
  };
}

export interface Recommendation {
  parameter: keyof ScoreParameters;
  score: number;
  priority: number;
  title: string;
  recommendation: string;
  category: string;
}

/**
 * Generates personalized rule-based improvement tasks based on weak parameters (< 3.5 or lowest scores).
 */
export function generateImprovementRecommendations(
  scores: ScoreParameters,
  improvementFeedbackOptions: string[] = []
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  const checks: Array<{
    key: keyof ScoreParameters;
    label: string;
    advice: string;
    category: string;
  }> = [
    {
      key: 'feasibility',
      label: 'Improve technical feasibility',
      advice: 'Build a small technical prototype or architecture proof-of-concept to test whether the core mechanism works.',
      category: 'Prototyping & Engineering',
    },
    {
      key: 'sustainability',
      label: 'Estimate costs and resource model',
      advice: 'Estimate operating costs, maintenance requirements, and long-term resource and server/hardware requirements.',
      category: 'Unit Economics & Sustainability',
    },
    {
      key: 'validation',
      label: 'Conduct user discovery & market differentiation',
      advice: 'Interview potential users, capture recorded problem statements, and compare your idea directly against existing substitutes.',
      category: 'Market Research',
    },
    {
      key: 'problem_clarity',
      label: 'Refine problem definition & user segment',
      advice: 'Define the exact pain point, affected student/customer personas, and quantifiable measurable impact metrics.',
      category: 'Problem Definition',
    },
    {
      key: 'user_value',
      label: 'Validate value proposition with target users',
      advice: 'Conduct structured user interviews or willingness-to-use surveys to determine whether target users actively seek this solution.',
      category: 'Customer Validation',
    },
  ];

  // Sort lowest scores first
  const sorted = [...checks].sort((a, b) => scores[a.key] - scores[b.key]);

  sorted.forEach((item, index) => {
    // Flag if score is below 3.5 or is in the lowest 2 items
    if (scores[item.key] < 3.5 || index < 2) {
      recommendations.push({
        parameter: item.key,
        score: scores[item.key],
        priority: index + 1,
        title: item.label,
        recommendation: item.advice,
        category: item.category,
      });
    }
  });

  // If specific community improvements were heavily voted, add contextual advice
  if (improvementFeedbackOptions.includes('Cost') && !recommendations.some(r => r.parameter === 'sustainability')) {
    recommendations.push({
      parameter: 'sustainability',
      score: scores.sustainability,
      priority: recommendations.length + 1,
      title: 'Analyze cost breakdown (Community Priority)',
      recommendation: 'Community feedback highlighted cost as a major concern. Research affordable component alternatives or tiered pricing.',
      category: 'Cost Optimization',
    });
  }

  return recommendations;
}
