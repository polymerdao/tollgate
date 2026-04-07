import { useQuery } from "@tanstack/react-query";
import { getAggregateAnalytics } from "@/lib/api";

export function useAggregateAnalytics() {
  return useQuery({ queryKey: ["analytics", "aggregate"], queryFn: getAggregateAnalytics });
}
