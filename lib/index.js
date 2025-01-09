const { createServer } = require("node:http");
const Yaf = require("./router");

/**
 * Run the server on the specified port
 * @param {Yaf} router - The router to use for routing requests
 * @param {number} port - The port to listen on
 * @param {Function} [callback] - Optional callback to run after server starts
 */
function run(router, port, callback) {
  // Validate inputs
  if (!(router instanceof Yaf)) {
    throw new Error("`router` argument must be an instance of Router");
  }
  if (typeof port !== "number" || port <= 0) {
    throw new Error("`port` argument must be a positive number");
  }

  const server = createServer(async (req, res) => {
    try {
      // Parse URL query parameters and body
      const url = new URL(req.url, `http://${req.headers.host}`);
      req.url = url.pathname + url.search;

      // Handle the request using Router's built-in handling
      await router.handleRequest(req, res);
    } catch (error) {
      // If no error handler is defined, send a generic 500 response
      if (!router.errorHandler) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      } else {
        // Let the router's error handler handle it
        router.errorHandler(error, req, res);
      }
    }
  });

  server.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
    if (typeof callback === "function") {
      callback();
    }
  });

  // Handle server errors
  server.on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
  });

  return server;
}

module.exports = { Yaf, run };
