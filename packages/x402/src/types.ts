/** x402 response body returned with HTTP 402 */
export interface X402PaymentRequired {
  price: string;
  currency: "USDC";
  network: "base";
  recipientAddress: string;
  paymentId: string;
  expiresAt: string;
  contentUrl: string;
}

/** Headers submitted by bot after payment */
export interface PaymentProofHeaders {
  "x-payment-proof": string;
  "x-payment-id": string;
  "x-payment-chain": string;
}

/** Result of verifying a payment on-chain */
export interface VerificationResult {
  valid: boolean;
  error?: string;
  txHash: string;
  from: string;
  to: string;
  amount: bigint;
}
