export default function watcherApi(Client, _config, components) {
  const ca = components.clientAction.factory;
  Client.prototype.watcher = components.clientAction.namespaceFactory();
  const watcher = Client.prototype.watcher.prototype;

  /**
   * Perform a [watcher.delete_watch](https://www.elastic.co/guide/en/x-pack/current/watcher-api-delete-watch.html) request
   *
   * @param {String} params.watch_id - The Watch's unique ID -- expected to be a combination of the Cluster UUID and a Watch ID
   */
  watcher.delete_watch = ca({
    urls: [{
      fmt: '/_xpack/watcher/watch/<%=watch_id%>',
      req: {
        watch_id: {
          type: 'string'
        }
      }
    }],
    method: 'DELETE',
    params: {
      filterPath: {
        type: 'list',
        name: 'filter_path'
      }
    }
  });

  /**
   * Perform a [watcher.get_watch](https://www.elastic.co/guide/en/x-pack/current/watcher-api-get-watch.html) request
   *
   * @param {String} params.watch_id - The Watch's unique ID -- expected to be a combination of the Cluster UUID and a Watch ID
   */
  watcher.get_watch = ca({
    urls: [{
      fmt: '/_xpack/watcher/watch/<%=watch_id%>',
      req: {
        watch_id: {
          type: 'string'
        }
      }
    }],
    method: 'GET',
    params: {
      filterPath: {
        type: 'list',
        name: 'filter_path'
      }
    }
  });

  /**
   * Perform a [watcher.put_watch](https://www.elastic.co/guide/en/x-pack/current/watcher-api-put-watch.html) request
   *
   * @param {String} params.watch_id - The Watch's unique ID -- expected to be a combination of the Cluster UUID and a Watch ID
   */
  watcher.put_watch = ca({
    urls: [{
      fmt: '/_xpack/watcher/watch/<%=watch_id%>',
      req: {
        watch_id: {
          type: 'string'
        }
      }
    }],
    needBody: true,
    method: 'PUT',
    params: {
      filterPath: {
        type: 'list',
        name: 'filter_path'
      }
    }
  });

};
