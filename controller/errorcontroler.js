const AppError = require('../utlis/appError');

const handleCastErrorDb = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};
const handleValidationErrorDb = (err) => {
  const message = `Please input Valid data. ${err.message}`;
  return new AppError(message, 401);
};
const handleJwtTokenError = (err) => {
  const message = `Please login with Valid Token. You have ${err.message}`;
  return new AppError(message, 401);
};
const handleJwtTokenExpiredError = (err) => {
  const message = `Your Token expired and Login Again. ${err.message}`;
  return new AppError(message, 401);
};
const handleDuplicateErrorDb = (err) => {
  const key = { ...Object.keys(err.keyValue) };
  const value = { ...Object.values(err.keyValue) };

  const message = `Duplicate field with field '${key[0]}' : '${value[0]}'. Use another ${key[0]} }`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Some Thing Went wrong',
    status: 'error',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      msg: 'Some Thing went Very Wrong',
    });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Some Thing Went wrong',
      msg: err.message,
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Some Thing Went wrong',
    msg: 'Please Try Again Later',
  });
};

const globleErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err);

    if (error.name === 'CastError') error = handleCastErrorDb(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDb(error);
    if (error.name === 'JsonWebTokenError') error = handleJwtTokenError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJwtTokenExpiredError(error);
    if (error.code === 11000) error = handleDuplicateErrorDb(error);

    sendErrorProd(error, req, res);
  }

  next();
};
module.exports = globleErrorHandler;
