"use client";

import { use, useState } from "react";
import { useSite } from "@/lib/hooks/use-site";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, CheckCircle } from "lucide-react";
import { IntegrationGuide } from "@/components/dashboard/integration-guide";

export default function SetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: site, isLoading } = useSite(id);
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  function CopyButton({ text, label }: { text: string; label: string }) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => copy(text, label)}
      >
        {copied === label ? (
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!site) return null;

  const isTestnet = typeof window !== "undefined" && window.location.hostname.includes("testnet");
  const gatewayHost = isTestnet
    ? "tollgate-gateway-testnet.operations-4bf.workers.dev"
    : "gw.obul.ai";

  return (
    <div className="space-y-6">
      {/* CNAME Status — only shown if not yet verified */}
      {!site.gatewayConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Gateway CNAME</span>
              <Badge variant="warning">Pending</Badge>
            </CardTitle>
            <CardDescription>
              Route bot payment traffic to the Tollgate gateway.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Target</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">CNAME</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <code className="text-xs font-mono">pay.{site.domain}</code>
                        <CopyButton text={`pay.${site.domain}`} label="name" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <code className="text-xs font-mono">{gatewayHost}</code>
                        <CopyButton text={gatewayHost} label="target" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <IntegrationGuide domain={site.domain} />
    </div>
  );
}
