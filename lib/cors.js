// cors.js
function cors(options = {}) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    credentials = false,
    exposedHeaders = [],
  } = options;

  return (req, res, next) => {
    const requestOrigin = req.headers.origin;

    // Helper function to check if the origin is allowed
    const isOriginAllowed = (origin, requestOrigin) => {
      if (typeof origin === 'function') {
        return !!origin(requestOrigin);
      } else if (Array.isArray(origin)) {
        return origin.includes(requestOrigin);
      } else {
        return origin === '*' || origin === requestOrigin;
      }
    };

    // Handle preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
      if (!isOriginAllowed(origin, requestOrigin)) {
        return res.status(403).json({ error: 'Origin not allowed' }); // Custom error message
      }
      res.setHeader('Access-Control-Allow-Methods', methods.join(','));
      res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(','));
      
      if (credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      return res.status(204).end();
    }

    // Check if the origin is allowed
    let isAllowed = isOriginAllowed(origin, requestOrigin);
    let allowedOrigin = null;

    if (typeof origin === 'function') {
      allowedOrigin = origin(requestOrigin);
    } else if (Array.isArray(origin)) {
      allowedOrigin = requestOrigin;
    } else {
      allowedOrigin = origin === '*' ? '*' : requestOrigin;
    }

    if (!isAllowed) {
      return res.status(403).json({ error: 'Origin not allowed' }); // Custom error message
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);

    if (exposedHeaders.length > 0) {
      res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(','));
    }

    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    next();
  };
}

module.exports = cors;


