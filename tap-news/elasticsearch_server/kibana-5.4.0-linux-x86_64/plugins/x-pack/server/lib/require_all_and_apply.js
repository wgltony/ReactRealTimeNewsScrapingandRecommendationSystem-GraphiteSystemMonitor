import Promise from 'bluebird';
import glob from 'glob';

export default function (path, server) {
  return new Promise(function (resolve, reject) {
    glob(path, { ignore: '**/__test__/**' }, function (err, files) {
      if (err) return reject(err);
      const modules = files.map(require);
      modules.forEach(function (fn) {
        fn(server);
      });
      resolve(modules);
    });
  });
};
