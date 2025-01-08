const { Router, run } = require("./lib");
var cors = require('./lib/cors')
const router = new Router();

const middleware = [
  (req, res, next) => {
    console.log("req!");
    next();
  },
  (req, res, next) => {
    console.log("logged!");
    next();
  },
];

// Error-handling middleware
router.useErrorHandler((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// Helper functions for route handlers
function getUserList(req, res) {
  res.json({ message: "User List" });
}

function showUserInfo(req, res) {
  const userId = req.params.id;
  res.status(200).json({ message: `User Info for ID: ${userId}` });
}

function teamsList(req, res) {
  res.status(200).json({ teams: ["Team Red", "Team Blue"] });
}

function rootHandler(req, res) {
  res.status(200).send("Hello World");
}

function downloadFile(req, res) {
  res.download('./README.md', 'report.pdf');
}

function redirectUser(req, res) {
  res.redirect('/login');
}

function sendError(req, res) {
  res.status(500).send('Internal Server Error');
}

// Define individual routers
const base_routes = new Router().get("/", rootHandler);
const user_routes = new Router().get("/users", getUserList).get("/users/:id", showUserInfo);
const team_routes = new Router().get("/teams", teamsList);

// Merge routers into the main router
const main_router = new Router();
main_router.merge(user_routes);
main_router.merge(team_routes);
main_router.merge(base_routes);

// Nest the main router under "/api/v1"
const api_router = new Router();

// Global middleware
api_router.use((req, res, context, next) => {
  context.user = { id: 1, name: "Furkan" };
  console.log("LOGGING BEGAN!");
  next();
});

api_router.use((req, res, context, next) => {
  context.user = { id: 1, name: "Furkan" };
  console.log("LOGGING BEGAN! 2");
  next();
});

api_router.nest("/api/v2", main_router);

// Global CORS middleware
api_router.use(cors({
  origin: 'https://example.com',
  methods: ['GET', 'POST'],
  credentials: true
}));
// Route with CORS
api_router.get('/data', (req, res) => {
  res.json({ message: 'CORS is working!' });
});

// Group routes with middleware
api_router.group("/profile", middleware, () => {
  api_router.get("/users", getUserList);
  api_router.get("/downloadFile", downloadFile);
  api_router.post("/teams", teamsList);
  api_router.put("/teamstest", teamsList);
});

// Start the server with the nested router
run(api_router, 3000);