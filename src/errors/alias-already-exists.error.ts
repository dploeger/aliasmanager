import { Alias } from '../schemas/alias';
import * as winston from 'winston';

/**
 * The specified alias to be created or updated already exists
 */
export class AliasAlreadyExistsError extends Error {
  public static readonly NAME = 'AliasAlreadyExistsError';

  constructor(username: string, newAlias: Alias) {
    const message = `User ${username} already has an alias for address ${newAlias.address}`;
    winston.error(message);
    super(message);
    this.name = AliasAlreadyExistsError.NAME;
  }
}
