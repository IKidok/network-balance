import { Entity, Index, PrimaryColumn } from 'typeorm';

@Entity()
@Index(['r_login', 'r_source', 'login', 'source'], { unique: true })
export class Subscription {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  login: string;

  @PrimaryColumn({ type: 'int', unsigned: true })
  source: number;

  @PrimaryColumn({ type: 'bigint', unsigned: true })
  r_login: string;

  @PrimaryColumn({ type: 'int', unsigned: true })
  r_source: number;
}
