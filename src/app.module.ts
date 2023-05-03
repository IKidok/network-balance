import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsModule } from './subscription/subscriptionsModule';
import { AccountsModule } from './accounts/accounts.module';
import { InitialCalculationService } from './initial-calculation.service';
import { Account } from './accounts/account.entity';
import { Subscription } from './subscription/subscription.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('HOST'),
        port: 3306,
        username: config.get<string>('MYSQL_USER'),
        password: config.get<string>('MYSQL_PASSWORD'),
        database: config.get<string>('MYSQL_DATABASE'),
        entities: [Account, Subscription],
        synchronize: true,
        autoLoadEntities: true,
        logging: true,
      }),
    }),
    SubscriptionsModule,
    AccountsModule,
  ],
  controllers: [AppController],
  providers: [AppService, InitialCalculationService],
})
export class AppModule {}
