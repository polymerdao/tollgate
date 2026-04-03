import { useQuery } from "@tanstack/react-query";
import { getPayouts } from "@/lib/api";

export function usePayouts(id: string) {
  return useQuery({
    queryKey: ["payouts", id],
    queryFn: () => getPayouts(id),
  });
}
