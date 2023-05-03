import { Controller, Get, Inject, Post, RawBodyRequest, Req, Res, UseInterceptors } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './subscription.entity';
import { SubscriptionDto } from './subscription.dto';
import { Request, Response } from 'express';
import { parse, stringify } from 'json-bigint';
import { RecalculateInterceptor } from '../middlewares/recalculate.middleware';

@Controller('subscriptions')

export class SubscriptionsController {
  constructor(
    @Inject(SubscriptionsService)
    private subscriptionsService: SubscriptionsService,
  ) {}

  @Get()
  async getAll(): Promise<Subscription[]> {
    return await this.subscriptionsService.getAll();
  }

  @UseInterceptors(RecalculateInterceptor)
  @Post('subscribe')
  async subscribe(@Req() request: RawBodyRequest<Request>, @Res() res: Response) {
    const subscriptionBody = request.rawBody.toString();
    const subscriptionDto: SubscriptionDto = parse(subscriptionBody);

    const subscription = new Subscription();
    subscription.login = subscriptionDto.login.toString();
    subscription.r_login = subscriptionDto.r_login.toString();
    subscription.source = subscriptionDto.source;
    subscription.r_source = subscriptionDto.r_source;
    await this.subscriptionsService.subscribe(subscription);
    res.type('application/json').send(stringify(subscriptionDto));
  }
  @UseInterceptors(RecalculateInterceptor)
  @Post('unsubscribe')
  async unsubscribe(@Req() request: RawBodyRequest<Request>, @Res() res: Response): Promise<void> {
    const subscriptionBody = request.rawBody.toString();
    const subscriptionDto: SubscriptionDto = parse(subscriptionBody);

    const subscription = new Subscription();
    subscription.login = subscriptionDto.login.toString();
    subscription.r_login = subscriptionDto.r_login.toString();
    subscription.source = subscriptionDto.source;
    subscription.r_source = subscriptionDto.r_source;
    await this.subscriptionsService.unsubscribe(subscription);
    res.type('application/json');
    res.status(204);
    res.send(stringify(subscription));
  }
}
