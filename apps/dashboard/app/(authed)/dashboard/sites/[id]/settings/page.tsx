"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/lib/hooks/use-site";
import {
  rotateSecret,
  updateSiteStatus,
  deleteSite,
} from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Loader2, Copy, Eye, EyeOff, CheckCircle } from "lucide-react";

const methodLabels: Record<string, string> = {
  ip_allowlist: "IP Allowlist",
  secret_header: "Secret Header",
  backend_api: "Backend API",
};

export default function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: site, isLoading } = useSite(id);

  const [showSecret, setShowSecret] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [secretSaved, setSecretSaved] = useState(false);

  const rotateMutation = useMutation({
    mutationFn: () => rotateSecret(id),
    onSuccess: (data) => {
      setNewSecret(data.secret);
      setSecretSaved(true);
      queryClient.invalidateQueries({ queryKey: ["sites", id] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: "active" | "paused") => updateSiteStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      router.push("/dashboard/sites");
    },
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!site) return null;

  const isSecretHeader = site.originMethod === "secret_header";
  const maskedSecret = site.originSecret
    ? site.originSecret.slice(0, 4) + "..." + site.originSecret.slice(-4)
    : "---";

  return (
    <div className="space-y-6">
      {/* Origin Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Origin Configuration</CardTitle>
          <CardDescription>
            How Tollgate communicates with your origin after payment verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Method:</span>
            <Badge variant="secondary">
              {methodLabels[site.originMethod] ?? site.originMethod}
            </Badge>
          </div>
          {site.originUrl && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Origin URL:</span>
              <code className="text-sm font-mono">{site.originUrl}</code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Secret Rotation */}
      {isSecretHeader && (
        <Card>
          <CardHeader>
            <CardTitle>Secret Rotation</CardTitle>
            <CardDescription>
              Rotate the secret used in the X-Obul-Secret header.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Current Secret:</span>
              <code className="text-sm font-mono">
                {showSecret ? (site.originSecret ?? "---") : maskedSecret}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              {site.originSecret && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(site.originSecret!)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>

            {newSecret && (
              <div className="space-y-2 border border-emerald-500/30 bg-emerald-500/10 p-3">
                <p className="text-sm font-medium text-emerald-400">New secret generated:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono">{newSecret}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(newSecret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The old secret will remain valid for a short grace period.
                </p>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => rotateMutation.mutate()}
              disabled={rotateMutation.isPending}
            >
              {rotateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Rotate Secret
            </Button>

            {rotateMutation.isError && (
              <p className="text-sm text-rose-400">
                {rotateMutation.error instanceof Error
                  ? rotateMutation.error.message
                  : "Failed to rotate secret"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Site Status */}
      <Card>
        <CardHeader>
          <CardTitle>Site Status</CardTitle>
          <CardDescription>
            Pause or resume bot payment enforcement on your site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Current Status:</span>
            <Badge variant={site.status === "active" ? "success" : "warning"}>
              {site.status}
            </Badge>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              statusMutation.mutate(site.status === "active" ? "paused" : "active")
            }
            disabled={statusMutation.isPending}
          >
            {statusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {site.status === "active" ? "Pause Site" : "Activate Site"}
          </Button>
          {statusMutation.isError && (
            <p className="text-sm text-rose-400">
              {statusMutation.error instanceof Error
                ? statusMutation.error.message
                : "Failed to update status"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Site */}
      <Card className="border-rose-500/30">
        <CardHeader>
          <CardTitle className="text-rose-400">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete this site and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Site</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {site.domain}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the site, all bot rules, payment history, and
                  analytics data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="mt-4 flex justify-end gap-3">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
          {deleteMutation.isError && (
            <p className="mt-3 text-sm text-rose-400">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : "Failed to delete site"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
