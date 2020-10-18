# Aliasmanager

## About the project

The Aliasmanager consists of a Frontend and an API-Server that manages 
specific attributes in an LDAP server.

When integrated in an MTA (like Postfix), these attributes can be used
as aliases for the main E-Mail address.

## Introduction

This repository holds the API-Server for the Aliasmanager based on 
[Nest](https://nestsjs.com).

The frontend based on [Vuejs](https://vuejs.org) can be found at
https://github.com/dploeger/aliasmanager-client.

The API-Server mostly consists of a login endpoint, that generates
a JWT token and an account endpoint that provides CRUD operations
for the specific aliases.

It requires a connection to an existing LDAP-Server that it can 
manage.

## Running the backend

The whole project is meant to be run through docker. Please check out
[the aliasmanager-docker repository](https://github.com/dploger/aliasmanager-docker)
for details.

## Configuration

The API-Server has to be configured using environment variables. The
following variables are supported:

* AM_PORT: Port the API service should listen to [3000]
* AM_LOGLEVEL: Maximum log level. Valid values are: error, warn, info, http, verbose, debug, silly [info]
* AM_CRYPTO_JWT_SECRET: The secret that is used to sign the JWT tokens.
  Be sure to use a long and complex string for that and keep it
  absolutely secret. (Aliasmanager only accepts secrets >= 64 characters)
* AM_CRYPTO_JWT_EXPIRES: The time string that specifies how long the JWT
  token is valid. Use something like "60s", "3h", "2d", etc. [30m]
* AM_LDAP_URL: The LDAP connection URL used to connect to the backend
  LDAP server
* AM_LDAP_BIND_DN: The DN of the user used to bind to the LDAP server.
  The user needs to have permissions to alter (add/delete) attributes for
  any account it should manage 
* AM_LDAP_BIND_PW: The password of the bind user
* AM_LDAP_USER_DN: The base dn where to find user accounts
* AM_LDAP_USER_ATTR: The attribute identifiying a user [uid]
* AM_LDAP_ALIAS_ATTR:  The attribute that should be used for aliases [registeredAddress]

## Usage

The main idea behind the Aliasmanager project is that an LDAP server
is included into an MTA to lookup alias address and know where
to deliver mails for these aliases.

### Postfix

To setup this in Postfix, create an LDAP configuration file like this:

```
server_host = ldaps://ldap.company.com:636
version = 3
bind = yes
bind_dn = cn=aliasadmin,dc=company,dc=com
bind_pw = verysecretpassword
search_base = dc=company,dc=com
query_filter = registeredAddress=%s
result_attribute = destinationIndicator
```

and refer to this file in the `main.cf` property `virtual_alias_maps`:

    virtual_alias_maps = ldap:/etc/postfix/virtual-ldap.cf

This would securely connect to the LDAP server ldap.company.com, 
look for the alias using the attribute `registeredAddress`. When found,
it would use the attribute `destinationIndicator` to route the mails
to. (The content of `destinationIndicator` correspond to entries
in a postfix [virtual map](http://www.postfix.org/VIRTUAL_README.html))

For more details about LDAP for postfix, check out the 
[Postfix LDAP guide](http://www.postfix.org/LDAP_README.html).

# Development

If you want to contribute to this project, that is awesome!

Please create an issue for the project first describing the bug
you found or the feature youd like to implement.

If youre up for it, create a pull request after that.

This project aims to be fully tested and includes unit and e2e-tests
in jest/supertest formats (check out the _spec.ts files).

So please work in a test driven development way by 
adding a test to the respective test suite first showing the bug 
or feature youd like to solve/implement and run the test suite. 

The test should fail.

Then solve the bug or implement the feature until the test is green.

Please aim for a 100% test coverage. Ingore specific lines for test
coverage, if that line only covers a corner case.
