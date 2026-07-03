import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, '0.0.0.0', () => {
  console.log(`Tertip API listening on port ${env.port} [${env.nodeEnv}]`);
});
