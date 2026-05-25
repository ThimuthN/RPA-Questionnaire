import { InterviewConsensus, InterviewFeedbackRecord, InterviewRecommendation, RecommendationLevels } from './types';

export function deriveInterviewConsensus(feedbacks: InterviewFeedbackRecord[]): InterviewConsensus {
  const submitted = feedbacks.filter((f) => f.submittedAt !== null);
  const recommendationCounts = {
    strong_yes: 0,
    yes: 0,
    maybe: 0,
    no: 0,
    strong_no: 0,
  };

  let totalRating = 0;
  let ratingCount = 0;

  for (const feedback of submitted) {
    if (feedback.overallRating !== null) {
      totalRating += feedback.overallRating;
      ratingCount++;
    }
    if (feedback.recommendation) {
      recommendationCounts[feedback.recommendation]++;
    }
  }

  const averageRating = ratingCount > 0 ? totalRating / ratingCount : null;

  // Aggregate recommendation: weighted average of recommendation levels
  let aggregatedRecommendation: InterviewRecommendation | null = null;
  if (submitted.length > 0) {
    let totalLevel = 0;
    let levelCount = 0;
    for (const feedback of submitted) {
      if (feedback.recommendation) {
        totalLevel += RecommendationLevels[feedback.recommendation];
        levelCount++;
      }
    }
    if (levelCount > 0) {
      const avgLevel = totalLevel / levelCount;
      if (avgLevel >= 4.5) {
        aggregatedRecommendation = 'strong_yes';
      } else if (avgLevel >= 3.5) {
        aggregatedRecommendation = 'yes';
      } else if (avgLevel >= 2.5) {
        aggregatedRecommendation = 'maybe';
      } else if (avgLevel >= 1.5) {
        aggregatedRecommendation = 'no';
      } else {
        aggregatedRecommendation = 'strong_no';
      }
    }
  }

  return {
    totalFeedbacks: feedbacks.length,
    submittedFeedbacks: submitted.length,
    averageRating,
    recommendations: recommendationCounts,
    aggregatedRecommendation,
  };
}
