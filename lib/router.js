const { HTTP_METHODS } = require("./constants");

class RouteNode {
    constructor() {
      /** @type {Map<String, RouteNode>} */
      this.children = new Map();
  
      /** @type {Map<String, Function>} */
      this.handlers = new Map();
  
      /** @type {Array<String>} */
      this.params = [];
    }
  }
  
  class Router {
    constructor() {
        /** @type {RouteNode} */
      this.root = new RouteNode();
      // Dynamically add HTTP method-specific functions
         /**
     * @param {String} path
     * @param {Function} handler
     */
      Object.keys(HTTP_METHODS).forEach(methodKey => {
        const httpMethod = HTTP_METHODS[methodKey];
        Router.prototype[httpMethod.toLowerCase()] = function(path, handler) {
          this.#addRoute(path, httpMethod, handler);
        };
      });
    }
  
    
    // Private method to verify inputs for addRoute
    /**
     * @param {String} path
     * @param {HttpMethod} method
     * @param {Function} handler
     */
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
    /**
     * @param {String} path
     * @param {HttpMethod} method
     */
    #verifyPathAndMethod(path, method) {
      if (typeof path !== 'string' || path[0] !== '/') {
        throw new Error('Malformed path provided.');
      }
      if (!Object.values(HTTP_METHODS).includes(method)) {
        throw new Error('Invalid HTTP method provided.');
      }
    }
  
    
    // Private method to add a route to the Trie
     /**
     * @param {String} path
     * @param {HttpMethod} method
     * @param {Function} handler
     */
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
    /**
     * @param {String} path
     * @param {HttpMethod} method
     * @returns { { params: Object, handler: Function } | null }
     */
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

  module.exports = Router;