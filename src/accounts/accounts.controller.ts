import { Controller, Get, Inject, Response } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { viewAccount } from './account.view';
import { stringify } from 'json-bigint';

@Controller('accounts')
export class AccountsController {
  constructor(
    @Inject(AccountsService)
    private accountsService: AccountsService,
  ) {}

  @Get('rating')
  async getRating(@Response() res) {
    const accounts = await this.accountsService.getAll();
    const viewAccounts = viewAccount(accounts);
    res.type('application/json');
    res.send(stringify(viewAccounts));
  }
}
