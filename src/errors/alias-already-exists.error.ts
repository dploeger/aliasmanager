import { Alias } from '../alias/alias';
import * as winston from 'winston';

export class AliasAlreadyExistsError extends Error {
  public static readonly NAME = 'AliasAlreadyExistsError';

  constructor(username: string, newAlias: Alias) {
    const message = `User ${username} already has an alias for address ${newAlias.address}`;
    winston.error(message);
    super(message);
    this.name = AliasAlreadyExistsError.NAME;
  }
}
