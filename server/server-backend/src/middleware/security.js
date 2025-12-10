const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const securityHeaders = helmet();
const requestLogger = morgan('combined');

const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

const sanitizeInput = (req, res, next) => {
  next();
};

const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(500).json({ error: 'Internal Server Error', message: isDevelopment ? err.message : 'Something went wrong' });
};

module.exports = { securityHeaders, requestLogger, generalLimiter, authLimiter, sanitizeInput, errorHandler };

