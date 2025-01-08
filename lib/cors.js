
// CORS middleware
function cors(options = {}) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    credentials = false,
    exposedHeaders = [],
  } = options;

  return (req, res, next) => {
    // Handle preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', methods.join(','));
      res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(','));
      if (credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      return res.status(204).end();
    }

    // Set allowed origin
    if (typeof origin === 'function') {
      const requestOrigin = req.headers.origin;
      const allowedOrigin = origin(requestOrigin);
      if (allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      }
    } else if (Array.isArray(origin)) {
      const requestOrigin = req.headers.origin;
      if (origin.includes(requestOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Set exposed headers
    if (exposedHeaders.length > 0) {
      res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(','));
    }

    // Set credentials if enabled
    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    next();
  };
}

module.exports = { cors}