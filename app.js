////// require modules
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParse = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utlis/appError');
const globleErrorHandler = require('./controller/errorcontroler');

const tourRouter = require('./route/tourRouter');
const userRouter = require('./route/userRouter');
const reviewRouter = require('./route/reviewRouter');
const bookingRouter = require('./route/bookingRouter');
const viewsRouter = require('./route/viewsRouter');

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

//middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'connect-src': [
          "'self'",
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://cdnjs.cloudflare.com/ajax/libs/axios/1.4.0/axios.js',
          'ws://localhost:*/',
          'https://js.stripe.com/v3/',
        ],

        'script-src': [
          "'self'",
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://cdnjs.cloudflare.com/ajax/libs/axios/1.4.0/axios.js',
          'https://js.stripe.com/v3/',
        ],

        'worker-src': ["'self'", 'blob: '],
        'child-src': ["'self'", 'blob: '],
        'img-src': ["'self'", 'data: ', 'blob: '],
        'frame-src': [
          'self',
          'unsafe-inline',
          'data:',
          'blob:',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://cdnjs.cloudflare.com/ajax/libs/axios/1.4.0/axios.js',
          'ws://localhost:*/',
          'https://js.stripe.com/v3/',
        ],
      },
    },
  })
);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParse());

app.use(mongoSanitize());
app.use(xss());

app.use(
  hpp({
    whitelist: [
      'duration',
      'maxGroupSize',
      'ratingsAverage',
      'price',
      'startDates',
    ],
  })
);
// Apply the rate limiting middleware to all requests
app.use('/api', limiter);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(compression());

app.use((req, res, next) => {
  req.reqTime = new Date().toISOString();

  next();
});

app.use('/', viewsRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

///undefined router handling
app.all('*', (req, res, next) => {
  next(new AppError(`Don't find your request for ${req.originalUrl}`, 404));
});

app.use(globleErrorHandler);

module.exports = app;
