import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { i18nMiddleware } from './shared/middleware/i18n.middleware.js';
import { errorHandler } from './shared/middleware/error-handler.middleware.js';
import apiRoutes from './routes/index.js';
import { sendError } from './shared/utils/api-response.util.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(i18nMiddleware);

app.use('/api/v1', apiRoutes);

app.use((req, res) => {
  sendError(res, { status: 404, message: req.t('errors.notFound') });
});

app.use(errorHandler);

export default app;
