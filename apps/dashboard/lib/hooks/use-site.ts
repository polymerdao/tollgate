import { useQuery } from "@tanstack/react-query";
import { getSite } from "@/lib/api";

export function useSite(id: string) {
  return useQuery({ queryKey: ["sites", id], queryFn: () => getSite(id) });
}
