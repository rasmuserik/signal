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
}

// Server state
let messages = {};
let peers = [{url: 'example.com/foo'}, {url: 'signal.solsort.com'}];
let listeners = {};

// handle requests
function handle_request(req, res) {
  // extract query parameters
  let q = req.url.replace(/^[^?]*./, '')
    .split('&').map(s => s.split('='))
    .reduce((o, [k, v]) => (o[k] = v, o), {})


  if(q.hasOwnProperty('status')) {
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*'});
    return res.end([(new Date).toISOString()]
      .concat(peers.map(o => o.url))
      .join('\n'))
  } 

  if(q.send) {
    const msg = {timestamp: (new Date()).toISOString(), msg: q.msg};
    messages[q.send] = msg;
    if(listeners[q.send]) {
      for(const listener of listeners[q.send]) {
        listener.writeHead(200, { 'Access-Control-Allow-Origin': '*'});
        listener.end(msg.timestamp + '\n' + msg.msg);
      }
      delete listeners[q.send];
    }
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*'});
    return res.end()
  } 

  if(q.recv) {
    // sha256 into url-safe base64 
    const sha = require('crypto').createHash('sha256').update(q.recv)
      .digest('base64').replace(/[+]/g, '-').replace(/[/]/g, '_').replace(/=*$/, ''); 

    console.log('sha', sha);
    if(messages[sha] && messages[sha].timestamp > q.since) {
      res.writeHead(200, { 'Access-Control-Allow-Origin': '*'});
      return res.end()
    } else {
      if(!listeners[sha]) {
        listeners[sha] = [];
      }
      return listeners[sha].push(res);
    }
  } 

  if(q.peer) {
  } 

  res.writeHead(400, { 'Content-Type': 'text/plain' });
  res.end('bad request');
}

