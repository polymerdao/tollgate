"use client";

import { useAccount, useDisconnect } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

interface Props {
  onAddressSelected: (address: string) => void;
  saving: boolean;
}

export function WalletConnectButton({ onAddressSelected, saving }: Props) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <Button
          size="sm"
          onClick={() => onAddressSelected(address)}
          disabled={saving}
        >
          {saving ? "Saving..." : "Use this address"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => disconnect()}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <ConnectKitButton.Custom>
      {({ show }) => (
        <Button size="sm" variant="outline" onClick={show}>
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      )}
    </ConnectKitButton.Custom>
  );
}
