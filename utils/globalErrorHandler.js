const AppError = require('./appError');

module.exports = (error, request, response, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';
  // console.log(error.name);
  const { NODE_ENV } = process.env;

  ///////////////////development////////////////////////////
  if (NODE_ENV === 'development' && request.originalUrl.startsWith('/api'))
    return response.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      stack: error.stack
    });

  if (NODE_ENV === 'development')
    return response
      .status(error.statusCode)
      .render('error', { title: 'something went wrong', msg: error.message });

  ///////////////////prodution/////////////////////////////
  if (NODE_ENV === 'production') {
    //1 mark known error as isOperational
    if (error.name === 'CastError') {
      error = new AppError(`invalid ${error.path}:${error.value}`, 400);
    }

    if (error.code === 11000) {
      error = new AppError(
        `Duplicate field value:${Object.values(
          error.keyValue
        )}. Please try a different ${Object.keys(error.keyValue)}`,
        400
      );
    }

    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((obj, i) => `[${i + 1}] ${obj.message}`)
        .join('. ');

      error = new AppError(`invalid input data: ${message}`, 400);
    }

    if (error.name.match(/JsonWebTokenError|TokenExpiredError/)) {
      error = new AppError('Invalid or expired token, please login again', 401);
    }

    //2 send error response

    if (error.isOperational && request.originalUrl.startsWith('/api')) {
      return response.status(error.statusCode).json({
        status: error.status,
        message: error.message
      });
    }

    if (error.isOperational) {
      return response.status(error.statusCode).render('error', {
        title: 'something went wrong',
        msg: error.message
      });
    }

    if (!error.isOperational && request.originalUrl.startsWith('/api')) {
      console.error('ERROR🚫\n', error);
      return response.status(error.statusCode).json({
        status: 'error',
        message: 'something went wrong'
      });
    }

    if (!error.isOperational) {
      console.error('ERROR🚫\n', error);
      return response.status(error.statusCode).render('error', {
        title: 'something went wrong',
        message: 'please try again later'
      });
    }
  }
};
