const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'mental-health-aftercare-api' },
  transports: [
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs with level 'info' and below to 'combined.log'
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log') 
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log') 
    })
  ]
});

// If we're not in production then log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// HIPAA compliant logging helper
const sanitizeLogData = (data) => {
  const sensitiveFields = [
    'password', 'token', 'ssn', 'dateOfBirth', 'phone', 
    'email', 'address', 'emergencyContact'
  ];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Enhanced logging methods
logger.logUserAction = (action, userId, details = {}) => {
  logger.info('User action', {
    action,
    userId,
    details: sanitizeLogData(details),
    timestamp: new Date().toISOString()
  });
};

logger.logSecurityEvent = (event, userId, details = {}) => {
  logger.warn('Security event', {
    event,
    userId,
    details: sanitizeLogData(details),
    timestamp: new Date().toISOString()
  });
};

logger.logDataAccess = (resource, userId, operation, recordId = null) => {
  logger.info('Data access', {
    resource,
    userId,
    operation,
    recordId,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;