import { createPublicClient, http, decodeEventLog, type Hex } from "viem";
import { base } from "viem/chains";
import { USDC_ADDRESS_BASE, USDC_TRANSFER_EVENT_ABI } from "./usdc";
import type { VerificationResult } from "./types";

const MIN_CONFIRMATIONS = 1;

export async function verifyPayment(
  txHash: Hex,
  expectedRecipient: string,
  expectedAmountMinor: number,
  rpcUrl?: string,
  usdcAddress?: string
): Promise<VerificationResult> {
  const usdcContract = usdcAddress ?? USDC_ADDRESS_BASE;
  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: txHash });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "RPC error";
    return { valid: false, error: `Failed to fetch receipt: ${msg}`, txHash, from: "", to: "", amount: 0n };
  }

  if (receipt.status !== "success") {
    return { valid: false, error: "Transaction failed", txHash, from: "", to: "", amount: 0n };
  }

  // Check confirmations
  const currentBlock = await client.getBlockNumber();
  const confirmations = currentBlock - receipt.blockNumber;
  if (confirmations < MIN_CONFIRMATIONS) {
    return { valid: false, error: "Insufficient confirmations", txHash, from: "", to: "", amount: 0n };
  }

  // Find USDC Transfer event to the expected recipient
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== usdcContract.toLowerCase()) continue;

    try {
      const decoded = decodeEventLog({
        abi: USDC_TRANSFER_EVENT_ABI,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName !== "Transfer") continue;

      const { from, to, value } = decoded.args;

      if (to.toLowerCase() !== expectedRecipient.toLowerCase()) continue;

      if (value < BigInt(expectedAmountMinor)) {
        return { valid: false, error: "Amount too low", txHash, from, to, amount: value };
      }

      return { valid: true, txHash, from, to, amount: value };
    } catch {
      continue;
    }
  }

  return { valid: false, error: "No matching USDC transfer found", txHash, from: "", to: "", amount: 0n };
}
