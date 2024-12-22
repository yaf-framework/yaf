# YAF 🚀

_Yet Another Framework (That I'm Building to Learn)_

<!-- <div align="center">
  <img src="logo.svg" alt="YAF Logo" width="400"/>
  <br/>
  <em>Because the JavaScript ecosystem definitely needed another framework</em>
</div> -->

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads Stats][npm-downloads]][npm-url]

## About YAF

Is the world ready for another Node.js framework? No.  
Am I building one anyway to learn? Absolutely.

Welcome to YAF, where we're not trying to replace Express.js, we're just trying to figure out how Express.js works by building something similar but probably worse.

## Features 🌟

- **Blazingly Fast™** (when it works)
- **Lightweight** (because I haven't added any features yet)
- **Zero Dependencies** (because I haven't figured out how to use them properly)
- **Type Safe** (I think, haven't tested)
- **Production Ready** (if your production standards are very, very low)

## Installation 💾

```bash
npm install yaf-framework

# Or if you're feeling brave
npm install yaf-framework@latest
```

## Quick Start 🚀

```javascript
import { YAF } from "yaf-framework";

const app = new YAF();

app.get("/", (req, res) => {
  res.send("Welcome to YAF! If you see this, something actually worked!");
});

app.listen(3000, () => {
  console.log("YAF is running! (Surprising, I know)");
});
```

## Performance Benchmarks 📊

```
YAF vs Express vs Fastify
(Results pending because I'm still learning how to do benchmarks)
```

## Why YAF? 🤔

- You want to learn how frameworks work
- You enjoy living dangerously
- You've used every other framework and are running out of options
- You appreciate documentation with humor because it helps mask the pain

## Contributing 🤝

Want to contribute? Really? Are you sure? Well, okay then!

1. Fork it
2. Create your feature branch (`git checkout -b feature/something-that-might-work`)
3. Commit your changes (`git commit -am 'Added some feature that probably breaks everything'`)
4. Push to the branch (`git push origin feature/something-that-might-work`)
5. Create a new Pull Request
6. Cross your fingers

## Documentation 📚

Full documentation available at [docs.yaf.dev](https://docs.yaf.dev)\*

\*Domain not actually purchased because this is a learning project

## License 📝

MIT License - See [LICENSE.md](LICENSE.md) for details

## Acknowledgments 🙏

- Stack Overflow, for solving 99% of my problems
- Express.js, for being the inspiration (sorry for copying you)
- Coffee, for making this possible
- My rubber duck, for the moral support

---

[npm-image]: https://img.shields.io/npm/v/yaf-framework.svg
[npm-url]: https://npmjs.org/package/yaf-framework
[npm-downloads]: https://img.shields.io/npm/dm/yaf-framework.svg
[travis-image]: https://travis-ci.org/username/yaf-framework.svg?branch=master
[travis-url]: https://travis-ci.org/username/yaf-framework

---

<div align="center">
  <sub>Built with ❤️ and considerable confusion</sub>
</div>
