import { FeedbackItem, FeedbackAggregates } from '../types';

export const PROMISING_OPTIONS = [
  'Solves a real problem',
  'Innovative approach',
  'Useful target audience',
  'Strong social/environmental impact',
  'Technically interesting',
  'Business potential',
];

export const BENEFICIARY_OPTIONS = [
  'Students',
  'Working professionals',
  'Businesses',
  'Local communities',
  'Government/public services',
  'Specific niche users',
];

export const IMPROVEMENT_OPTIONS = [
  'Cost',
  'Technical feasibility',
  'User experience',
  'Scalability',
  'Business model',
  'Accuracy/reliability',
  'Market differentiation',
];

export const KNOWLEDGE_OPTIONS = [
  'Pricing',
  'Target users',
  'Technical implementation',
  'Competition',
  'Market demand',
  'Prototype/testing results',
  'Business model',
];

export function calculateFeedbackAggregates(feedbacks: FeedbackItem[]): FeedbackAggregates {
  const totalCount = feedbacks.length;
  
  const calculateCategoryPercentages = (
    optionsList: string[],
    getItems: (fb: FeedbackItem) => string[]
  ) => {
    const counts: Record<string, number> = {};
    optionsList.forEach((opt) => (counts[opt] = 0));

    let totalSelections = 0;
    feedbacks.forEach((fb) => {
      const selections = getItems(fb) || [];
      selections.forEach((sel) => {
        counts[sel] = (counts[sel] || 0) + 1;
        totalSelections += 1;
      });
    });

    const result: Record<string, { count: number; percentage: number }> = {};
    optionsList.forEach((opt) => {
      const count = counts[opt] || 0;
      // Percentage based on total responses, or total selections
      const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      result[opt] = { count, percentage };
    });

    return result;
  };

  return {
    totalCount,
    promising: calculateCategoryPercentages(PROMISING_OPTIONS, (fb) => fb.promising_options),
    beneficiaries: calculateCategoryPercentages(BENEFICIARY_OPTIONS, (fb) => fb.beneficiary_options),
    improvements: calculateCategoryPercentages(IMPROVEMENT_OPTIONS, (fb) => fb.improvement_options),
    knowledge: calculateCategoryPercentages(KNOWLEDGE_OPTIONS, (fb) => fb.knowledge_options),
  };
}
