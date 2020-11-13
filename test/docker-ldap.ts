import * as Docker from 'dockerode';
import { Container, MountConfig } from 'dockerode';
import * as winston from 'winston';
import { promises as fs } from 'fs';

let container: Container;
const CONTAINER_IMAGE = 'osixia/openldap:1.4.0';
const CONTAINER_WAIT = 5000;

export async function startContainer(): Promise<string> {
  winston.info(
    'Increasing Jest timeout, because starting/stopping containers can take time',
  );
  jest.setTimeout(20000);
  winston.info('Connecting to the Docker engine');
  const docker = new Docker();
  winston.info('Pulling image');
  await docker.pull(CONTAINER_IMAGE);
  const inContainer = process.env['TEST_IN_CONTAINER'] ? true : false;
  let binds = null;
  let mounts: MountConfig = null;
  let parentContainerInfo;
  if (inContainer) {
    winston.info('Connecting ldap container with parent container');
    winston.debug('Reading cgroup information');
    const cgroupHandle = await fs.open('/proc/1/cgroup', 'r');
    const cgroup = await cgroupHandle.readFile({
      encoding: 'ascii',
    });
    await cgroupHandle.close();
    winston.debug(
      `Checking cgroup information for parent container id:\n${cgroup}`,
    );
    const matches = cgroup.match(/^.+:\/docker\/(.*)$/m);
    if (matches) {
      const parentContainerId = matches[1];
      winston.debug(`We're in containier ${parentContainerId}`);
      const parentContainer = await docker.getContainer(parentContainerId);
      winston.debug('Inspecting container');
      parentContainerInfo = await parentContainer.inspect();
      const ldapseedVolume = parentContainerInfo.Mounts.filter(
        mount => mount.Type === 'volume',
      );
      winston.debug(`Mounting volume ${ldapseedVolume[0].Name}`);
      mounts = [
        {
          Target:
            '/container/service/slapd/assets/config/bootstrap/ldif/custom',
          Source: ldapseedVolume[0].Name,
          Type: 'volume',
        },
      ];
    }
  } else {
    winston.debug(`Bindmouning path ${__dirname}`);
    binds = [
      `${__dirname}/seed.ldif:/container/service/slapd/assets/config/bootstrap/ldif/custom/seed.ldif`,
    ];
  }
  winston.info('Creating container');
  container = await docker.createContainer({
    Image: CONTAINER_IMAGE,
    Cmd: ['--copy-service'],
    Env: [
      'LDAP_ORGANISATION=Example.Com',
      'LDAP_DOMAIN=example.com',
      'LDAP_TLS=false',
    ],
    Hostname: 'ldap',
    AttachStdin: false,
    AttachStderr: false,
    AttachStdout: false,
    Tty: false,
    HostConfig: {
      Binds: binds,
      Mounts: mounts,
      PublishAllPorts: true,
    },
  });
  if (inContainer) {
    const networkID = Object.keys(
      parentContainerInfo.NetworkSettings.Networks,
    )[0];
    winston.debug(`The parent container is in network ${networkID}`);
    const parentContainerNetwork = docker.getNetwork(networkID);
    winston.debug('Connecting the ldap container to that network');
    await parentContainerNetwork.connect({
      Container: container.id,
      EndpointConfig: { Aliases: ['ldap'] },
    });
  }

  await container.start();
  winston.debug(`Waiting ${CONTAINER_WAIT}ms for container to start`);
  await new Promise<void>(resolve => setTimeout(resolve, CONTAINER_WAIT));
  if (inContainer) {
    return 'ldap://ldap:389/';
  } else {
    winston.info('Inspecting container');
    const containerInfo = await container.inspect();
    return `ldap://localhost:${containerInfo.NetworkSettings.Ports['389/tcp'][0].HostPort}/`;
  }
}

export async function stopContainer() {
  winston.info('Stopping container');
  await container.stop();
  winston.info('Removing container');
  await container.remove();
}
