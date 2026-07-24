
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import configDb from '../backend/config/connection';
import compression from 'compression';
import cookiesParser from "cookie-parser";
import { randomUUID } from 'node:crypto';
import helmet from 'helmet';
import paymentRoutes from "../backend/routes/paymentRoute";
import productRoutes from "../backend/routes/productRoute";
import dietPlanRoutes from "../backend/routes/dietPlanRoute";
import orderNRoutes from "../backend/routes/orderRouteN";
import leadRoutes from "../backend/routes/leadRoute";
import userRoutes from "../backend/routes/userRoute";
import blogCommRoutes from "../backend/routes/blogCommentRoute";
import addressRoutes from "../backend/routes/addressRoute";
import subscriptionPlanRoutes from "../backend/routes/subscriptionPlanRoute";
import subscriptionRoutes from "../backend/routes/subscriptionRoute";
import { cartRouter, buyNowRouter } from "../backend/routes/cartandbuynowRoute";
import { GoogleController } from '../backend/controllers/googleController';
const cors = require('cors');
const browserDistFolder = join(import.meta.dirname, '../browser');
const app = express();

// try {
//   await configDb();
// } catch (err) {
//   console.error("Fatal: could not connect to database, exiting:", err);
//   process.exit(1);
// }
app.use(compression());
app.set('trust proxy', true);
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use("/api/order/webhook", express.raw({ type: "application/json" }));
app.use((req, res, next) => {
  delete req.headers['x-forwarded-for'];
  delete req.headers['x-forwarded-proto'];
  delete req.headers['x-forwarded-host'];
  delete req.headers['x-forwarded-port'];
  next();
});

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

app.use(cors({
  origin: [
    'https://meiheal.com',
    'http://localhost:4000',
    'https://www.meiheal.com']
  ,
  credentials: true
}));
app.use(cookiesParser());

app.use((req, res, next) => {
  if (!req.cookies?.cartSession) {
    const id = randomUUID();
    res.cookie('cartSession', id, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    req.cookies.cartSession = id; // so this same render pass sees it too
  }
  next();
});


app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://*.razorpay.com",
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com",
          "https://googleads.g.doubleclick.net",
          "https://www.googleadservices.com",
        ],
        imgSrc: ["'self'", "https:", "data:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        scriptSrcAttr: ["'self'", "'unsafe-inline'"],
        frameSrc: [
          "'self'",
          "https://checkout.razorpay.com",
          "https://*.razorpay.com",
          "https://www.googletagmanager.com",
        ],
        connectSrc: [
          "'self'",
          "https://*.razorpay.com",
          "https://www.google.com",
          "https://www.google-analytics.com",
          "https://stats.g.doubleclick.net",
          "https://googleads.g.doubleclick.net",
          "https://pagead2.googlesyndication.com",
          "https://www.google.co.in",
          "https://meiheal.com",
          "https://ad.doubleclick.net",
        ]
      },
    },
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/payment", paymentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dietplan", dietPlanRoutes);
app.use("/api/order", orderNRoutes);
app.use("/api/lead", leadRoutes);
app.use('/api/user', userRoutes);
app.use('/api/blogs', blogCommRoutes);
app.use('/api/cart', cartRouter);
app.use('/api/checkout', buyNowRouter);
app.use('/api/users/me/addresses', addressRoutes);
app.use('/api/subplans', subscriptionPlanRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.route('/google').get(GoogleController.getGoogleLoginPage);
app.route('/google/callback').get(GoogleController.getGoogleCallback);
app.route('/logout').get(GoogleController.logoutUser);


app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {

    const response: any = await angularApp.handle(req, { server: 'express' });
    // console.log('response.status req:----', response?.status)
    if (!response) {
      return res.sendFile(join(browserDistFolder, 'index.html'));
    }
    const htmlPayload = await response.text();

    // ✅ Copy Angular headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    console.log(htmlPayload.slice(0, 20));

    // const appRoot = htmlPayload.match(/<app-root[\s\S]*?<\/app-root>/);


    // console.log(`[SSR DEBUG] Has custom-ssr-status:`, htmlPayload.includes('custom-ssr-status'));
    // console.log(`[SSR DEBUG] response.status`, response.status);

    // ✅ Prevent Firebase CDN from caching ANY server-rendered page
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    const is404Page = response.status === 404 || htmlPayload.includes('custom-ssr-status');

    if (is404Page) {
      console.log(`[SSR] Forcing Dynamic 404 for URL: ${req.url}`);
      // res?.status(404);
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Surrogate-Control': 'no-store',
        'X-App-Hosting-Status': 'Dynamic-404-Active',
        'Content-Type': 'text/html;charset=UTF-8'
      });
      return res.status(404).send(htmlPayload).on('error', (err) => console.error('Send error:', err));
    }

    // differentiate cache by route type — see below
    const isPersonalized = req.path.startsWith('/dashboard') || req.path.startsWith('/checkout') || req.path.startsWith('/order-detail');
    res.setHeader(
      'Cache-Control',
      isPersonalized
        ? 'no-store, no-cache, must-revalidate'
        : 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400'
    );

    return res.status(response.status).send(htmlPayload).on('error', (err) => console.error('Send error htmlPayload :', err));
  } catch (err) {
    console.error('Angular SSR Engine Error:', err);
    return next(err);
  }

});
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
 configDb()
    .catch((err) => {
      console.error("Fatal: could not connect to database, exiting:", err instanceof Error ? err.message : err);
      process.exit(1);
    })
    .then(() => {
      app.listen(port, (error) => {
        if (error) {
          throw error;
        }
        console.log(`Node Express server listening on http://localhost:${port}`);
      });
    });
}

export const reqHandler = createNodeRequestHandler(app);
