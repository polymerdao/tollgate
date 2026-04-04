"use client";

import { use, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSite } from "@/lib/hooks/use-site";
import { verifySiteDomain, verifyGateway, deleteSite } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Copy, Loader2, CheckCircle } from "lucide-react";

const tabs = [
  { label: "Setup", segment: "setup" },
  { label: "Pricing", segment: "pricing" },
  { label: "Bots", segment: "bots" },
  { label: "Payouts", segment: "payouts" },
  { label: "Analytics", segment: "analytics" },
  { label: "Settings", segment: "settings" },
] as const;

export default function SiteDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: site, isLoading } = useSite(id);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [gatewayVerifying, setGatewayVerifying] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isUnverified = site && !site.verifiedAt;
  const needsGateway = site && site.verifiedAt && !site.gatewayConfigured;

  async function handleVerify() {
    setVerifying(true);
    setVerifyError(null);
    try {
      const result = await verifySiteDomain(id);
      if (result.verified) {
        queryClient.invalidateQueries({ queryKey: ["sites", id] });
        queryClient.invalidateQueries({ queryKey: ["sites"] });
      } else {
        setVerifyError("TXT record not found yet. DNS propagation can take up to 48 hours.");
      }
    } catch {
      setVerifyError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  const isTestnet = typeof window !== "undefined" && window.location.hostname.includes("testnet");
  const gatewayHost = isTestnet
    ? "tollgate-gateway-testnet.operations-4bf.workers.dev"
    : "gw.obul.ai";

  async function handleGatewayVerify() {
    setGatewayVerifying(true);
    setGatewayError(null);
    try {
      await verifyGateway(id);
      queryClient.invalidateQueries({ queryKey: ["sites", id] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    } catch (e) {
      setGatewayError(e instanceof Error ? e.message : "CNAME verification failed. Please try again.");
    } finally {
      setGatewayVerifying(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteSite(id);
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      router.push("/dashboard/sites");
    } catch {
      setDeleting(false);
    }
  }

  function copyValue(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Site heading */}
      {isLoading ? (
        <Skeleton className="h-8 w-48" />
      ) : (
        <h2 className="text-2xl font-bold">{site?.domain ?? "Site"}</h2>
      )}

      {/* Verification banner for unverified sites */}
      {isUnverified && (
        <Card className="border-amber-600/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Domain verification required
            </CardTitle>
            <CardDescription>
              Your site won&apos;t receive bot traffic until the domain is verified. Add this DNS TXT record:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Value</th>
                    <th className="w-12 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">TXT</td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono">_tollgate.{site.domain}</code>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono break-all">
                        tollgate-verify={site.verificationToken}
                      </code>
                    </td>
                    <td className="px-2 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyValue(`tollgate-verify=${site.verificationToken}`)}
                      >
                        {copied ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              DNS changes can take up to 48 hours to propagate.
            </p>

            {verifyError && (
              <p className="text-sm text-amber-900 dark:text-amber-300">{verifyError}</p>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={handleVerify} disabled={verifying}>
                {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify Domain
              </Button>
              {!confirmDelete ? (
                <Button variant="ghost" className="text-muted-foreground" onClick={() => setConfirmDelete(true)}>
                  Delete Site
                </Button>
              ) : (
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gateway CNAME setup for verified sites without gateway configured */}
      {needsGateway && (
        <Card className="border-amber-600/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Gateway setup required
            </CardTitle>
            <CardDescription>
              Add a CNAME record to route bot traffic through the Tollgate payment gateway.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Target</th>
                    <th className="w-12 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">CNAME</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <code className="text-xs font-mono">pay.{site.domain}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => copyValue(`pay.${site.domain}`)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono">{gatewayHost}</code>
                    </td>
                    <td className="px-2 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyValue(gatewayHost)}
                      >
                        {copied ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              DNS changes can take a few minutes to propagate.
            </p>

            {gatewayError && (
              <p className="text-sm text-amber-900 dark:text-amber-300">{gatewayError}</p>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={handleGatewayVerify} disabled={gatewayVerifying}>
                {gatewayVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify CNAME
              </Button>
              {!confirmDelete ? (
                <Button variant="ghost" className="text-muted-foreground" onClick={() => setConfirmDelete(true)}>
                  Delete Site
                </Button>
              ) : (
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Only show tabs and content for fully configured sites */}
      {!isUnverified && !needsGateway && (
        <>
          <nav className="flex gap-1 border-b border-border">
            {tabs.map((tab) => {
              const href = `/dashboard/sites/${id}/${tab.segment}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={tab.segment}
                  href={href}
                  className={cn(
                    "border-b-2 px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {children}
        </>
      )}
    </div>
  );
}
