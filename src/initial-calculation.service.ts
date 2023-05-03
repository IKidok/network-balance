import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { SubscriptionsService } from './subscription/subscriptions.service';
import { AccountsService } from './accounts/accounts.service';
import { Account } from './accounts/account.entity';
import { Subscription } from './subscription/subscription.entity';

@Injectable()
export class InitialCalculationService implements OnApplicationBootstrap {
  constructor(
    @Inject(AccountsService)
    private accountsService: AccountsService,
    @Inject(SubscriptionsService)
    private subscriptionsService: SubscriptionsService,
  ) {}
  async onApplicationBootstrap() {
    console.log('Start calculations');
    await this.calculateNetworkBalance();
  }
  async calculateNetworkBalance(): Promise<void> {
    // загружаем все сущности аккаунтов и подписок из базы данных

    const accounts: Account[] = await this.accountsService.getAll();
    const subscriptions: Subscription[] = await this.subscriptionsService.getAll();

    const networkSubscribers = new Map<string, Set<string>>(); // создаем мапу для хранения балансов

    // рекурсивно находим подписчиков
    function calculateBalance(
      login: string,
      source: number,
      currentSubNet: Set<string> = new Set<string>(),
    ): Set<string> {
      const key = `${login}:${source}`;

      // если баланс уже вычислен, возвращаем его из мапы
      if (networkSubscribers.has(key)) {
        return networkSubscribers.get(key)!;
      }

      // находим все подписки, связанные с этим аккаунтом
      const subscriptionsTo = subscriptions.filter(
        (s) => s.login === login && s.source === source,
      );

      // проходим по каждой подписке и добавляем баланс подписываемого аккаунта
      return subscriptionsTo.reduce<Set<string>>((subs, subscription) => {
        if (
          subs.has(`${subscription.r_login}:${subscription.r_source}`) ||
          currentSubNet.has(`${subscription.r_login}:${subscription.r_source}`)
        ) {
          return subs;
        }
        currentSubNet.add(key);
        const subSubs = calculateBalance(
          subscription.r_login,
          subscription.r_source,
          currentSubNet,
        );
        subSubs.forEach((sub) => subs.add(sub));
        return subs;
      }, new Set<string>().add(key));
    }

    const accountsBalances = {};
    // проходим по каждому аккаунту и вычисляем его баланс
    for (const account of accounts) {
      accountsBalances[`${account.login}:${account.source}`] =
        account.balance_usd;
      const networkSubs = calculateBalance(account.login, account.source);
      networkSubscribers.set(`${account.login}:${account.source}`, networkSubs);
    }
    for (const account of accounts) {
      const subscribers = networkSubscribers.get(
        `${account.login}:${account.source}`,
      );
      let networkBalance = 0;
      subscribers.forEach((subscriber) => {
        const [login, source] = subscriber.split(':');
        networkBalance += accountsBalances[`${login}:${source}`];
      });
      account.balance_usd_sub = networkBalance;
      account.subscribers_count = subscribers.size - 1;
    }

    await this.accountsService.updateAll(accounts);
  }
}
