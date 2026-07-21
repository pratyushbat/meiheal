import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({trustProxyHeaders:true, allowedHosts: ["localhost:4000","localhost","meiheal-309696976357.us-east4.run.app","https://meiheal--meihealth-cfc62.us-east4.hosted.app","*.meiheal.com"]});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    redirect: false,

    fallthrough: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (filePath.match(/\.(js|css|woff2?|ttf|eot|ico|png|jpg|svg)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }),
);

app.use((req, res, next) => {  angularApp.handle(req).then((response) => response ? writeResponseToNodeResponse(response, res) : next(),    )    .catch(next);});
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}
export const reqHandler = createNodeRequestHandler(app);
