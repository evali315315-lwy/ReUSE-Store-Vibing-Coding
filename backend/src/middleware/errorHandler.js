/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent error responses
 */

export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  // Default error
  let statusCode = 500;
  let message = 'Internal server error';
  let details = null;

  // SQLite errors
  if (err.message && err.message.includes('SQLITE')) {
    statusCode = 400;

    if (err.message.includes('UNIQUE constraint failed')) {
      message = 'Duplicate entry: Record already exists';
    } else if (err.message.includes('FOREIGN KEY constraint failed')) {
      message = 'Invalid reference: Related record does not exist';
    } else if (err.message.includes('CHECK constraint failed')) {
      message = 'Invalid data: Constraint validation failed';
    } else {
      message = 'Database error';
    }

    details = err.message;
  }

  // Validation errors (from Zod or custom validation)
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation error';
    details = err.errors;
  }

  // Custom application errors
  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * 404 Not Found Handler
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
}
