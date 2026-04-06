"use client";

import { use, useState, useEffect } from "react";
import { useSite } from "@/lib/hooks/use-site";
import { updatePricing, updatePathPricing } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatUSDC } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, CheckCircle, Plus, Trash2 } from "lucide-react";

export default function PricingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: site, isLoading } = useSite(id);
  const queryClient = useQueryClient();
  const [priceInput, setPriceInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [pathRules, setPathRules] = useState<{ pattern: string; price: string }[]>([]);
  const [pathSaved, setPathSaved] = useState(false);

  useEffect(() => {
    if (site) {
      setPriceInput((site.defaultPrice / 1_000_000).toFixed(2));
      if (site.pathPricing) {
        setPathRules(
          site.pathPricing.map((r) => ({
            pattern: r.pattern,
            price: (r.price / 1_000_000).toFixed(2),
          }))
        );
      }
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

  const pathMutation = useMutation({
    mutationFn: (entries: { pattern: string; price: number }[]) =>
      updatePathPricing(id, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites", id] });
      setPathSaved(true);
      setTimeout(() => setPathSaved(false), 2000);
    },
  });

  function handleSave() {
    const dollars = parseFloat(priceInput);
    if (isNaN(dollars) || dollars < 0) return;
    const minorUnits = Math.round(dollars * 1_000_000);
    mutation.mutate(minorUnits);
  }

  function handlePathSave() {
    const entries = pathRules
      .filter((r) => r.pattern.trim() !== "")
      .map((r) => ({
        pattern: r.pattern.trim(),
        price: Math.round(parseFloat(r.price || "0") * 1_000_000),
      }))
      .filter((r) => r.price >= 1);
    pathMutation.mutate(entries);
  }

  function addRule() {
    setPathRules([...pathRules, { pattern: "", price: "" }]);
  }

  function removeRule(index: number) {
    setPathRules(pathRules.filter((_, i) => i !== index));
  }

  function updateRule(index: number, field: "pattern" | "price", value: string) {
    setPathRules(pathRules.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
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
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Path Pricing</CardTitle>
          <CardDescription>
            Override the default price for specific URL paths. Use <code className="text-xs">*</code> as
            a wildcard to match any segment (e.g. <code className="text-xs">/blog/*</code>).
            The most specific matching pattern wins.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pathRules.map((rule, i) => (
            <div key={i} className="flex items-center gap-3">
              <Input
                value={rule.pattern}
                onChange={(e) => updateRule(i, "pattern", e.target.value)}
                placeholder="/blog/*"
                className="flex-1"
              />
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rule.price}
                  onChange={(e) => updateRule(i, "price", e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
              <span className="text-sm text-muted-foreground shrink-0">USDC</span>
              <Button variant="ghost" size="icon" onClick={() => removeRule(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" onClick={addRule}>
            <Plus className="h-4 w-4 mr-1" />
            Add Rule
          </Button>

          <div className="flex items-center gap-3">
            <Button
              onClick={handlePathSave}
              disabled={pathMutation.isPending}
            >
              {pathMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
            {pathSaved && (
              <span className="flex items-center gap-1 text-sm text-emerald-500">
                <CheckCircle className="h-4 w-4" />
                Saved
              </span>
            )}
          </div>

          {pathMutation.isError && (
            <p className="text-sm text-rose-400">
              {pathMutation.error instanceof Error ? pathMutation.error.message : "Failed to update path pricing"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
