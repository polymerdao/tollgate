"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  createSite,
  verifySiteDomain,
  initiateStripeConnect,
  updateOrigin,
} from "@/lib/api";
import type { Site } from "@tollgate/shared";
import { CheckCircle, Loader2, AlertCircle, Copy } from "lucide-react";

const STEPS = ["Domain", "Stripe", "Origin", "CDN Setup"] as const;

export default function NewSitePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [domain, setDomain] = useState("");
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  // Origin state
  const [originMethod, setOriginMethod] = useState("ip_allowlist");
  const [originUrl, setOriginUrl] = useState("");
  const [originSecret, setOriginSecret] = useState("");

  async function handleRegister() {
    setLoading(true);
    setError(null);
    try {
      const newSite = await createSite({ domain });
      setSite(newSite);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to register site");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!site) return;
    setLoading(true);
    setError(null);
    try {
      const result = await verifySiteDomain(site.id);
      if (result.verified) {
        setVerified(true);
      } else {
        setError("Domain not yet verified. Make sure the DNS TXT record is set and try again.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleStripeConnect() {
    if (!site) return;
    setLoading(true);
    setError(null);
    try {
      const { url } = await initiateStripeConnect(site.id);
      if (url && url !== "#") {
        window.location.href = url;
      } else {
        // MVP placeholder — move to next step
        setStep(2);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect Stripe");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveOrigin() {
    if (!site) return;
    setLoading(true);
    setError(null);
    try {
      await updateOrigin(site.id, {
        originMethod,
        originUrl: originMethod === "backend_api" ? originUrl : undefined,
        originSecret: originMethod === "secret_header" ? originSecret : undefined,
      });
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save origin");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  const siteDomain = site?.domain ?? domain;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">Add New Site</h2>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`flex h-7 w-7 items-center justify-center text-xs font-bold ${
                  i < step
                    ? "bg-emerald-600 text-white"
                    : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? "\u2713" : i + 1}
              </span>
              <span
                className={`hidden text-xs font-medium sm:inline ${
                  i === step ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-px w-8 bg-border" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Domain */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Register Your Domain</CardTitle>
            <CardDescription>
              Enter the domain you want to protect with Tollgate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!site ? (
              <>
                <Input
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
                <Button onClick={handleRegister} disabled={!domain || loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Register
                </Button>
              </>
            ) : !verified ? (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Add this TXT record to your DNS provider to verify ownership of <span className="font-medium text-foreground">{site.domain}</span>.
                </p>

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
                          <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono">
                            _tollgate.{site.domain}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono break-all">
                            tollgate-verify={site.verificationToken}
                          </code>
                        </td>
                        <td className="px-2 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              copyToClipboard(
                                `tollgate-verify=${site.verificationToken}`
                              )
                            }
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-muted-foreground">
                  DNS changes can take up to 48 hours to propagate. You can close this page and verify later from the site settings.
                </p>

                <Button onClick={handleVerify} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Verify Domain
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Domain verified!</span>
                <Button className="ml-auto" onClick={() => setStep(1)}>
                  Continue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Stripe */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Connect Stripe</CardTitle>
            <CardDescription>
              Connect your Stripe account to receive payouts from bot payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-amber-600/30 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-300">
              Stripe Connect setup will be available soon. You can skip this step for now and configure it later in Settings.
            </div>
            <div className="flex gap-3">
              <Button onClick={handleStripeConnect} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Connect Stripe Account
              </Button>
              <Button variant="outline" onClick={() => setStep(2)}>
                Skip for Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Origin Method */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Origin Configuration</CardTitle>
            <CardDescription>
              Choose how Tollgate communicates with your origin server after payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Method</label>
              <Select value={originMethod} onValueChange={setOriginMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ip_allowlist">IP Allowlist</SelectItem>
                  <SelectItem value="secret_header">Secret Header</SelectItem>
                  <SelectItem value="backend_api">Backend API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {originMethod === "backend_api" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Origin URL</label>
                <Input
                  placeholder="https://api.example.com/tollgate/verify"
                  value={originUrl}
                  onChange={(e) => setOriginUrl(e.target.value)}
                />
              </div>
            )}

            {originMethod === "secret_header" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Secret Value</label>
                <Input
                  placeholder="Enter a secret for the X-Obul-Secret header"
                  value={originSecret}
                  onChange={(e) => setOriginSecret(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Tollgate will include this secret in the <code>X-Obul-Secret</code> header when proxying requests.
                </p>
              </div>
            )}

            {originMethod === "ip_allowlist" && (
              <p className="text-sm text-muted-foreground">
                Your origin will only accept requests from Tollgate&apos;s gateway IPs. No additional configuration needed.
              </p>
            )}

            <Button onClick={handleSaveOrigin} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: CDN Template */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>CDN Configuration</CardTitle>
            <CardDescription>
              Set up your CDN to redirect bot traffic to the Tollgate payment gateway.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">1. Add a CNAME record:</p>
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
                        <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono">
                          pay.{siteDomain}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono">
                          gw.obul.ai
                        </code>
                      </td>
                      <td className="px-2 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard("gw.obul.ai")}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">2. Configure your CDN rules:</p>
              <Tabs defaultValue="cloudflare">
                <TabsList>
                  <TabsTrigger value="cloudflare">Cloudflare</TabsTrigger>
                  <TabsTrigger value="vercel">Vercel</TabsTrigger>
                </TabsList>
                <TabsContent value="cloudflare">
                  <pre className="overflow-auto border border-border bg-muted/50 p-4 text-xs font-mono leading-relaxed">
{`# WAF Rule: Redirect bots to payment subdomain
# Action: 302 Redirect
# When: Bot Score > 30
# URL: https://pay.${siteDomain}\$\{http.request.uri\}

# Method B bypass (if using Secret Header):
# WAF Exception Rule:
# When: X-Obul-Secret header matches your secret
# Action: Skip remaining rules`}
                  </pre>
                </TabsContent>
                <TabsContent value="vercel">
                  <pre className="overflow-auto border border-border bg-muted/50 p-4 text-xs font-mono leading-relaxed">
{`// vercel.json
{
  "redirects": [
    {
      "source": "/:path*",
      "destination": "https://pay.${siteDomain}/:path*",
      "statusCode": 302,
      "has": [{ "type": "header", "key": "user-agent", "value": ".*bot.*" }]
    }
  ]
}`}
                  </pre>
                </TabsContent>
              </Tabs>
            </div>

            <Button
              onClick={() =>
                router.push(`/dashboard/sites/${site?.id}/pricing`)
              }
            >
              Done
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
