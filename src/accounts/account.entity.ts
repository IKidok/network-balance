import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Account {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  login: string;

  @PrimaryColumn({ type: 'int', unsigned: true })
  source: number;

  @Column({ type: 'double', default: 0, nullable: true })
  balance_usd: number;

  @Column({ type: 'double', default: 0, nullable: true })
  balance_usd_sub: number;

  @Column({ type: 'int', default: 0, nullable: true })
  subscribers_count: number;
}
