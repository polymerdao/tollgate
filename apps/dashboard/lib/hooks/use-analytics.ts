import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "@/lib/api";

export function useAnalytics(id: string) {
  return useQuery({
    queryKey: ["analytics", id],
    queryFn: () => getAnalytics(id),
  });
}
