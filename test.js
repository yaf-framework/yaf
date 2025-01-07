const { Router, run } = require("./lib");

const router = new Router();
router.get("/users/:id", (req, res) => {
  console.log(req.params.id);
  console.log(req.query);
});

router.get("/users/:id/posts/:postId", (req, res) => {
  console.log(req.params.id);
  console.log(req.params.postId);
  console.log(req.query);
});

// Test Cases
const testCases = [
  { path: "/users", method: "GET", description: "Basic Route Matching" },
  { path: "/users/123", method: "GET", description: "Dynamic Parameters" },
  { path: "/users/123?name=Velocy&age=1", method: "GET", description: "Query String Parsing" },
  { path: "/users/123?name=John%20Doe&city=New%20York", method: "GET", description: "URL-Encoded Query Parameters" },
  { path: "/users/123?name=Velocy&name=John", method: "GET", description: "Duplicate Query Parameters" },
  { path: "/users/123?name=&age=1", method: "GET", description: "Empty Query Parameter Values" },
  { path: "/users/123?name&age=1", method: "GET", description: "Missing Query Parameter Values" },
  { path: "/users/123?search=hello%20world%21", method: "GET", description: "Special Characters in Query Parameters" },
  { path: "/invalid/path", method: "GET", description: "Invalid Path" },
  { path: "/users/123", method: "INVALID_METHOD", description: "Invalid HTTP Method" },
  { path: "users/123", method: "GET", description: "Malformed Path" },
  { path: "/users/123/posts/456", method: "GET", description: "Multiple Dynamic Parameters" },
  { path: "/users/123", method: "GET", description: "No Query String" },
  { path: "/users/123?", method: "GET", description: "Empty Query String" },
  { path: "/users/123/posts/456?name=Velocy&age=1", method: "GET", description: "Mixed Dynamic Parameters and Query Strings" },
];

testCases.forEach(({ path, method, description }) => {
  console.log(`Running Test: ${description}`);
  try {
    const result = router.findRoute(path, method);
    console.log(result);
  } catch (error) {
    console.error(error.message);
  }
  console.log("-----------------------------");
});

run(router, 3000);
