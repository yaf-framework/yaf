const http = require("node:http");

const PORT = 8000;

const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
  HEAD: "HEAD",
  OPTIONS: "OPTIONS",
  CONNECT: "CONNECT",
  TRACE: "TRACE",
};

class RouteNode {
  constructor() {
    this.children = {}; // Stores child nodes
    this.handlers = {}; // Handlers for this node
    this.paramName = null; // Name of the dynamic parameter
  }
}

class TrieRouter {
  constructor() {
    this.root = new RouteNode();
    // Dynamically add HTTP method-specific functions
    Object.keys(HTTP_METHODS).forEach(methodKey => {
      const httpMethod = HTTP_METHODS[methodKey];
      TrieRouter.prototype[httpMethod.toLowerCase()] = function(path, handler) {
        this.#addRoute(path, httpMethod, handler);
      };
    });
  }

  // Private method to verify inputs for addRoute
  #verifyInputs(path, handler, method) {
    if (typeof path !== 'string' || path[0] !== '/') {
      throw new Error('Malformed path provided.');
    }
    if (typeof handler !== 'function') {
      throw new Error('Handler should be a function.');
    }
    if (!Object.values(HTTP_METHODS).includes(method)) {
      throw new Error('Invalid HTTP method provided.');
    }
  }

  // Private method to verify path and method for findRoute
  #verifyPathAndMethod(path, method) {
    if (typeof path !== 'string' || path[0] !== '/') {
      throw new Error('Malformed path provided.');
    }
    if (!Object.values(HTTP_METHODS).includes(method)) {
      throw new Error('Invalid HTTP method provided.');
    }
  }

  // Private method to add a route to the Trie
  #addRoute(path, method, handler) {
    this.#verifyInputs(path, handler, method);

    const segments = path.split('/').filter(segment => segment !== '');
    let currentNode = this.root;

    for (const segment of segments) {
      let nodeKey = segment;
      let newNode;

      if (segment.startsWith(':')) {
        // Dynamic parameter
        nodeKey = '*';
        newNode = new RouteNode();
        newNode.paramName = segment.slice(1); // Remove the colon
      } else {
        newNode = new RouteNode();
      }

      if (!currentNode.children.hasOwnProperty(nodeKey)) {
        currentNode.children[nodeKey] = newNode;
      }
      currentNode = currentNode.children[nodeKey];
    }

    // Assign handler for the specific HTTP method
    currentNode.handlers[method] = handler;
  }

  // Find the route handler and parameters for a given path and method
  findRoute(path, method) {
    this.#verifyPathAndMethod(path, method);

    const segments = path.split('/').filter(Boolean);
    let currentNode = this.root;
    const params = {};

    for (const segment of segments) {
      // Try exact match first
      if (currentNode.children.hasOwnProperty(segment)) {
        currentNode = currentNode.children[segment];
        continue;
      }

      // Try dynamic match
      if (currentNode.children.hasOwnProperty('*')) {
        const dynamicNode = currentNode.children['*'];
        params[dynamicNode.paramName] = segment;
        currentNode = dynamicNode;
        continue;
      }

      // No matching route
      return null;
    }

    // Retrieve the handler for the specified method
    const handler = currentNode.handlers[method];
    return { params, handler };
  }

  // Print the route tree for debugging
  printTree(node = this.root, indentation = 0, dynamicParams = []) {
    const indent = '  '.repeat(indentation);

    for (const key in node.children) {
      const childNode = node.children[key];
      const isDynamic = key === '*';
      const paramName = isDynamic ? childNode.paramName : null;

      // Collect dynamic parameters
      const currentDynamicParams = isDynamic
        ? [...dynamicParams, paramName]
        : dynamicParams;

      // Display dynamic parameters or 'No'
      const dynamicStr = isDynamic
        ? currentDynamicParams.join(',')
        : 'No';

      console.log(`${indent}(${key}) Dynamic: ${dynamicStr}`);

      // Print handlers if they exist
      if (Object.keys(childNode.handlers).length > 0) {
        const methods = Object.keys(childNode.handlers).join(', ');
        console.log(`${indent}  Handlers: ${methods}`);
      }

      // Recursively print child nodes
      this.printTree(childNode, indentation + 1, currentDynamicParams);
    }
  }
}


// Note: We're using an arrow function instead of a regular function now
let server = http.createServer((req, res) => router.handleRequest(req, res));
server.listen(PORT);
