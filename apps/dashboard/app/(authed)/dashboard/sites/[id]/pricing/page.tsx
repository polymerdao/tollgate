"use client";

import { use, useState, useEffect } from "react";
import { useSite } from "@/lib/hooks/use-site";
import { updatePricing } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatUSDC } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, CheckCircle } from "lucide-react";

export default function PricingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: site, isLoading } = useSite(id);
  const queryClient = useQueryClient();
  const [priceInput, setPriceInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (site) {
      // Convert minor units (millionths) to dollars
      setPriceInput((site.defaultPrice / 1_000_000).toFixed(2));
    }
  }, [site]);

  const mutation = useMutation({
    mutationFn: (price: number) => updatePricing(id, { defaultPrice: price }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites", id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function handleSave() {
    const dollars = parseFloat(priceInput);
    if (isNaN(dollars) || dollars < 0) return;
    // Convert dollars to minor units (millionths)
    const minorUnits = Math.round(dollars * 1_000_000);
    mutation.mutate(minorUnits);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-64" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Price</CardTitle>
        <CardDescription>
          Set the default price bots pay per page visit. Current price:{" "}
          <span className="font-mono font-semibold text-foreground">
            {site ? formatUSDC(site.defaultPrice) : "--"}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="pl-7"
              placeholder="0.00"
            />
          </div>
          <span className="text-sm text-muted-foreground">USDC</span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-500">
              <CheckCircle className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>

        {mutation.isError && (
          <p className="text-sm text-rose-400">
            {mutation.error instanceof Error ? mutation.error.message : "Failed to update pricing"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
