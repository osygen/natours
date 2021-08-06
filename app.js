const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { AppError, globalErrorHandler } = require('./utils');
const {
  tourRouter,
  userRouter,
  reviewRouter,
  friendRouter,
  viewRouter
} = require('./routes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(cookieParser());

app.use((request, response, next) => {
  // if (process.env.NODE_ENV === 'development' && request.cookies.jwt)
  //   console.log(request.cookies);
  request.requestTime = new Date().toISOString();

  next();
});

//NOTE: Mounted routers:
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/friends', friendRouter);

app.all('*', (request, response, next) => {
  return next(new AppError(`url: ${request.originalUrl} is not defined`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
