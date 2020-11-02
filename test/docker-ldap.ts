import * as Docker from 'dockerode';
import { Container } from 'dockerode';
import * as winston from 'winston';

let container: Container;
const CONTAINER_IMAGE = 'osixia/openldap:1.4.0';
const CONTAINER_WAIT = 5000;

export async function startContainer() {
  winston.info(
    'Increasing Jest timeout, because starting/stopping containers can take time',
  );
  jest.setTimeout(20000);
  winston.info('Connecting to the Docker engine');
  const docker = new Docker();
  winston.info('Pulling image');
  await docker.pull(CONTAINER_IMAGE);
  winston.info('Creating container');
  container = await docker.createContainer({
    Image: CONTAINER_IMAGE,
    Cmd: ['--copy-service'],
    Env: [
      'LDAP_ORGANISATION=Example.Com',
      'LDAP_DOMAIN=example.com',
      'LDAP_TLS=false',
    ],
    AttachStdin: false,
    AttachStderr: false,
    AttachStdout: false,
    Tty: false,
    HostConfig: {
      Binds: [
        `${__dirname}/seed.ldif:/container/service/slapd/assets/config/bootstrap/ldif/custom/seed.ldif`,
      ],
      PublishAllPorts: true,
    },
  });
  winston.info('Starting container');
  await container.start();
  winston.debug(`Waiting ${CONTAINER_WAIT}ms for container to start`);
  await new Promise<void>(resolve => setTimeout(resolve, CONTAINER_WAIT));
  winston.info('Inspecting container');
  return await container.inspect();
}

export async function stopContainer() {
  winston.info('Stopping container');
  await container.stop();
  winston.info('Removing container');
  await container.remove();
}
