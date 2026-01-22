# 🧙 env-wizard

> **"Zero-Config Safety"** — A developer should be able to run `npx env-wizard` in a fresh repo and be fully set up in seconds.

**env-wizard** is a CLI tool that statically analyzes your codebase to identify all usages of `process.env`, compares them against your local `.env` file, and interactively guides you to populate missing variables.

No more `undefined` runtime errors. No more asking "What's the API key again?"

---

## ⚡ Quick Start

You don't even need to install it. Just run it in your project root:

```bash
npx env-wizard
```

env-wizard will:

1. **Scan** your directory for `process.env` usages using AST analysis
2. **Diff** them against your current `.env` file
3. **Prompt** you interactively to fill in missing values
4. **Update** your `.env` (and optionally `.env.example`)

---

## 🦾 Features

- **AST-Powered Scanning:** Uses `ts-morph` to parse your code. It won't get fooled by comments or strings like regex would.
- **Destructuring Support:** Detects complex patterns like:
  ```typescript
  const { DB_HOST, DB_PORT: port } = process.env; // Catches both!
  ```
- **Secure Input:** Automatically masks sensitive keys (PASSWORD, KEY, SECRET, TOKEN) during input.
- **Context Aware:** Shows you exactly *where* a variable is used (file & line number) so you know what value to provide.
- **CI/CD Ready:** Auto-detects non-TTY environments and switches to lint mode.
- **Zero Config:** Works out of the box for TypeScript and JavaScript projects.

---

## 🛠 Usage & Options

```bash
npx env-wizard [options]
```

| Option | Alias | Description | Default |
| --- | --- | --- | --- |
| `--dir <path>` | `-d` | The directory to scan for code | `./` |
| `--env <path>` | `-e` | Path to your environment file | `.env` |
| `--example` | `-x` | Update .env.example with new keys | `true` |
| `--no-example` | | Skip updating .env.example | |
| `--dry-run` | | Scan and report without writing to disk | `false` |
| `--lint` | | Exit code 1 if variables are missing (CI mode) | `false` |

### CI/CD Pipeline Example

Use env-wizard to fail your build if a developer forgot to add a new variable:

```yaml
# In your GitHub Action
- name: Check environment variables
  run: npx env-wizard --dir ./src --env .env.example --lint
```

---

## 🧠 How It Works

env-wizard uses `ts-morph` to build an Abstract Syntax Tree of your code. It looks for three access patterns:

1. **Property Access:** `process.env.API_URL`
2. **Element Access:** `process.env['STRIPE_KEY']`
3. **Destructuring:** `const { REDIS_URL } = process.env`

It ignores dynamic access (e.g., `process.env[dynamicVar]`) and warns you about them since they cannot be statically determined.

---

## 📦 Installation

If you want to install it globally or as a dev dependency:

```bash
npm install -D env-wizard
# or
yarn add -D env-wizard
# or
pnpm add -D env-wizard
```

Add it to your `package.json` scripts:

```json
{
  "scripts": {
    "env:check": "env-wizard --lint",
    "env:setup": "env-wizard"
  }
}
```

---

## 🧪 Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev -- --dir ./tests/fixtures --dry-run

# Run tests
npm test

# Build for production
npm run build
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

MIT © 2026

---

> *"Zero config. Zero undefined. Zero excuses."*
