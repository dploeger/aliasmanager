import * as winston from 'winston';

export class AliasDoesNotExistError extends Error {
  public static readonly NAME = 'AliasDoesNotExistError';

  constructor(username: string, address: string) {
    const message = `Alias ${address} was not found on account ${username}`;
    winston.error(message);
    super(message);
    this.name = AliasDoesNotExistError.NAME;
  }
}
