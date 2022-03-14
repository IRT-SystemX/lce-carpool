const { createLogger, format, transports } = require('winston');

const { combine,  colorize, timestamp } = format;

const logger = createLogger({
  format: format.combine(
    timestamp(),
    format.splat(),
    format.simple()
  ),
  transports: [
    new transports.File({ filename: './logs/error.log', level: 'error', format: combine(colorize()), handleExceptions: true, }),
    new transports.File({ filename: './logs/combined.log', format: combine(colorize()), handleExceptions: false, }),
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(timestamp(), format.splat(), format.simple()),
      handleExceptions: true,
      silent: (process.env.NODE_ENV === 'test'),
    })
  );
}

logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
