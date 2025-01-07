const { HTTP_METHODS } = require("./constants");

class RouteNode {
    constructor() {
      /** @type {Map<String, RouteNode>} */
      this.children = new Map();
  
      /** @type {Map<String, Function>} */
      this.handlers = new Map();
  
      /** @type {Array<String>} */
      this.params = [];

      this.queryParams = {};
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
      let currentNode = this.root;
      let routeParts = path.split("/").filter(Boolean);
      let dynamicParams = [];

    for (const segment of routeParts) {

      if (segment.includes(" ")) throw new Error("Malformed `path` parameter");

    
      const isDynamic = segment[0].includes(":");

      const key = isDynamic ? ":" : segment.toLowerCase();
   
      if (isDynamic) {
        let paramString = segment.substring(1);
        dynamicParams.push(paramString);
      }
 
      if (!currentNode.children.has(key)) {
        currentNode.children.set(key, new RouteNode());
      }

      currentNode = currentNode.children.get(key);
      
    }

    currentNode.handlers.set(method, handler);
    currentNode.params = dynamicParams;
  
    }
  
    #parseQueryParams(queryString, currentNode) {
      if (queryString) {
        const searchParams = new URLSearchParams(queryString);
        for (const [key, value] of searchParams.entries()) {
          currentNode.queryParams[key] = value;
        }
      }
    }

    // Find the route handler and parameters for a given path and method
    /**
     * @param {String} path
     * @param {HttpMethod} method
     * @returns { { params: Object, handler: Function } | null }
     */
    findRoute(path, method) {
      this.#verifyPathAndMethod(path, method);
      const [pathWithoutQuery, queryString] = path.split("?");

      // Process path segments
      const segments = pathWithoutQuery.split("/").filter(Boolean);
      console.log("pathWithoutQuery", pathWithoutQuery)
      console.log("queryString", queryString)

      let currentNode = this.root;
      let extractedParams = [];
  
      for (const segment of segments) {
        let childNode = currentNode.children.get(segment.toLowerCase());
        if (childNode) {
          currentNode = childNode;
        } else if ((childNode = currentNode.children.get(":"))) {
          extractedParams.push(segment);
          currentNode = childNode;
        } else {
          return null;
        }
      }
   
      this.#parseQueryParams(queryString, currentNode);
   
      let params = Object.create(null);
  
      for (let idx = 0; idx < extractedParams.length; idx++) {
        let key = currentNode.params[idx];
        let value = extractedParams[idx];
  
        params[key] = value;
      }
  
      return {
        params,
        handler: currentNode.handlers.get(method),
        queryParams: currentNode.queryParams
      };
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


//   Requirements
// https://www.cachelane.com/path/to/page?param1=value1&param2=value2

//     Update the findRoute method to separate the path from query parameters.
//     Implement a new method parseQueryParams to extract query parameters from the URL.
//     Include the parsed query parameters in the object returned by findRoute.
//     Ensure that routes without query parameters still work as before.
//     Important: Handle URL encoding and decoding properly. Learn more about URL encoding.

// Hints

//     You may use the URL or URLSearchParams class in Node.js to parse query parameters.
//     Don't worry about the performance yet, just make sure that your logic works correctly.
//     Use the current Router class implementation as your starting point. You'll need to modify the findRoute method and add a new parseQueryParams method.