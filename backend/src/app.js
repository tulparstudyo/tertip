import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { i18nMiddleware } from './shared/middleware/i18n.middleware.js';
import { errorHandler } from './shared/middleware/error-handler.middleware.js';
import apiRoutes from './routes/index.js';
import { sendError } from './shared/utils/api-response.util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(i18nMiddleware);

app.use('/api/v1', apiRoutes);

if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(publicDir, 'index.html'), (err) => err && next());
  });
}

app.use((req, res) => {
  sendError(res, { status: 404, message: req.t('errors.notFound') });
});

app.use(errorHandler);

export default app;
