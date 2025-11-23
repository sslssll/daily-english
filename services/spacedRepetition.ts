import { VocabItem, LearningState } from "../types";

// Standard SM-2 Algorithm implementation
// Quality: 0-5
// 5 - perfect response
// 4 - correct response after a hesitation
// 3 - correct response recalled with serious difficulty
// 2 - incorrect response; where the correct one seemed easy to recall
// 1 - incorrect response; the correct one remembered
// 0 - complete blackout.

export const processReview = (item: VocabItem, quality: number): VocabItem => {
  // Initialize state if it doesn't exist (backward compatibility)
  const state: LearningState = item.learningState || {
    repetition: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReview: Date.now()
  };

  let { repetition, interval, easeFactor } = state;

  if (quality >= 3) {
    // Correct response
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  } else {
    // Incorrect response (reset progress)
    repetition = 0;
    interval = 1;
  }

  // Update Ease Factor (standard formula)
  // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q)*0.02))
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // EF cannot go below 1.3
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Calculate next review date
  // interval is in days. Convert to ms.
  const nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);

  return {
    ...item,
    learningState: {
      repetition,
      interval,
      easeFactor,
      nextReview
    }
  };
};

export const getDueItems = (items: VocabItem[]): VocabItem[] => {
  const now = Date.now();
  return items.filter(item => {
    // If no state, it's new (due now)
    if (!item.learningState) return true;
    // Otherwise check timestamp
    return item.learningState.nextReview <= now;
  }).sort((a, b) => {
    // Sort logic: Items with NO state first, then by due date
    if (!a.learningState) return -1;
    if (!b.learningState) return 1;
    return a.learningState.nextReview - b.learningState.nextReview;
  });
};

export const getReviewStats = (items: VocabItem[]) => {
  const now = Date.now();
  const due = items.filter(i => !i.learningState || i.learningState.nextReview <= now).length;
  const learning = items.filter(i => i.learningState && i.learningState.repetition > 0 && i.learningState.repetition < 4).length;
  const mastered = items.filter(i => i.learningState && i.learningState.repetition >= 4).length;
  
  return { due, learning, mastered, total: items.length };
};