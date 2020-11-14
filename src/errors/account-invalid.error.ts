import * as winston from 'winston';

/**
 * The specified account is invalid or can not be found
 */
export class AccountInvalidError extends Error {
  public static readonly NAME = 'AccountInvalidError';

  constructor(username: string) {
    const message = `Account ${username} is invalid`;
    winston.error(message);
    super(message);
    this.name = AccountInvalidError.NAME;
  }
}
