# Contributing

Thanks for your interest in MCPHelm! Bug reports, documentation fixes, and code contributions are all welcome.

## Ways to contribute

- Report a bug — open a [GitHub Issue](https://github.com/wakeup595626-cmyk/mcphelm/issues) with your OS, Node version, and steps to reproduce.
- Request a feature — describe the problem you want solved, not only the solution you have in mind.
- Improve the docs — the README exists in English and Chinese; corrections to either are appreciated.
- Send a pull request — see below.

## Development

```sh
git clone https://github.com/wakeup595626-cmyk/mcphelm.git
cd mcphelm
npm install
npm run typecheck
npm test
```

- `npm run dev` starts the CLI from source.
- `npm run desktop` builds and opens the desktop app.
- `npm run dist:win` produces a Windows installer with electron-builder.

## Pull requests

- Keep each pull request focused on a single change.
- Match the existing code style; the project deliberately has almost no runtime dependencies, so please discuss before adding one.
- Update `README.md` / `README.zh.md` and `CHANGELOG.md` when you change documented behaviour.
- Describe what you tested and how.

## License

By contributing, you agree that your contributions are licensed under the [Apache-2.0](LICENSE) license that covers this project.
