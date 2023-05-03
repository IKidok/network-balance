import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async getAll(): Promise<Account[]> {
    const accounts = await this.accountRepository.find();
    return accounts;
  }

  async updateAll(accounts: Account[]): Promise<void> {
    for (const account of accounts) {
      await this.accountRepository.save(account);
    }
  }
}
