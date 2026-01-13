/**
 * Validation Middleware
 * General validation utilities for request handling
 */

/**
 * Validate pagination parameters
 */
export function validatePagination(req, res, next) {
  const limit = parseInt(req.query.limit);
  const offset = parseInt(req.query.offset);

  if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 100)) {
    return res.status(400).json({
      error: 'Invalid limit parameter. Must be between 1 and 100.'
    });
  }

  if (req.query.offset && (isNaN(offset) || offset < 0)) {
    return res.status(400).json({
      error: 'Invalid offset parameter. Must be >= 0.'
    });
  }

  next();
}

/**
 * Validate required query parameter
 */
export function requireQueryParam(paramName) {
  return (req, res, next) => {
    if (!req.query[paramName]) {
      return res.status(400).json({
        error: `Missing required query parameter: ${paramName}`
      });
    }
    next();
  };
}

/**
 * Sanitize string input (trim whitespace)
 */
export function sanitizeStrings(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
}
