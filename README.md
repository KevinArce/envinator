# 🤖 Envinator

> **"Come with me if you want to deploy."** — A developer should be able to run `npx envinator` in a fresh repo and be operational in seconds.

**Envinator** is a specialized CLI tool sent back in time to statically analyze your codebase. It identifies all usages of `process.env`, compares them against your local `.env` file, and ruthlessly prompts you to populate missing variables.

No more `undefined` runtime errors. No more asking "What's the API key again?" Now with a custom **Envinator** theme.

---

## ⚡ Deployment Protocol

You don't even need to install it. Just run it in your project root:

```bash
npx envinator-cli
```

Envinator will:

1. **Scan** your directory for `process.env` usages using AST analysis.
2. **Identify** discrepancies against your current `.env` file.
3. **Interrogate** you to fill in missing values.
4. **Update** your `.env` (and optionally `.env.example`).

---

## 🦾 Capabilities

- **Cybernetic AST Scanning:** Uses `ts-morph` to parse your code. It won't get fooled by comments or strings like regex would.
- **Destructuring Detection:** Detects complex patterns like:
  ```typescript
  const { DB_HOST, DB_PORT: port } = process.env; // Targets acquired.
  ```
- **Secure Input:** Automatically masks sensitive keys (PASSWORD, KEY, SECRET, TOKEN) during input.
- **Target Location:** Shows you exactly *where* a variable is used (file & line number).
- **Unused Variable Detection:** Identifies variables in your `.env` that are *not* used in your codebase, keeping your config clean.
- **Auto-Generated Types:** Can generate a `env.d.ts` declaration file to strongly type usage of `process.env`.
- **Skynet Ready (CI/CD):** Auto-detects non-TTY environments and switches to lint mode.
- **Zero Config:** Works out of the box for TypeScript and JavaScript projects.

---

## 🛠 Usage & Directives

```bash
npx envinator-cli [options]
```

| Option | Alias | Description | Default |
| --- | --- | --- | --- |
| `--dir <path>` | `-d` | The directory to scan for code | `./` |
| `--env <path>` | `-e` | Path to your environment file | `.env` |
| `--types <path>` | `-t` | Output path for TypeScript definitions | |
| `--example` | `-x` | Update .env.example with new keys | `true` |
| `--no-example` | | Skip updating .env.example | |
| `--dry-run` | | Scan and report without writing to disk | `false` |
| `--lint` | | Exit code 1 if variables are missing (CI mode) | `false` |

### CI/CD Defense Grid

Use Envinator to fail your build if a developer forgot to add a new variable:

```yaml
# In your GitHub Action
- name: Verify Environment Integrity
  run: npx envinator --dir ./src --env .env.example --lint
```

---

## 🧠 System Logic

Envinator uses `ts-morph` to build an Abstract Syntax Tree of your code. It looks for three access patterns:

1. **Property Access:** `process.env.API_URL`
2. **Element Access:** `process.env['STRIPE_KEY']`
3. **Destructuring:** `const { REDIS_URL } = process.env`

It ignores dynamic access (e.g., `process.env[dynamicVar]`) and warns you about them since they cannot be statically determined.

---

## 📦 Installation

If you want to install it globally or as a dev dependency:

```bash
npm install -D envinator-cli
# or
yarn add -D envinator-cli
# or
pnpm add -D envinator-cli
```

Add it to your `package.json` scripts:

```json
{
  "scripts": {
    "env:check": "envinator --lint",
    "env:setup": "envinator"
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
2. Create your feature branch (`git checkout -b feature/skynet-upgrade`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

MIT © 2026

---

> *"Hasta la vista, undefined."*
