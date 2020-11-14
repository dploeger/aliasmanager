import * as winston from 'winston';

/**
 * Can not contact to the configured LDAP server
 */
export class CantConnectToLdapError extends Error {
  public static readonly NAME = 'CantConnectToLdapError';

  constructor() {
    const message = `Can not connect or bind to LDAP server`;
    winston.error(message);
    super(message);
    this.name = CantConnectToLdapError.NAME;
  }
}
