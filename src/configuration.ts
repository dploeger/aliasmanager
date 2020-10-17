export interface Configuration {
  AM_CRYPTO_SALT: string;
  AM_CRYPTO_ITERATIONS: number;
  AM_CRYPTO_SIZE: number;
  AM_CRYPTO_DIGEST: string;
  AM_CRYPTO_JWT_SECRET: string;
  AM_CRYPTO_JWT_EXPIRES: string;
  AM_LDAP_URL: string;
  AM_LDAP_BIND_DN: string;
  AM_LDAP_BIND_PW: string;
  AM_LDAP_USER_DN: string;
  AM_LDAP_USER_ATTR: string;
  AM_LDAP_ALIAS_ATTR: string;
}
