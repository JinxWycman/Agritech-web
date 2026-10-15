import type { ExpertRequestRecord } from "@/lib/request-lifecycle";
import type { ExpertPerformance } from "@/types/account";

export function computePerformance(requests: ExpertRequestRecord[], expertId: string): ExpertPerformance {
  const assigned = requests.filter((request) => request.offeredExpertIds.includes(expertId));
  const completed = requests.filter((request) => request.assignedExpertId === expertId && request.status === "completed");
  const durations = completed.flatMap((request) => request.offeredAt !== undefined && request.respondedAt !== undefined && request.respondedAt >= request.offeredAt
    ? [(request.respondedAt - request.offeredAt) / 60_000] : []).sort((a, b) => a - b);
  const middle = Math.floor(durations.length / 2);
  const medianResponseMinutes = durations.length === 0 ? null : durations.length % 2 === 1
    ? durations[middle] : (durations[middle - 1] + durations[middle]) / 2;
  const accepted = requests.filter((request) => request.assignedExpertId === expertId && ["accepted", "completed"].includes(request.status)).length;
  const feedback = completed.filter((request) => request.solved !== null);
  return {
    completedCount: completed.length,
    medianResponseMinutes,
    acceptRate: assigned.length ? accepted / assigned.length : 0,
    feedbackCount: feedback.length,
    solvedRate: feedback.length ? feedback.filter((request) => request.solved === true).length / feedback.length : null,
  };
}
