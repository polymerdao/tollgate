"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, ChevronDown, ChevronUp, Globe } from "lucide-react";

function ProviderIcon({ provider }: { provider: string }) {
  const cls = "h-5 w-5";
  switch (provider) {
    case "cloudflare":
      return (
        <svg className={cls} viewBox="0 0 64 64" fill="currentColor"><path d="M44.174 40.894c.39-1.326.244-2.553-.408-3.468-.603-.846-1.603-1.334-2.78-1.392l-22.435-.294a.472.472 0 0 1-.39-.212.525.525 0 0 1-.065-.456c.098-.326.408-.554.748-.57l22.632-.296c2.7-.13 5.627-2.324 6.573-4.924l1.194-3.28a.927.927 0 0 0 .049-.456 14.074 14.074 0 0 0-27.26-3.198c-1.815-1.334-4.107-1.95-6.484-1.57-3.63.587-6.557 3.508-7.077 7.142a8.22 8.22 0 0 0 .065 2.864c-4.904.147-8.844 4.14-8.844 9.06 0 .472.033.936.098 1.392a.459.459 0 0 0 .456.392h43.22a.65.65 0 0 0 .619-.456l.089-.278z"/><path d="M50.162 23.498a.371.371 0 0 0-.36-.066 5.735 5.735 0 0 0-3.28 2.52 5.485 5.485 0 0 0-.716 3.934.472.472 0 0 0 .39.374c2.21.326 3.934 2.21 3.934 4.484 0 .538-.098 1.06-.276 1.546a.525.525 0 0 0 .488.716H57.3a.508.508 0 0 0 .488-.374c.33-1.416.506-2.896.506-4.416a14.044 14.044 0 0 0-8.132-12.718z"/></svg>
      );
    case "vercel":
      return (
        <svg className={cls} viewBox="0 0 76 65" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/></svg>
      );
    case "fastly":
      // Simple Icons — Fastly
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M13.919 3.036V1.3h.632V0H9.377v1.3h.631v1.749a10.572 10.572 0 00-8.575 10.384C1.433 19.275 6.17 24 12 24c5.842 0 10.567-4.737 10.567-10.567 0-5.186-3.729-9.486-8.648-10.397zm-1.628 15.826v-.607h-.619v.607c-2.757-.158-4.955-2.38-5.101-5.137h.607v-.62h-.607a5.436 5.436 0 015.101-5.089v.607h.62v-.607a5.435 5.435 0 015.137 5.114h-.607v.619h.607a5.444 5.444 0 01-5.138 5.113zm2.26-7.712l-.39-.389-1.979 1.725a.912.912 0 00-.316-.06c-.534 0-.971.448-.971.995 0 .547.437.996.971.996.535 0 .972-.45.972-.996a.839.839 0 00-.049-.304Z"/></svg>
      );
    case "akamai":
      // Simple Icons — Akamai
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M13.0548 0C6.384 0 .961 5.3802.961 12.0078.961 18.6354 6.3698 24 13.0548 24c.6168 0 .6454-.3572.0859-.5293-4.9349-1.5063-8.5352-6.069-8.5352-11.4629 0-5.4656 3.6725-10.0706 8.6934-11.5195C13.8153.3448 13.6716 0 13.0548 0Zm2.3242 1.8223c-5.2648 0-9.5254 4.2606-9.5254 9.5254 0 1.2193.2285 2.3818.6445 3.4433.1722.459.4454.4584.4024.0137-.0287-.3156-.0567-.6447-.0567-.9746 0-5.2648 4.2606-9.5254 9.5254-9.5254 4.9779 0 6.4698 2.2235 6.6563 2.08.2008-.1577-1.808-4.5624-7.6465-4.5624zm.4687 4.0703c-1.8622.0592-3.651.7168-5.1035 1.8554-.2582.2009-.1567.3284.1445.1993 2.4675-1.076 5.5812-1.1046 8.6368-.043 2.0514.7173 3.2413 1.7364 3.3418 1.6934.1578-.0718-1.1915-2.2226-3.6446-3.1407-1.1135-.4196-2.2576-.6-3.375-.5644z"/></svg>
      );
    case "aws":
      // AWS smile logo
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M7.164 16.897c-2.22-1.625-3.6-3.953-3.6-6.567 0-4.62 4.252-8.37 9.498-8.37 5.245 0 9.497 3.75 9.497 8.37 0 2.614-1.38 4.942-3.6 6.567"/><path d="M6.838 17.156c-.262.183-.078.444.19.296C9.072 16.26 10.53 15.87 12 15.87s2.928.39 4.972 1.582c.268.148.452-.113.19-.296C15.13 15.63 13.534 15.12 12 15.12s-3.13.51-5.162 2.036" fill="currentColor"/><path d="M18.396 18.492c.217-.282-.236-.672-.502-.432-.9.81-3.434 2.49-5.894 2.49s-4.994-1.68-5.894-2.49c-.266-.24-.72.15-.502.432.926 1.198 3.904 3.258 6.396 3.258s5.47-2.06 6.396-3.258" fill="currentColor"/></svg>
      );
    case "gcloud":
      // Simple Icons — Google Cloud
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12.19 2.38a9.344 9.344 0 0 0-9.234 6.893c.053-.02-.055.013 0 0-3.875 2.551-3.922 8.11-.247 10.941l.006-.007-.007.03a6.717 6.717 0 0 0 4.077 1.356h5.173l.03.03h5.192c6.687.053 9.376-8.605 3.835-12.35a9.365 9.365 0 0 0-2.821-4.552l-.043.043.006-.05A9.344 9.344 0 0 0 12.19 2.38zm-.358 4.146c1.244-.04 2.518.368 3.486 1.15a5.186 5.186 0 0 1 1.862 4.078v.518c3.53-.07 3.53 5.262 0 5.193h-5.193l-.008.009v-.04H6.785a2.59 2.59 0 0 1-1.067-.23h.001a2.597 2.597 0 1 1 3.437-3.437l3.013-3.012A6.747 6.747 0 0 0 8.11 8.24c.018-.01.04-.026.054-.023a5.186 5.186 0 0 1 3.67-1.69z"/></svg>
      );
    case "azure":
      // Microsoft Azure — official mark
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M13.05 4.24L7.56 18.05l-4.04-.01L9.37 4.24h3.68zm-2.6 7.08l5.83 6.74H22.5l-8.28-6.74h-3.77zm-.11-.93L16.16 2H22.5L10.34 10.39z"/></svg>
      );
    case "datadome":
      // DataDome — shield with "D"
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 5.5v5.09c0 4.83 3.41 9.35 8 10.41 4.59-1.06 8-5.58 8-10.41V5.5L12 2zm-1.5 13.5v-7h2.5a3.5 3.5 0 0 1 0 7h-2.5zm1.5-5.5v4h1a2 2 0 1 0 0-4h-1z"/></svg>
      );
    case "imperva":
      // Imperva — shield with checkmark
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 15l-3.5-3.5 1.41-1.41L10 13.17l5.59-5.59L17 9l-7 7z"/></svg>
      );
    case "wordpress":
      // Simple Icons — WordPress
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.15-2.85-.15-.585-.03-.661.855-.075.885 0 0 .54.061 1.125.09l1.68 4.605-2.37 7.08L5.354 6.9c.649-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.69-.015C4.911 3.15 8.235 1.215 12 1.215c2.809 0 5.365 1.072 7.286 2.833-.046-.003-.091-.009-.141-.009-1.06 0-1.812.923-1.812 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.393-2.325.609-3.582.609M1.211 12c0-1.564.336-3.05.935-4.39L7.29 21.709C3.694 19.96 1.212 16.271 1.211 12M12 0C5.385 0 0 5.385 0 12s5.385 12 12 12 12-5.385 12-12S18.615 0 12 0"/></svg>
      );
    case "arcxp":
      // Arc XP — stylized "A" mark
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.85 0 3.55.63 4.9 1.69L12 17.46 7.1 5.69A7.957 7.957 0 0 1 12 4zm-1 14.93l-3.07-8.47-2.6 5.83A7.93 7.93 0 0 0 12 20c-.34 0-.67-.03-1-1.07zm5.67-2.29l-2.6-5.83L11 18.93c-.33.04-.66.07-1 .07a7.93 7.93 0 0 0 6.67-3.36z"/></svg>
      );
    case "general":
      return <Globe className={cls} />;
    default:
      return null;
  }
}

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

  const apacheConfig = `RewriteEngine On

RewriteCond %{HTTP_USER_AGENT} ChatGPT-User [NC,OR]
RewriteCond %{HTTP_USER_AGENT} GPTBot [NC,OR]
RewriteCond %{HTTP_USER_AGENT} PerplexityBot [NC,OR]
RewriteCond %{HTTP_USER_AGENT} anthropic-ai [NC,OR]
RewriteCond %{HTTP_USER_AGENT} ClaudeBot [NC,OR]
RewriteCond %{HTTP_USER_AGENT} Claude-Web [NC,OR]
RewriteCond %{HTTP_USER_AGENT} CCBot [NC,OR]
RewriteCond %{HTTP_USER_AGENT} cohere-ai [NC,OR]
RewriteCond %{HTTP_USER_AGENT} Bytespider [NC,OR]
RewriteCond %{HTTP_USER_AGENT} OAI-SearchBot [NC,OR]
RewriteCond %{HTTP_USER_AGENT} meta-externalagent [NC,OR]
RewriteCond %{HTTP_USER_AGENT} Amazonbot [NC,OR]
RewriteCond %{HTTP_USER_AGENT} YouBot [NC,OR]
RewriteCond %{HTTP_USER_AGENT} Diffbot [NC]
RewriteRule ^(.*)$ https://pay.${domain}%{REQUEST_URI} [R=302,L]`;

  const fastlyVcl = `sub vcl_recv {
  if (req.http.User-Agent ~ "${botRegex}") {
    error 751 "Bot Redirect";
  }
}

sub vcl_error {
  if (obj.status == 751) {
    set obj.status = 302;
    set obj.http.Location = "https://pay.${domain}" + req.url;
    return (deliver);
  }
}`;

  const awsLambdaCode = `'use strict';

exports.handler = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  const ua = (request.headers['user-agent'] || [{}])[0].value || '';

  const botUserAgents = [
    "ChatGPT-User", "GPTBot", "PerplexityBot",
    "anthropic-ai", "ClaudeBot", "Claude-Web",
    "CCBot", "cohere-ai", "Bytespider",
    "OAI-SearchBot", "meta-externalagent",
    "Amazonbot", "YouBot", "Diffbot"
  ];

  const isBot = botUserAgents.some(bot =>
    ua.toLowerCase().includes(bot.toLowerCase())
  );

  if (isBot) {
    const response = {
      status: '302',
      statusDescription: 'Found',
      headers: {
        location: [{
          key: 'Location',
          value: \`https://pay.${domain}\${request.uri}\${request.querystring ? '?' + request.querystring : ''}\`
        }]
      }
    };
    callback(null, response);
    return;
  }

  callback(null, request);
};`;

  const gcloudArmorRule = `gcloud compute security-policies rules create 1000 \\
  --security-policy=YOUR_POLICY_NAME \\
  --expression="request.headers['user-agent'].lower().contains('chatgpt-user') || request.headers['user-agent'].lower().contains('gptbot') || request.headers['user-agent'].lower().contains('perplexitybot') || request.headers['user-agent'].lower().contains('anthropic-ai') || request.headers['user-agent'].lower().contains('claudebot') || request.headers['user-agent'].lower().contains('claude-web') || request.headers['user-agent'].lower().contains('ccbot') || request.headers['user-agent'].lower().contains('cohere-ai') || request.headers['user-agent'].lower().contains('bytespider') || request.headers['user-agent'].lower().contains('oai-searchbot') || request.headers['user-agent'].lower().contains('meta-externalagent') || request.headers['user-agent'].lower().contains('amazonbot') || request.headers['user-agent'].lower().contains('youbot') || request.headers['user-agent'].lower().contains('diffbot')" \\
  --action=redirect \\
  --redirect-type=external-302 \\
  --redirect-target="https://pay.${domain}"`;

  function SectionHeader({ title }: { title: string }) {
    return (
      <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground pt-4 first:pt-0">
        {title}
      </p>
    );
  }

  function toggle(key: string) {
    setExpanded(expanded === key ? null : key);
  }

  return (
    <div className="space-y-4">
      {/* ── CDN & Edge ── */}
      <SectionHeader title="CDN & Edge" />

      {/* Cloudflare */}
      <Card className={expanded === "cloudflare" ? "border-primary/30" : ""}>
        <CardHeader
          className="mb-0 cursor-pointer select-none"
          onClick={() => toggle("cloudflare")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                <ProviderIcon provider="cloudflare" />
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
          className="mb-0 cursor-pointer select-none"
          onClick={() => toggle("vercel")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                <ProviderIcon provider="vercel" />
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

      {/* Fastly */}
      <Card className={expanded === "fastly" ? "border-primary/30" : ""}>
        <CardHeader
          className="mb-0 cursor-pointer select-none"
          onClick={() => toggle("fastly")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                <ProviderIcon provider="fastly" />
              </div>
              <div>
                <CardTitle className="text-base">Fastly</CardTitle>
                <CardDescription>VCL Snippets</CardDescription>
              </div>
            </div>
            {expanded === "fastly" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expanded === "fastly" && (
          <CardContent className="space-y-3 border-t border-border pt-6">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Go to your Fastly service &rarr; <span className="font-medium text-foreground">VCL Snippets</span></li>
              <li>Create a new snippet with type <span className="font-medium text-foreground">recv</span> (within subroutine: <code className="text-xs font-mono bg-muted px-1.5 py-0.5">recv</code>)</li>
              <li>Add a second snippet with type <span className="font-medium text-foreground">error</span></li>
              <li>Paste the following VCL code:</li>
            </ol>
            <div className="relative">
              <pre className="overflow-auto border border-border bg-muted/50 p-4 pr-12 text-xs font-mono leading-relaxed">
                {fastlyVcl}
              </pre>
              <div className="absolute right-2 top-2">
                <CopyButton text={fastlyVcl} label="fastly" />
              </div>
            </div>
            <ol start={5} className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Activate the new service version</li>
            </ol>
          </CardContent>
        )}
      </Card>

      {/* Akamai */}
      <Card className={expanded === "akamai" ? "border-primary/30" : ""}>
        <CardHeader
          className="mb-0 cursor-pointer select-none"
          onClick={() => toggle("akamai")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                <ProviderIcon provider="akamai" />
              </div>
              <div>
                <CardTitle className="text-base">Akamai</CardTitle>
                <CardDescription>Cloudlets or Property Manager</CardDescription>
              </div>
            </div>
            {expanded === "akamai" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expanded === "akamai" && (
          <CardContent className="space-y-3 border-t border-border pt-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Option A: Edge Redirector Cloudlet</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Go to <span className="font-medium text-foreground">Cloudlets &rarr; Edge Redirector</span></li>
                <li>Create a new policy for your property</li>
                <li>Add a rule matching <span className="font-medium text-foreground">Request Header &rarr; User-Agent</span> with regex:</li>
              </ol>
              <div className="relative">
                <pre className="overflow-auto border border-border bg-muted/50 p-4 pr-12 text-xs font-mono leading-relaxed break-all">
                  {botRegex}
                </pre>
                <div className="absolute right-2 top-2">
                  <CopyButton text={botRegex} label="akamai-regex" />
                </div>
              </div>
              <ol start={4} className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Set redirect to <code className="text-xs font-mono bg-muted px-1.5 py-0.5">{`https://pay.${domain}`}</code> with status <span className="font-medium text-foreground">302</span> and path preservation enabled</li>
                <li>Activate the policy version on staging, then production</li>
              </ol>
            </div>

            <div className="border-t border-border" />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Option B: Property Manager</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Open your property in <span className="font-medium text-foreground">Property Manager</span></li>
                <li>Add a new rule with a <span className="font-medium text-foreground">Request Header</span> match condition on <code className="text-xs font-mono bg-muted px-1.5 py-0.5">User-Agent</code> using the regex above</li>
                <li>Add a <span className="font-medium text-foreground">Redirect</span> behavior: 302 to <code className="text-xs font-mono bg-muted px-1.5 py-0.5">{`https://pay.${domain}`}</code> with path appended</li>
                <li>Save and activate to staging, then production</li>
              </ol>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Cloud Providers ── */}
      <SectionHeader title="Cloud Providers" />

      {/* AWS CloudFront */}
      <Card className={expanded === "aws" ? "border-primary/30" : ""}>
        <CardHeader
          className="mb-0 cursor-pointer select-none"
          onClick={() => toggle("aws")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                <ProviderIcon provider="aws" />
              </div>
              <div>
                <CardTitle className="text-base">AWS CloudFront</CardTitle>
                <CardDescription>Lambda@Edge</CardDescription>
              </div>
            </div>
            {expanded === "aws" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expanded === "aws" && (
          <CardContent className="space-y-3 border-t border-border pt-6">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Create a new Lambda function in <span className="font-medium text-foreground">us-east-1</span> (required for Lambda@Edge)</li>
              <li>Use the <span className="font-medium text-foreground">Node.js</span> runtime and paste this code:</li>
            </ol>
            <div className="relative">
              <pre className="overflow-auto border border-border bg-muted/50 p-4 pr-12 text-xs font-mono leading-relaxed">
                {awsLambdaCode}
              </pre>
              <div className="absolute right-2 top-2">
                <CopyButton text={awsLambdaCode} label="aws" />
              </div>
            </div>
            <ol start={3} className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Publish a version of the function</li>
              <li>Go to your CloudFront distribution &rarr; <span className="font-medium text-foreground">Behaviors</span> &rarr; edit the behavior</li>
              <li>Under <span className="font-medium text-foreground">Function associations</span>, attach the Lambda version ARN as a <span className="font-medium text-foreground">Viewer Request</span> trigger</li>
              <li>Deploy the distribution</li>
            </ol>
          </CardContent>
        )}
      </Card>

      {/* Google Cloud */}
      <Card className={expanded === "gcloud" ? "border-primary/30" : ""}>
        <CardHeader
          className="mb-0 cursor-pointer select-none"
          onClick={() => toggle("gcloud")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                <ProviderIcon provider="gcloud" />
              </div>
              <div>
                <CardTitle className="text-base">Google Cloud</CardTitle>
                <CardDescription>Cloud Armor</CardDescription>
              </div>
            </div>
            {expanded === "gcloud" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expanded === "gcloud" && (
          <CardContent className="space-y-3 border-t border-border pt-6">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Go to <span className="font-medium text-foreground">Network Security &rarr; Cloud Armor</span></li>
              <li>Create or select a security policy attached to your backend service</li>
              <li>Add a new rule with priority (e.g. <code className="text-xs font-mono bg-muted px-1.5 py-0.5">1000</code>) using this gcloud command:</li>
            </ol>
            <div className="relative">
              <pre className="overflow-auto border border-border bg-muted/50 p-4 pr-12 text-xs font-mono leading-relaxed break-all">
                {gcloudArmorRule}
              </pre>
              <div className="absolute right-2 top-2">
                <CopyButton text={gcloudArmorRule} label="gcloud" />
              </div>
            </div>
            <ol start={4} className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Replace <code className="text-xs font-mono bg-muted px-1.5 py-0.5">YOUR_POLICY_NAME</code> with your actual security policy name</li>
              <li>Verify the rule is active in the Cloud Armor policy dashboard</li>
            </ol>
          </CardContent>
        )}
      </Card>

      {/* Azure Front Door */}
      <Card className={expanded === "azure" ? "border-primary/30" : ""}>
        <CardHeader
          className="mb-0 cursor-pointer select-none"
          onClick={() => toggle("azure")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                <ProviderIcon provider="azure" />
              </div>
              <div>
                <CardTitle className="text-base">Azure Front Door</CardTitle>
                <CardDescription>Rule Sets</CardDescription>
              </div>
            </div>
            {expanded === "azure" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expanded === "azure" && (
          <CardContent className="space-y-3 border-t border-border pt-6">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Go to your Front Door profile &rarr; <span className="font-medium text-foreground">Rule Sets</span> &rarr; <span className="font-medium text-foreground">Add a rule set</span></li>
              <li>Add a new rule with these conditions:</li>
            </ol>
            <div className="ml-6 space-y-2 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Condition:</span> Request header</p>
              <p><span className="font-medium text-foreground">Header name:</span> User-Agent</p>
              <p><span className="font-medium text-foreground">Operator:</span> Contains</p>
              <p><span className="font-medium text-foreground">Values:</span> Add each bot name as a separate value: <code className="text-xs font-mono bg-muted px-1.5 py-0.5">ChatGPT-User</code>, <code className="text-xs font-mono bg-muted px-1.5 py-0.5">GPTBot</code>, <code className="text-xs font-mono bg-muted px-1.5 py-0.5">PerplexityBot</code>, <code className="text-xs font-mono bg-muted px-1.5 py-0.5">anthropic-ai</code>, <code className="text-xs font-mono bg-muted px-1.5 py-0.5">ClaudeBot</code>, <code className="text-xs font-mono bg-muted px-1.5 py-0.5">Claude-Web</code>, <code className="text-xs font-mono bg-muted px-1.5 py-0.5">CCBot</code>, <code className="text-xs font-mono bg-muted px-1.5 py-0.5">cohere-ai</code>, <code className="text-xs font-mono bg-muted px-1.5 py-0.5">Bytespider</code>, <code className="text-xs font-mono bg-muted px-1.5 py-0.5">OAI-SearchBot</code>, <code className="text-xs font-mono bg-muted px-1.5 py-0.5">meta-externalagent</code>, <code className="text-xs font-mono bg-muted px-1.5 py-0.5">Amazonbot</code>, <code className="text-xs font-mono bg-muted px-1.5 py-0.5">YouBot</code>, <code className="text-xs font-mono bg-muted px-1.5 py-0.5">Diffbot</code></p>
            </div>
            <ol start={3} className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Set action to <span className="font-medium text-foreground">URL redirect</span>:
                <div className="mt-2 ml-4 space-y-1">
                  <p><span className="font-medium text-foreground">Redirect type:</span> Found (302)</p>
                  <p><span className="font-medium text-foreground">Protocol:</span> HTTPS</p>
                  <p><span className="font-medium text-foreground">Hostname:</span> <code className="text-xs font-mono bg-muted px-1.5 py-0.5">{`pay.${domain}`}</code></p>
                </div>
              </li>
              <li>Associate the rule set with your Front Door route</li>
              <li>Save and wait for the configuration to propagate</li>
            </ol>
          </CardContent>
        )}
      </Card>

      {/* ── Security Platforms ── */}
      <SectionHeader title="Security Platforms" />

      {/* DataDome */}
      <Card className={expanded === "datadome" ? "border-primary/30" : ""}>
        <CardHeader
          className="mb-0 cursor-pointer select-none"
          onClick={() => toggle("datadome")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                <ProviderIcon provider="datadome" />
              </div>
              <div>
                <CardTitle className="text-base">DataDome</CardTitle>
                <CardDescription>Bot redirect configuration</CardDescription>
              </div>
            </div>
            {expanded === "datadome" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expanded === "datadome" && (
          <CardContent className="space-y-3 border-t border-border pt-6">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Log in to your DataDome dashboard</li>
              <li>Go to <span className="font-medium text-foreground">Management &rarr; Access Controls &rarr; AI agents</span></li>
              <li>
                For each AI bot agent listed, set the action to <span className="font-medium text-foreground">Redirect</span> with target:
                <div className="mt-2 ml-4">
                  <code className="text-xs font-mono bg-muted px-1.5 py-0.5">{`https://pay.${domain}`}</code>
                </div>
              </li>
              <li>Save your configuration</li>
            </ol>
            <p className="text-xs text-muted-foreground">
              DataDome automatically identifies AI bots. Configure each agent (ChatGPT, Claude, Perplexity, etc.) individually in the Access Controls panel.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Imperva */}
      <Card className={expanded === "imperva" ? "border-primary/30" : ""}>
        <CardHeader
          className="mb-0 cursor-pointer select-none"
          onClick={() => toggle("imperva")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                <ProviderIcon provider="imperva" />
              </div>
              <div>
                <CardTitle className="text-base">Imperva</CardTitle>
                <CardDescription>Security Rules</CardDescription>
              </div>
            </div>
            {expanded === "imperva" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expanded === "imperva" && (
          <CardContent className="space-y-3 border-t border-border pt-6">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Select your site in the Imperva console</li>
              <li>Go to <span className="font-medium text-foreground">Security Rules</span></li>
              <li>Click <span className="font-medium text-foreground">Add Rule</span></li>
              <li>
                Set the filter condition:
                <div className="mt-2 ml-4 space-y-1">
                  <p><span className="font-medium text-foreground">Parameter:</span> User-Agent</p>
                  <p><span className="font-medium text-foreground">Condition:</span> Matches regex</p>
                </div>
              </li>
              <li>Paste the bot regex pattern:</li>
            </ol>
            <div className="relative">
              <pre className="overflow-auto border border-border bg-muted/50 p-4 pr-12 text-xs font-mono leading-relaxed break-all">
                {botRegex}
              </pre>
              <div className="absolute right-2 top-2">
                <CopyButton text={botRegex} label="imperva-regex" />
              </div>
            </div>
            <ol start={6} className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Set action to <span className="font-medium text-foreground">Redirect (302)</span> with target:
                <div className="mt-2 ml-4">
                  <code className="text-xs font-mono bg-muted px-1.5 py-0.5">{`https://pay.${domain}`}</code>
                </div>
              </li>
              <li>Save and activate the rule</li>
            </ol>
          </CardContent>
        )}
      </Card>

      {/* ── CMS & Hosting ── */}
      <SectionHeader title="CMS & Hosting" />

      {/* WordPress VIP */}
      <Card className={expanded === "wordpress" ? "border-primary/30" : ""}>
        <CardHeader
          className="mb-0 cursor-pointer select-none"
          onClick={() => toggle("wordpress")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                <ProviderIcon provider="wordpress" />
              </div>
              <div>
                <CardTitle className="text-base">WordPress VIP</CardTitle>
                <CardDescription>Edge configuration</CardDescription>
              </div>
            </div>
            {expanded === "wordpress" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expanded === "wordpress" && (
          <CardContent className="space-y-3 border-t border-border pt-6">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>In the WordPress VIP Dashboard, go to <span className="font-medium text-foreground">Integrations Center</span></li>
              <li>Enable the <span className="font-medium text-foreground">Bot Redirect</span> integration</li>
              <li>
                Configure the redirect target:
                <div className="mt-2 ml-4">
                  <code className="text-xs font-mono bg-muted px-1.5 py-0.5">{`https://pay.${domain}`}</code>
                </div>
              </li>
              <li>Save and deploy</li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Alternatively, contact VIP support to configure custom edge rules for bot user-agent redirection on your property.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Arc XP */}
      <Card className={expanded === "arcxp" ? "border-primary/30" : ""}>
        <CardHeader
          className="mb-0 cursor-pointer select-none"
          onClick={() => toggle("arcxp")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                <ProviderIcon provider="arcxp" />
              </div>
              <div>
                <CardTitle className="text-base">Arc XP</CardTitle>
                <CardDescription>Delivery UI Edge Integrations</CardDescription>
              </div>
            </div>
            {expanded === "arcxp" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expanded === "arcxp" && (
          <CardContent className="space-y-3 border-t border-border pt-6">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Go to <span className="font-medium text-foreground">Delivery UI &rarr; Edge Integrations</span></li>
              <li>Enable the <span className="font-medium text-foreground">Bot Redirect</span> toggle</li>
              <li>
                Set the redirect target to:
                <div className="mt-2 ml-4">
                  <code className="text-xs font-mono bg-muted px-1.5 py-0.5">{`https://pay.${domain}`}</code>
                </div>
              </li>
              <li>Save the configuration</li>
            </ol>
          </CardContent>
        )}
      </Card>

      {/* ── Other ── */}
      <SectionHeader title="Other" />

      {/* General Bot Paywall */}
      <Card className={expanded === "general" ? "border-primary/30" : ""}>
        <CardHeader
          className="mb-0 cursor-pointer select-none"
          onClick={() => toggle("general")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                <ProviderIcon provider="general" />
              </div>
              <div>
                <CardTitle className="text-base">General Bot Paywall</CardTitle>
                <CardDescription>Any platform with user-agent redirect support</CardDescription>
              </div>
            </div>
            {expanded === "general" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expanded === "general" && (
          <CardContent className="space-y-6 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              Any web server or reverse proxy that supports user-agent matching can redirect AI bots to your Tollgate payment gateway. Below are examples for Nginx and Apache.
            </p>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Nginx</h4>
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
            </div>

            <div className="border-t border-border" />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Apache</h4>
              <p className="text-sm text-muted-foreground">
                Add this to your <code className="text-xs font-mono bg-muted px-1.5 py-0.5">.htaccess</code> or virtual host configuration:
              </p>
              <div className="relative">
                <pre className="overflow-auto border border-border bg-muted/50 p-4 pr-12 text-xs font-mono leading-relaxed">
                  {apacheConfig}
                </pre>
                <div className="absolute right-2 top-2">
                  <CopyButton text={apacheConfig} label="apache" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Requires <code className="font-mono">mod_rewrite</code> to be enabled. Place in <code className="font-mono">.htaccess</code> at document root or in the <code className="font-mono">&lt;VirtualHost&gt;</code> block.
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
