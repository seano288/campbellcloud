export type PurchaseProposal<S, E> =
  | { kind: 'ready'; state: S; cost: number }
  | { kind: 'rejected'; reason: E };

export interface RewardPurchases<S, Request, Failure> {
  proposePurchase(state: S, request: Request, balance: number): PurchaseProposal<S, Failure>;
}
