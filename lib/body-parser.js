/**
 * JSON Body Parser Middleware
 * @param {object} options - Configuration options
 * @param {number|string} options.limit - Maximum body size (e.g., '1mb' or 1000000 bytes)
 * @param {boolean} options.strict - Enforce strict JSON syntax (must start with { or [)
 * @param {string} options.type - Expected Content-Type (default: 'application/json')
 * @returns {function} Middleware function
 */
function jsonBodyParser(options = {}) {
  const limit = parseLimit(options.limit || "100kb");
  const strict = options.strict !== false;
  const type = options.type || "application/json";

  return function (req, res, next) {
    // Skip requests without bodies or incorrect Content-Type
    if (!hasBody(req) || !isContentType(req, type)) {
      next();
      return;
    }

    // Check charset (must be UTF-8)
    const charset = getCharset(req);
    if (charset && !/^utf-?8$/i.test(charset)) {
      res.statusCode = 415; // Unsupported Media Type
      res.end(`Unsupported charset: ${charset}`);
      return;
    }

    const body = req.rawData; // Use req.rawData instead of reading from the stream

    if (Buffer.byteLength(body) > limit) {
      res.statusCode = 413; // Payload Too Large
      res.end("Request body too large");
      return;
    }

    try {
      // Enforce strict JSON syntax if enabled
      if (strict && !isStrictJson(body)) {
        throw new SyntaxError("JSON must start with { or [");
      }

      // Parse the JSON body
      req.body = JSON.parse(body);
      next();
    } catch (error) {
      res.statusCode = 400; // Bad Request
      res.end(`Invalid JSON: ${error.message}`);
    }
  };
}

/**
 * Check if the request has a body
 * @param {object} req - HTTP request object
 * @returns {boolean}
 */
function hasBody(req) {
  return req.method === "POST" || req.method === "PUT" || req.method === "PATCH";
}

/**
 * Check if the request Content-Type matches the expected type
 * @param {object} req - HTTP request object
 * @param {string} type - Expected Content-Type
 * @returns {boolean}
 */
function isContentType(req, type) {
  const contentType = req.headers["content-type"];
  return contentType && contentType.includes(type);
}

/**
 * Get the charset from the Content-Type header
 * @param {object} req - HTTP request object
 * @returns {string|undefined}
 */
function getCharset(req) {
  const contentType = req.headers["content-type"];
  if (!contentType) return undefined;

  const match = contentType.match(/charset=([^;]+)/i);
  return match ? match[1].toLowerCase() : undefined;
}

/**
 * Check if the JSON body starts with { or [ (strict mode)
 * @param {string} body - Request body
 * @returns {boolean}
 */
function isStrictJson(body) {
  const firstChar = body.trim()[0];
  return firstChar === "{" || firstChar === "[";
}

/**
 * Parse the body size limit into bytes
 * @param {number|string} limit - Limit as a number (bytes) or string (e.g., '1mb')
 * @returns {number}
 */
function parseLimit(limit) {
  if (typeof limit === "number") return limit;
  if (typeof limit === "string") {
    const units = {
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };
    const match = limit.match(/^(\d+)(kb|mb|gb)$/i);
    if (match) {
      const [, value, unit] = match;
      return parseInt(value, 10) * units[unit.toLowerCase()];
    }
  }
  throw new Error("Invalid limit format");
}

module.exports = jsonBodyParser;
