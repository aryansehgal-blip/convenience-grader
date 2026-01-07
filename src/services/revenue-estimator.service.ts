export interface RevenueEstimate {
  conservative: number;
  moderate: number;
  optimistic: number;
  assumptions: {
    localSearchVolume: number;
    avgTransaction: number;
    currentVisibilityPct: number;
    targetVisibilityPct: number;
    onlineToOfflineRate: number;
    margin: number;
  };
}

export function estimateRevenueUplift(
  currentSearchScore: number,
  targetSearchScore: number,
  currentReviewCount: number
): RevenueEstimate {
  // Base assumptions
  const avgTransaction = 12;
  const onlineToOfflineRate = 0.2; // 20% of online searches result in visit
  const margin = 0.3; // 30% gross margin

  // Estimate local search volume based on typical metro area
  // In production, could use Google Keyword Planner API or similar
  const localSearchVolume = 2800;

  // Map score to visibility percentage
  const currentVisibilityPct = scoreToVisibility(currentSearchScore);
  const targetVisibilityPct = scoreToVisibility(targetSearchScore);

  // Current state
  const currentClicks = localSearchVolume * (currentVisibilityPct / 100);
  const currentVisits = currentClicks * onlineToOfflineRate;
  const currentRevenue = currentVisits * avgTransaction;
  const currentMargin = currentRevenue * margin;

  // Target state (moderate scenario)
  const targetClicks = localSearchVolume * (targetVisibilityPct / 100);
  const targetVisits = targetClicks * onlineToOfflineRate;
  const targetRevenue = targetVisits * avgTransaction;
  const targetMargin = targetRevenue * margin;

  const moderateUplift = (targetMargin - currentMargin) * 12; // Annual

  // Conservative (80% of moderate)
  const conservative = Math.round(moderateUplift * 0.8);

  // Optimistic (120% of moderate, plus review boost)
  const reviewBoost = currentReviewCount < 30 ? 1.2 : 1.1;
  const optimistic = Math.round(moderateUplift * 1.2 * reviewBoost);

  return {
    conservative: Math.max(conservative, 0),
    moderate: Math.round(moderateUplift),
    optimistic: Math.max(optimistic, 0),
    assumptions: {
      localSearchVolume,
      avgTransaction,
      currentVisibilityPct,
      targetVisibilityPct,
      onlineToOfflineRate,
      margin,
    },
  };
}

function scoreToVisibility(score: number): number {
  if (score >= 80) return 40;
  if (score >= 60) return 25;
  if (score >= 40) return 10;
  return 5;
}
