import { IntegrationGuide } from "@/components/dashboard/integration-guide";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Add Tollgate to your site by configuring your CDN to redirect AI bot traffic to the payment gateway.
        </p>
      </div>
      <IntegrationGuide domain="yourdomain.com" />
    </div>
  );
}
