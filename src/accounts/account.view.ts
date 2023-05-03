import { AccountModel } from './acccount.model';
import { Account } from './account.entity';

export function viewAccount(entities: Account[]): AccountModel[] {
  return entities.map((e) => ({
    login: BigInt(e.login),
    source: e.source,
    balance_usd: e.balance_usd,
    balance_usd_sub: e.balance_usd_sub,
    subscribers_count: e.subscribers_count ?? 0,
  }));
}
