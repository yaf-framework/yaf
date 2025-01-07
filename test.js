const { Router, run } = require('./lib');

const router = new Router();

router.get('/', (req, res) => {
  res.end('Hello from the root endpoint');
});


router.get('/user/:age/class/:subject', (req, res) => {
  console.log(req.params)  // Should now correctly show { age: '21', subject: 'Mathematics' }
  res.end(`You're ${req.params.age} years old, and you're studying ${req.params.subject}.`);
});

router.get("/user/:name", (req, res) => {
 
  res.end(`You're ${req.params.name}.`);
})

run(router, 3000);