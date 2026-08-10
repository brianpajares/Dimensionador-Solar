import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';

import assessHandler from './api/assess';
import leadsHandler from './api/leads';
import masterDataHandler from './api/master-data';
import proposalHandler from './api/proposal';

const PORT = Number(process.env.PORT || 3000);
const rootDir = process.cwd();
const app = express();

app.use(express.json({ limit: '1mb' }));

app.all('/api/assess', assessHandler);
app.all('/api/proposal', proposalHandler);
app.all('/api/leads', leadsHandler);
app.all('/api/master-data', masterDataHandler);

async function start() {
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(rootDir, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.get('*', async (req, res, next) => {
      try {
        const template = fs.readFileSync(path.resolve(rootDir, 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SolConfigura running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
