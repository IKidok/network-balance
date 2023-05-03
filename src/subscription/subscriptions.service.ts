import { Injectable } from '@nestjs/common';
import { Subscription } from './subscription.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async getAll(): Promise<Subscription[]> {
    return await this.subscriptionRepository.find();
  }
  async subscribe(subscription: Subscription): Promise<Subscription> {
    console.log('subscribe', subscription);
    return await this.subscriptionRepository.save(subscription);
  }

  async unsubscribe(subscription: Subscription): Promise<void> {
    console.log('unsubscribe', subscription);
    const result = await this.subscriptionRepository.delete(subscription);
    console.log(result);
  }
}
