# Decentralized Signalling Server

# Specification 

This section is notes/specification for a decentralized signalling server 'cloud', to allow webrtc clients to connect to each other.

The goal is to make it

- robust / secure
- simple to implement, and deploy
- signalling servers should be able to join, and be pruned from the cloud automatically.

A signalling server has two parts / APIs:

1. Signalling between clients
2. Directory of live signalling servers

A signalling server runs on a public HTTPS endpoint.  All responses sets CORS headers, so they can be accessed from any host.


## API for signalling/messaging

Signalling are done by passing messages between clients. The clients are pulling from the server. Old messages might get pruned regularly (typically once per minute, but could be as often as 10 seconds).

### `?send=$(ID)&msg=$(MESSAGE)`

Post a message. The `ID` is the url-safe base64 encoded SHA-256 hash of the `KEY`. Returns an empty 200 OK, on success.

### `?recv=$(KEY)&since=$(TIMESTAMP)`

Receive a message posted after a given time, possibly block until a message arrives, if no messages are there. If no messages are received before a timeout, it returns the current timestamp on the signalling server.

Returns `$(MESSAGE_TIMESTAMP)\n$(MESSAGE)`, i.e.:

```
2017-08-26T08:19:51.420Z
[actual content of message here...]
```

## API for Peer Directory 

### `?status`

Get the time, and the urls of of it peers, - separated by newlines, i.e.:

```
2017-08-26T08:15:51.024Z
signal.solsort.com/
example.com/foo/signal.php
```

### `?peer=$(URL)`

Suggest a peer to the service. Verify the `?status` endpoint, and then add the peer to the peer list (at most one peer per second-level domain). Replies with an empty 200 OK response.

### Directory update

Approximately once per minut it updates the list:

- access the `?status` endpoint of a random peer
   - if failed (invalid answer/static), remove the peer
   - if success, suggest itself with the `?peer` endpoint to a random peer of the peer.

The list of peers are limited to 100 nodes, keeping long-lived, as well as recently verified peers.

This slowly prunes dead servers, and strengthens the connections of the graph through a slow random walk.

# How the signalling works

The challenge is that two web clients cannot connect directly to each other. They need to initiate their communication through a third party, - for example a publicly available https endpoints.

Let **A** be the client the receives the incoming connection request, and **B** be the one requesting the connection.

1. **A** listens for incoming connections by `?recv=signal&since=$(NOW)`.
2. **B** decides on a random *keyTemp*, listen for one message on `?recv=$(keyTemp)`, and sends `?send=$(sha256("signal"))&msg=$(sha256(keyTemp))`, i.e. `?send=0EGSTBWIWvbQZTCkJcbb_8gFIBUMTdJk9AtDZLEkIag&msg=uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvzek`
3. **A** receives the *sha_keyTemp* from **B**. decides on a random *keyAB*, and listens on `?recv=$(keyAB)`, and sends `?send=$(sha256_keyTemp)&msg=$(sha256(keyAB))`, i.e. `?send=uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvzek&msg=i33xQ9kccW7PpfwXMAIva0IbBc7e6P1SsfxlqWAwrVI`
4. **B** receives *sha_keyAB* from **A**, decides on a random *keyBA*, listens for messages on `?recv=$(keyBA)`, and sends `?send=$(sha_keyAB)&msg=$(sha256(keyBA))`, i.e. `?send=i33xQ9kccW7PpfwXMAIva0IbBc7e6P1SsfxlqWAwrVI&msg=j0NDRmSPa5bfid2pAcUXaxCm2Dlh3TwayItZstwyeqQ`
5. **A** and **B** can now exchange webrtc signalling informations with each other.

It the responsibility of the p2p network of clients designate a single peer to listen for incoming connections on each signalling server.
