"use client";

import { useAccount, useDisconnect } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle } from "lucide-react";

interface Props {
  onAddressSelected: (address: string) => void;
  saving: boolean;
}

export function useWalletConnected() {
  const { isConnected } = useAccount();
  return isConnected;
}

export function WalletConnectButton({ onAddressSelected, saving }: Props) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
          <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-mono text-sm flex-1 truncate">{address}</span>
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onAddressSelected(address)} disabled={saving}>
            {saving ? "Saving..." : "Use this address"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => disconnect()}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ConnectKitButton.Custom>
      {({ show }) => (
        <Button size="sm" variant="outline" className="w-fit" onClick={show}>
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      )}
    </ConnectKitButton.Custom>
  );
}
