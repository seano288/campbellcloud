import { readCurrency } from '../../src/currency/currency';

export const fixtureDay = '2026-10-15';
export const record = (raw: unknown): Record<string, unknown> => raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
export const count = (raw: unknown) => typeof raw === 'number' && Number.isSafeInteger(raw) && raw >= 0 ? raw : 0;
export const readWallet = (raw: unknown) => readCurrency(record(record(raw).currency).balance);
