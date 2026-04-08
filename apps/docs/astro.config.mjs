import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  integrations: [
    starlight({
      title: "Tollgate Docs",
      description: "x402 bot payment gateway — charge AI bots for content access via on-chain micropayments",
      customCss: ["./src/styles/custom.css"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/AudiusProject/tollgate",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", link: "/" },
            { label: "How It Works", link: "/getting-started/how-it-works/" },
            { label: "Quickstart", link: "/getting-started/quickstart/" },
          ],
        },
        {
          label: "Integrations",
          items: [
            { label: "Overview", link: "/integrations/" },
            {
              label: "CDN & Edge",
              items: [
                { label: "Cloudflare", link: "/integrations/cloudflare/" },
                { label: "Vercel", link: "/integrations/vercel/" },
                { label: "Fastly", link: "/integrations/fastly/" },
                { label: "Akamai", link: "/integrations/akamai/" },
              ],
            },
            {
              label: "Cloud Providers",
              items: [
                { label: "AWS CloudFront", link: "/integrations/aws/" },
                { label: "Google Cloud", link: "/integrations/google-cloud/" },
                { label: "Azure Front Door", link: "/integrations/azure/" },
              ],
            },
            {
              label: "Security Platforms",
              items: [
                { label: "DataDome", link: "/integrations/datadome/" },
                { label: "Imperva", link: "/integrations/imperva/" },
              ],
            },
            {
              label: "CMS & Hosting",
              items: [
                { label: "WordPress VIP", link: "/integrations/wordpress-vip/" },
                { label: "Arc XP", link: "/integrations/arc-xp/" },
              ],
            },
            { label: "General Bot Paywall", link: "/integrations/general/" },
          ],
        },
        {
          label: "Dashboard",
          items: [
            { label: "Managing Sites", link: "/dashboard/sites/" },
            { label: "Pricing", link: "/dashboard/pricing/" },
            { label: "Bot Management", link: "/dashboard/bots/" },
            { label: "Payouts", link: "/dashboard/payouts/" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Bot User Agents", link: "/reference/bot-user-agents/" },
          ],
        },
      ],
    }),
  ],
});
