// Server setup
if(!process.env.SIGNAL_URL) {
  throw 'Needs SIGNAL_URL environment variable to be set.';
}

const url = process.env.SIGNAL_URL.replace(/^https?:\/\//, '');
const port = url.replace(/[^:/]*:?([0-9]*).*/, (_, port) => port) || 80;

require('http')
  .createServer(handle_request)
  .listen(port, (err) => {
    if(err) throw err;
    console.log('Started signalling server on port ' + port);
  });

// Utility
function sha256(str) {
  return require('crypto').createHash('sha256').update('signal')
    .digest('base64').replace(/[+]/g, '-').replace(/[/]/g, '_'); 
}

// Server state
const messages = {};
const peers = [{url: 'example.com/foo'}, {url: 'signal.solsort.com'}];
const listeners = {};

// handle requests
function handle_request(req, res) {
  // extract query parameters
  let q = req.url.replace(/^[^?]*./, '')
    .split('&').map(s => s.split('='))
    .reduce((o, [k, v]) => (o[k] = v, o))

  console.log('q', q);
  if(q.hasOwnProperty('status')) {
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*'});
    res.send((new Date).toISOString() + '\n');
    res.end([(new Date()).
  } else if(q.send) {
  } else if(q.recv) {
  } else if(q.peer) {
  } else {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('bad request');
  }
}
