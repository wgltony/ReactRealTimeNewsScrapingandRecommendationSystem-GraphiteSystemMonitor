import { get } from 'lodash';
import { oncePerServer } from './once_per_server';

function getUserFactoryFn(server) {
  return (request) => {
    const getUser = get(server.plugins, 'security.getUser', function () {});
    return Promise.resolve(getUser(request));
  };
}

export const getUserFactory = oncePerServer(getUserFactoryFn);
