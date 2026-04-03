import { useQuery } from "@tanstack/react-query";
import { getSites } from "@/lib/api";

export function useSites() {
  return useQuery({ queryKey: ["sites"], queryFn: getSites });
}
