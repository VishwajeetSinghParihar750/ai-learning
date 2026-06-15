const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRouter = require('./routes/authRoutes');
const taskRouter = require('./routes/taskRoutes');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/appError');
const { sequelize } = require('./config/db');

const app = express();

// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Implement CORS
app.use(cors());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// 2) HEALTHCHECK ROUTE
app.get('/health', async (req, res) => {
  let dbStatus = 'UP';
  try {
    await sequelize.authenticate();
  } catch (err) {
    dbStatus = 'DOWN';
  }

  res.status(200).json({
    status: 'success',
    timestamp: new Date(),
    uptime: process.uptime(),
    services: {
      database: dbStatus,
    },
  });
});

// 3) ROUTES
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/tasks', taskRouter);

// 4) UNHANDLED ROUTES
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 5) GLOBAL ERROR HANDLING MIDDLEWARE
app.use(errorHandler);

module.exports = app;
