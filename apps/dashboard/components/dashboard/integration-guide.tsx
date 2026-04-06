"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

export function IntegrationGuide({ domain }: { domain: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

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

  const snippetCode = `export default {
  async fetch(request) {
    const botUserAgents = [
      "ChatGPT-User", "GPTBot", "PerplexityBot",
      "anthropic-ai", "ClaudeBot", "Claude-Web",
      "CCBot", "cohere-ai", "Bytespider",
      "OAI-SearchBot", "meta-externalagent",
      "Amazonbot", "YouBot", "Diffbot"
    ];

    const ua = request.headers.get("user-agent") || "";
    const isBot = botUserAgents.some(bot =>
      ua.toLowerCase().includes(bot.toLowerCase())
    );

    if (isBot) {
      const url = new URL(request.url);
      return Response.redirect(
        \`https://pay.${domain}\${url.pathname}\${url.search}\`,
        302
      );
    }

    return fetch(request);
  }
};`;

  const botRegex = `(ChatGPT-User|PerplexityBot|GPTBot|anthropic-ai|CCBot|Claude-Web|ClaudeBot|cohere-ai|YouBot|Diffbot|OAI-SearchBot|meta-externalagent|Bytespider|Amazonbot)`;

  const nginxConfig = `map $http_user_agent $is_ai_bot {
    default 0;
    "~*ChatGPT-User"        1;
    "~*GPTBot"              1;
    "~*PerplexityBot"       1;
    "~*anthropic-ai"        1;
    "~*ClaudeBot"           1;
    "~*Claude-Web"          1;
    "~*CCBot"               1;
    "~*cohere-ai"           1;
    "~*Bytespider"          1;
    "~*OAI-SearchBot"       1;
    "~*meta-externalagent"  1;
    "~*Amazonbot"           1;
    "~*YouBot"              1;
    "~*Diffbot"             1;
}

server {
    # ... existing config ...

    if ($is_ai_bot) {
        return 302 https://pay.${domain}$request_uri;
    }
}`;

  return (
    <div className="space-y-6">
      {/* Cloudflare */}
      <Card className={expanded === "cloudflare" ? "border-primary/30" : ""}>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setExpanded(expanded === "cloudflare" ? null : "cloudflare")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-border bg-muted font-bold text-sm">
                CF
              </div>
              <div>
                <CardTitle className="text-base">Cloudflare</CardTitle>
                <CardDescription>Workers or Snippets</CardDescription>
              </div>
            </div>
            {expanded === "cloudflare" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expanded === "cloudflare" && (
          <CardContent className="space-y-6 border-t border-border pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">Option A: Snippets</h4>
                <Badge variant="secondary" className="text-[0.65rem]">Pro / Business / Enterprise</Badge>
              </div>
              <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
                <li>In Cloudflare, go to your zone &rarr; <span className="font-medium text-foreground">Rules &rarr; Snippets</span></li>
                <li>Click <span className="font-medium text-foreground">Create a snippet</span></li>
                <li>Give it a name (e.g. <code className="text-xs font-mono bg-muted px-1.5 py-0.5">tollgate_bot_redirect</code>)</li>
                <li>Replace all the code in the editor with this:</li>
              </ol>
              <div className="relative">
                <pre className="overflow-auto border border-border bg-muted/50 p-4 pr-12 text-xs font-mono leading-relaxed">
                  {snippetCode}
                </pre>
                <div className="absolute right-2 top-2">
                  <CopyButton text={snippetCode} label="snippet" />
                </div>
              </div>
              <ol start={5} className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
                <li>Click <span className="font-medium text-foreground">Snippet rule</span> (top right) to configure when this runs</li>
                <li>
                  Under <span className="font-medium text-foreground">When incoming requests match&hellip;</span>, set:
                  <div className="mt-2 ml-4 space-y-1">
                    <p><span className="font-medium text-foreground">Field:</span> Hostname</p>
                    <p><span className="font-medium text-foreground">Operator:</span> equals</p>
                    <p><span className="font-medium text-foreground">Value:</span> <code className="text-xs font-mono bg-muted px-1.5 py-0.5">{domain}</code></p>
                  </div>
                </li>
                <li>Click <span className="font-medium text-foreground">Deploy</span></li>
              </ol>
            </div>

            <div className="border-t border-border" />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">Option B: Workers</h4>
                <Badge variant="secondary" className="text-[0.65rem]">All Plans</Badge>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Go to <span className="font-medium text-foreground">Compute (Workers) &rarr; Workers &amp; Pages</span></li>
                <li>Create a new Worker with the same code above</li>
                <li>Go to your site &rarr; <span className="font-medium text-foreground">Worker Routes &rarr; Add route</span></li>
                <li>
                  Set route:{" "}
                  <code className="text-xs font-mono bg-muted px-1.5 py-0.5 text-foreground">*.{domain}/*</code>{" "}
                  and assign your worker
                </li>
              </ol>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Vercel */}
      <Card className={expanded === "vercel" ? "border-primary/30" : ""}>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setExpanded(expanded === "vercel" ? null : "vercel")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-border bg-muted font-bold text-sm">
                <svg viewBox="0 0 76 65" className="h-5 w-5" fill="currentColor">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-base">Vercel</CardTitle>
                <CardDescription>WAF Custom Rule</CardDescription>
              </div>
            </div>
            {expanded === "vercel" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expanded === "vercel" && (
          <CardContent className="space-y-3 border-t border-border pt-6">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Go to your project &rarr; <span className="font-medium text-foreground">Security &rarr; Firewall &rarr; Custom Rules</span></li>
              <li>Create a new rule with condition: <span className="font-medium text-foreground">User Agent &rarr; Matches Expression</span></li>
              <li>Paste this regex pattern:</li>
            </ol>
            <div className="relative">
              <pre className="overflow-auto border border-border bg-muted/50 p-4 pr-12 text-xs font-mono leading-relaxed break-all">
                {botRegex}
              </pre>
              <div className="absolute right-2 top-2">
                <CopyButton text={botRegex} label="regex" />
              </div>
            </div>
            <ol start={4} className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Set action to <span className="font-medium text-foreground">Redirect</span> with destination:</li>
            </ol>
            <div className="relative">
              <pre className="overflow-auto border border-border bg-muted/50 p-4 pr-12 text-xs font-mono leading-relaxed">
                {`https://pay.${domain}/$1`}
              </pre>
              <div className="absolute right-2 top-2">
                <CopyButton text={`https://pay.${domain}/$1`} label="redirect" />
              </div>
            </div>
            <ol start={5} className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Save and deploy the rule</li>
            </ol>
          </CardContent>
        )}
      </Card>

      {/* Nginx */}
      <Card className={expanded === "nginx" ? "border-primary/30" : ""}>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setExpanded(expanded === "nginx" ? null : "nginx")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-border bg-muted font-bold text-sm">
                Nx
              </div>
              <div>
                <CardTitle className="text-base">Nginx</CardTitle>
                <CardDescription>Server configuration</CardDescription>
              </div>
            </div>
            {expanded === "nginx" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expanded === "nginx" && (
          <CardContent className="space-y-3 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              Add this to your <code className="text-xs font-mono bg-muted px-1.5 py-0.5">server</code> block:
            </p>
            <div className="relative">
              <pre className="overflow-auto border border-border bg-muted/50 p-4 pr-12 text-xs font-mono leading-relaxed">
                {nginxConfig}
              </pre>
              <div className="absolute right-2 top-2">
                <CopyButton text={nginxConfig} label="nginx" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Place the <code className="font-mono">map</code> block outside the <code className="font-mono">server</code> block (in the <code className="font-mono">http</code> context), then reload nginx.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
