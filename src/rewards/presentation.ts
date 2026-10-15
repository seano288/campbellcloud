import type { ComponentType } from 'preact';

export interface RewardPresentation {
  Entry: ComponentType<{ onOpen(): void }>;
  readonly setup: null | { View: ComponentType<{ onDone(): void; signal: AbortSignal }> };
  Goal?: ComponentType<{ balance: number }>;
}

export interface RewardCues<State> {
  hasAffordable(state: State, balance: number): boolean;
  becameAffordable(state: State, beforeBalance: number, afterBalance: number): boolean;
}
