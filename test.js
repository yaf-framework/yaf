const { Router, run } = require("./lib");

const router = new Router();


const authMiddleware = [
  (req, res,  next) => {  // Added context parameter
   
    console.log("req!");
    next();
  },
  (req, res,  next) => {  // Added context parameter

    console.log("logged!");
    next();
  }
];

// Error-handling middleware
router.useErrorHandler((err, req, res, next) => {
  res.writeHead(500, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: err.message }));
});



// Helper functions for route handlers
function getUserList(req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(`Hello`);
}

function showUserInfo(req, res,) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(`Hello,`);
}

function teamsList(req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ teams: ["Team Red", "Team Blue"] }));
}

function rootHandler(req, res) {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello World");
}


router.group("/profile", authMiddleware, () => {
  router.get("/users", getUserList);
  router.post("/teams", teamsList);
});


// // Define individual routers
// const base_routes = new Router().get("/", rootHandler);
// const user_routes = new Router().get("/users", getUserList).get("/users/:id", showUserInfo);
// const team_routes = new Router().get("/teams", teamsList);

// // Merge routers into the main router
// const main_router = new Router();
// main_router.merge(user_routes);
// main_router.merge(team_routes);
// main_router.merge(base_routes);

// // Nest the main router under "/api/v1"
// const api_router = new Router();

// // Global middleware
// api_router.use((req, res,context, next) => {
//   context.user = { id: 1, name: "Furkan" };
//   console.log("asdad")
//   next();
// });



// api_router.nest("/api/v1", main_router);

// Test cases for non-nested routes (main_router)
const nonNestedTestCases = [
  { path: "/", method: "GET", description: "Root Route" },
  { path: "/users", method: "GET", description: "User List" },
  { path: "/users/123", method: "GET", description: "User Info" },
  { path: "/teams", method: "GET", description: "Team List" },
  { path: "/invalid", method: "GET", description: "Invalid Route" },
  {
    path: "/users/123?name=Velocy&age=1",
    method: "GET",
    description: "Query String Parsing",
  },
];

// Test cases for nested routes (api_router)
const nestedTestCases = [
  { path: "/api/v1/", method: "GET", description: "Nested Root Route" },
  { path: "/api/v1/users", method: "GET", description: "Nested User List" },
  {
    path: "/api/v1/users/123",
    method: "GET",
    description: "Nested User Info",
  },
  { path: "/api/v1/teams", method: "GET", description: "Nested Team List" },
  {
    path: "/api/v1/invalid",
    method: "GET",
    description: "Nested Invalid Route",
  },
];

// // Run non-nested test cases
// console.log("Running Non-Nested Test Cases:");
// nonNestedTestCases.forEach(({ path, method, description }) => {
//   console.log(`Running Test: ${description}`);
//   try {
//     const result = main_router.findRoute(path, method);
//     if (result && result.handler) {
//       console.log("Route found:", result);
//     } else {
//       console.log("Route not found.");
//     }
//   } catch (error) {
//     console.error(error.message);
//   }
//   console.log("-----------------------------");
// });

// // Run nested test cases
// console.log("Running Nested Test Cases:");
// nestedTestCases.forEach(({ path, method, description }) => {
//   console.log(`Running Test: ${description}`);
//   try {
//     const result = api_router.findRoute(path, method);
//     if (result && result.handler) {
//       console.log("Route found:", result);
//     } else {
//       console.log("Route not found.");
//     }
//   } catch (error) {
//     console.error(error.message);
//   }
//   console.log("-----------------------------");
// });

// Start the server with the nested router
run(router, 3000);
