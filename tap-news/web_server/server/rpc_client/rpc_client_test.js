var client = require('./rpc_client');

//invoke 'add'
client.getSearchNewsSummariesForUser(1, 2, 3, function(response){
  console.log(response);
});
