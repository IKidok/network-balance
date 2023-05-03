import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { parse } from 'json-bigint';
import { DataSource } from 'typeorm';
import { Subscription } from '../subscription/subscription.entity';
import { Account } from '../accounts/account.entity';

@Injectable()
export class RecalculateInterceptor implements NestInterceptor {
  constructor(
    @Inject(DataSource)
    readonly dataSource: DataSource,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Before...');
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      tap(async () => {
        const subscription = parse(response.req.rawBody.toString());
        await this.recalculateNetworkBalance(subscription);
      }),
    );
  }

  async recalculateNetworkBalance(response) {
    const accountToHandle = new Set();
    const notHandledAccounts = new Set<Account>();

    const relatedSubscriptions = [];
    const relatedAccounts = [];
    console.log(response);
    relatedSubscriptions.push(
      ...(await this.getRelatedSubscriptions(
        response.login.toString(),
        response.source,
        'up',
      )),
    );
    relatedAccounts.push(
      ...(await this.getAccountFromSubscriptions(relatedSubscriptions)),
    );
    relatedAccounts.forEach((account) => {
      if (
        account.login === response.login.toString() &&
        account.source === response.source
      ) {
        accountToHandle.add(`${account.login}:${account.source}`);
      } else {
        notHandledAccounts.add(account);
      }
    });
    const iterator = notHandledAccounts.values();
    let notHandledAccount = iterator.next().value;
    while (
      notHandledAccounts.size > 0 &&
      !accountToHandle.has(
        `${notHandledAccount.login}:${notHandledAccount.source}`,
      )
    ) {
      const subscriptionsForAccount = await this.getRelatedSubscriptions(
        notHandledAccount.login,
        notHandledAccount.source,
        'up',
      );
      relatedSubscriptions.push(...subscriptionsForAccount);
      const relatedAccountsW = await this.getAccountFromSubscriptions(
        subscriptionsForAccount,
      );
      relatedAccountsW.forEach((account) => {
        if (accountToHandle.has(`${account.login}:${account.source}`)) return;
        if (
          account.login === notHandledAccount.login &&
          account.source === notHandledAccount.source
        ) {
          accountToHandle.add(`${account.login}:${account.source}`);
        } else {
          relatedAccounts.push(account);
          notHandledAccounts.add(account);
        }
      });
      const temp = notHandledAccount;
      notHandledAccount = iterator.next().value;
      notHandledAccounts.delete(temp);
    }

    const calculateIterator = accountToHandle.values();
    let calculateAccount = calculateIterator.next().value;
    while (calculateAccount) {
      const [login, source] = calculateAccount.split(':');
      await this.calculateBalance(
        relatedAccounts.find(
          (account) => account.login === login && account.source === +source,
        ),
      );
      calculateAccount = calculateIterator.next().value;
    }
  }

  async getAccountFromSubscriptions(
    subscriptions,
    direction: 'up' | 'down' | undefined = undefined,
  ) {
    const query = this.dataSource
      .getRepository(Account)
      .createQueryBuilder('account');
    subscriptions.forEach((sub) => {
      if (!direction) {
        query.orWhere(`account.login = :login && account.source = :source`, {
          login: sub.login,
          source: sub.source,
        });
        query.orWhere(
          `account.login = :r_login && account.source = :r_source`,
          {
            r_login: sub.r_login,
            r_source: sub.r_source,
          },
        );
      } else if (direction === 'up') {
        query.orWhere(`account.login = :login && account.source = :source`, {
          login: sub.r_login,
          source: sub.r_source,
        });
      } else {
        query.orWhere(`account.login = :login && account.source = :source`, {
          login: sub.login,
          source: sub.source,
        });
      }
    });
    return await query.getMany();
  }

  async getRelatedSubscriptions(
    login,
    source,
    direction: 'up' | 'down' | undefined = undefined,
  ): Promise<Subscription[]> {
    const query = this.dataSource
      .getRepository(Subscription)
      .createQueryBuilder('subscription');
    if (!direction) {
      query
        .where(
          'subscription.login = :login AND subscription.source = :source ',
          {
            login,
            source,
          },
        )
        .orWhere(
          'subscription.r_login = :login AND subscription.r_source = :source',
          { login, source },
        );
    } else {
      if (direction === 'up') {
        query.where(
          'subscription.r_login = :login AND subscription.r_source = :source',
          { login, source },
        );
      } else {
        query.where(
          'subscription.login = :login AND subscription.source = :source ',
          {
            login,
            source,
          },
        );
      }
    }
    return await query.getMany();
  }

  async calculateBalance(account: Account) {
    const subs = await this.calcSubBalance(account.login, account.source);
    console.log(subs);
    const query = this.dataSource
      .getRepository(Account)
      .createQueryBuilder('account');
    let i = 0;
    subs.forEach((sub) => {
      const [login, source] = sub.split(':');
      const keyLogin = 'login' + i;
      const keySource = 'source' + i;
      query.orWhere(
        `account.login = :login${i} && account.source = :source${i}`,
        { [keyLogin]: login, [keySource]: source },
      );
      i++;
    });
    const accs = await query.getMany();
    const { totalBalance, subsCount } = accs.reduce<{
      totalBalance: number;
      subsCount: number;
    }>(
      (acc, account) => {
        acc.totalBalance += account.balance_usd;
        acc.subsCount += 1;
        return acc;
      },
      { totalBalance: 0, subsCount: -1 },
    );

    console.log(totalBalance)
    account.balance_usd_sub = totalBalance;
    account.subscribers_count = subsCount;
    await this.dataSource.getRepository(Account).save(account);
  }

  async calcSubBalance(
    login: string,
    source: number,
    currentSubNet: Set<string> = new Set<string>(),
  ): Promise<Set<string>> {
    const key = `${login}:${source}`;

    // находим все подписки, связанные с этим аккаунтом
    const subscriptionAccounts = await this.getRelatedSubscriptions(
      login,
      source,
      'down',
    );

    // проходим по каждой подписке и добавляем баланс подписываемого аккаунта
    const subs = new Set<string>().add(key);
    for (const subscription of subscriptionAccounts) {
      if (
        !(
          subs.has(`${subscription.r_login}:${subscription.r_source}`) ||
          currentSubNet.has(`${subscription.r_login}:${subscription.r_source}`)
        )
      ) {
        currentSubNet.add(key);
        const subSubs = await this.calcSubBalance(
          subscription.r_login,
          subscription.r_source,
          currentSubNet,
        );
        subSubs.forEach((sub) => subs.add(sub));
      }
    }
    return subs;
  }
}
