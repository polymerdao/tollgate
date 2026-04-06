"use client";

import { useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle } from "lucide-react";

interface Props {
  onAddressSelected: (address: string) => void;
  onDisconnect: () => void;
}

export function useWalletConnected() {
  const { isConnected } = useAccount();
  return isConnected;
}

export function WalletConnectButton({ onAddressSelected, onDisconnect }: Props) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (isConnected && address) {
      onAddressSelected(address);
    }
  }, [isConnected, address]);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 w-full">
        <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-mono text-sm flex-1 truncate">{address}</span>
        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
        <Button size="sm" variant="ghost" className="shrink-0 h-6 px-2 text-xs" onClick={() => { disconnect(); onDisconnect(); }}>
          Disconnect
        </Button>
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
