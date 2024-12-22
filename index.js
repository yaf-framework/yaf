const http = require("node:http");

const PORT = 5255;

//Instead of using a switch statement, we can use an object to store the HTTP methods
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

class Router {
  constructor() {
    this.routes = {};
  }

  // We can use a private method to add routes to the router
  #addRoute(method, path, handler) {
    //We can use the typeof operator to check if the path is a string and the handler is a function
    if (typeof path !== "string" || typeof handler !== "function") {
      throw new Error("Invalid argument types: path must be a string and handler must be a function");
    }
    //We can use template literals to store the route in the routes object
    this.routes[`${method} ${path}`] = handler;
  }

  handleRequest(request, response) {
    const { url, method } = request;
    const handler = this.routes[`${method} ${url}`];

    if (!handler) {
      return console.log("404 Not found");
    }

    handler(request, response);
  }

  get(path, handler) {
    this.#addRoute(HTTP_METHODS.GET, path, handler);
  }

  post(path, handler) {
    this.#addRoute(HTTP_METHODS.POST, path, handler);
  }

  put(path, handler) {
    this.#addRoute(HTTP_METHODS.PUT, path, handler);
  }

  delete(path, handler) {
    this.#addRoute(HTTP_METHODS.DELETE, path, handler);
  }

  patch(path, handler) {
    this.#addRoute(HTTP_METHODS.PATCH, path, handler);
  }

  head(path, handler) {
    this.#addRoute(HTTP_METHODS.HEAD, path, handler);
  }

  options(path, handler) {
    this.#addRoute(HTTP_METHODS.OPTIONS, path, handler);
  }

  connect(path, handler) {
    this.#addRoute(HTTP_METHODS.CONNECT, path, handler);
  }

  trace(path, handler) {
    this.#addRoute(HTTP_METHODS.TRACE, path, handler);
  }

  printRoutes() {
    console.log(Object.entries(this.routes));
  }
}

class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }

  displayTrie() {
    console.log(this.children);
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }
  // t inserts word to trie
  insert(wordToInsert, node = this.root) {
    let word = wordToInsert.length;
    if (word === 0) return;

    for (let char of wordToInsert) {
      // If the current character is not found in the children map
      if (!node.children.has(char)) {
        // Create a new TrieNode and add it to the map
        node.children.set(char, new TrieNode());
      }
      // Move to the next node
      node = node.children.get(char);
    }
    // Mark the end of the word
    node.isEndOfWord = true;
  }

  search(wordToSearch, node = this.root) {
    if (wordToSearch === undefined || wordToSearch === null) {
      return false;
    }

    if (wordToSearch.length === 0) {
      return node.isEndOfWord;
    }

    for (let char of wordToSearch) {
      if (!node.children.has(char)) {
        return false;
      }
      node = node.children.get(char);
    }
    return node.isEndOfWord;
  }
}

const trie = new Trie();
trie.insert("code");
trie.insert("coding");

let found = trie.search("code");
console.log(found); // true

found = trie.search("cod");
console.log(found); // false

console.dir(trie.root, {
  depth: null,
  colors: true,
  showHidden: true,
});
const router = new Router();

router.get("/", function handleGetBasePath(req, res) {
  console.log("Hello from GET /");
  res.end();
});

router.post("/", function handlePostBasePath(req, res) {
  console.log("Hello from POST /");
  res.end();
});

// Note: We're using an arrow function instead of a regular function now
let server = http.createServer((req, res) => router.handleRequest(req, res));
server.listen(PORT);
