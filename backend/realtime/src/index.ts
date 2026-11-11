import http from 'http';
import { WebSocketServer } from 'ws';
import { app } from './app.js';
import { config } from './config.js';

const server = http.createServer(app);

// WebSocket server for Realtime client subscriptions
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  ws.send(
    JSON.stringify({
      type: 'connection_ack',
      message: 'Connected to IdeaRelay Realtime service',
    })
  );

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid payload' }));
    }
  });
});

server.listen(config.PORT, config.HOST, () => {
  console.log(`[IdeaRelay Realtime] Service listening on http://${config.HOST}:${config.PORT}`);
});
