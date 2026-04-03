"use client";

import { use, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAllowlist, updateExclusions } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Plus, Trash2, Loader2, CheckCircle } from "lucide-react";

export default function BotsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  // Allowlist state
  const [allowlist, setAllowlist] = useState<string[]>([]);
  const [allowlistInput, setAllowlistInput] = useState("");
  const [allowlistDialogOpen, setAllowlistDialogOpen] = useState(false);
  const [allowlistSaved, setAllowlistSaved] = useState(false);

  // Exclusions state
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [exclusionInput, setExclusionInput] = useState("");
  const [exclusionDialogOpen, setExclusionDialogOpen] = useState(false);
  const [exclusionsSaved, setExclusionsSaved] = useState(false);

  const allowlistMutation = useMutation({
    mutationFn: (entries: { userAgentPattern: string }[]) =>
      updateAllowlist(id, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites", id] });
      setAllowlistSaved(true);
      setTimeout(() => setAllowlistSaved(false), 2000);
    },
  });

  const exclusionsMutation = useMutation({
    mutationFn: (entries: { pattern: string }[]) =>
      updateExclusions(id, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites", id] });
      setExclusionsSaved(true);
      setTimeout(() => setExclusionsSaved(false), 2000);
    },
  });

  function addAllowlistEntry() {
    if (!allowlistInput.trim()) return;
    setAllowlist((prev) => [...prev, allowlistInput.trim()]);
    setAllowlistInput("");
    setAllowlistDialogOpen(false);
  }

  function removeAllowlistEntry(index: number) {
    setAllowlist((prev) => prev.filter((_, i) => i !== index));
  }

  function saveAllowlist() {
    allowlistMutation.mutate(
      allowlist.map((pattern) => ({ userAgentPattern: pattern }))
    );
  }

  function addExclusion() {
    if (!exclusionInput.trim()) return;
    setExclusions((prev) => [...prev, exclusionInput.trim()]);
    setExclusionInput("");
    setExclusionDialogOpen(false);
  }

  function removeExclusion(index: number) {
    setExclusions((prev) => prev.filter((_, i) => i !== index));
  }

  function saveExclusions() {
    exclusionsMutation.mutate(
      exclusions.map((pattern) => ({ pattern }))
    );
  }

  return (
    <div className="space-y-6">
      {/* Bot Allowlist */}
      <Card>
        <CardHeader>
          <CardTitle>Bot Allowlist</CardTitle>
          <CardDescription>
            User-agent patterns that are allowed through without payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allowlist.length === 0 ? (
            <EmptyState message="No allowlist entries yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User-Agent Pattern</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {allowlist.map((pattern, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm">{pattern}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAllowlistEntry(i)}
                      >
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAllowlistDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
            {allowlist.length > 0 && (
              <Button
                size="sm"
                onClick={saveAllowlist}
                disabled={allowlistMutation.isPending}
              >
                {allowlistMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save All
              </Button>
            )}
            {allowlistSaved && (
              <span className="flex items-center gap-1 text-sm text-emerald-500">
                <CheckCircle className="h-4 w-4" />
                Saved
              </span>
            )}
          </div>

          {allowlistMutation.isError && (
            <p className="text-sm text-rose-400">
              {allowlistMutation.error instanceof Error
                ? allowlistMutation.error.message
                : "Failed to save allowlist"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Allowlist Dialog */}
      <Dialog open={allowlistDialogOpen} onOpenChange={setAllowlistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Allowlist Entry</DialogTitle>
            <DialogDescription>
              Enter a user-agent pattern (e.g. &quot;Googlebot&quot;).
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <Input
              placeholder="Googlebot*"
              value={allowlistInput}
              onChange={(e) => setAllowlistInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAllowlistEntry()}
            />
            <Button onClick={addAllowlistEntry} disabled={!allowlistInput.trim()}>
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Path Exclusions */}
      <Card>
        <CardHeader>
          <CardTitle>Path Exclusions</CardTitle>
          <CardDescription>
            URL path patterns that are excluded from bot payment (e.g. &quot;/api/*&quot;).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exclusions.length === 0 ? (
            <EmptyState message="No path exclusions yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Path Pattern</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {exclusions.map((pattern, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm">{pattern}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExclusion(i)}
                      >
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExclusionDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
            {exclusions.length > 0 && (
              <Button
                size="sm"
                onClick={saveExclusions}
                disabled={exclusionsMutation.isPending}
              >
                {exclusionsMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save All
              </Button>
            )}
            {exclusionsSaved && (
              <span className="flex items-center gap-1 text-sm text-emerald-500">
                <CheckCircle className="h-4 w-4" />
                Saved
              </span>
            )}
          </div>

          {exclusionsMutation.isError && (
            <p className="text-sm text-rose-400">
              {exclusionsMutation.error instanceof Error
                ? exclusionsMutation.error.message
                : "Failed to save exclusions"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Exclusion Dialog */}
      <Dialog open={exclusionDialogOpen} onOpenChange={setExclusionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Path Exclusion</DialogTitle>
            <DialogDescription>
              Enter a URL path pattern to exclude from payments.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <Input
              placeholder="/api/*"
              value={exclusionInput}
              onChange={(e) => setExclusionInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExclusion()}
            />
            <Button onClick={addExclusion} disabled={!exclusionInput.trim()}>
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
