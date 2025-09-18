Junie AI Guidelines

Purpose

- This document gives Junie AI a quick reference to the project structure and the exact commands to use for common tasks.

Project structure (high level)

- src/ — application source code (routes, lib/components, styles, etc.)
- static/ — static assets served as-is
- e2e/ — Playwright end-to-end tests
- messages/ — app-specific message resources
- project.inlang/ — inlang project settings (localization setup)
- drizzle.config.ts — Drizzle ORM config
- svelte.config.js — SvelteKit configuration
- vite.config.ts — Vite configuration
- tsconfig.json — TypeScript configuration
- eslint.config.js — ESLint configuration
- README.md — project overview

Package manager and runner

- Always use Bun for local commands and scripts. Do NOT use npm or npx in this repository.
  - Run package scripts: bun run <script>
  - Execute CLIs without installing locally: bunx <cli> [args]
  - Example (create Svelte project): bunx sv create my-app
  - If you see npm/npx in docs or examples, replace with bun/bunx equivalents.

Common scripts (preferred usage)

- Development server
  - bun run dev
- Build production bundle
  - bun run build
- Preview production build
  - bun run preview
- Typecheck (Svelte + TS)
  - bun run check
  - Watch mode: bun run check:watch
- Linting and formatting
  - Lint (Prettier check + ESLint): bun run lint
  - Format (Prettier write): bun run format
- Unit tests (Bun test)
  - bun run test
- End-to-end tests (Playwright)
  - bun run test:e2e
- Database (Drizzle Kit)
  - Push schema to database: bun run db:push
  - Generate migration files: bun run db:generate
  - Apply migrations: bun run db:migrate
  - Studio UI: bun run db:studio

Clean architecture and naming conventions

- We follow a 3-layer structure: controller (interface adapter), service (business logic), repository (data access).
- Naming suffixes:
  - Use the suffix Orm for classes that map to database tables/entities used by the ORM.
  - Use the suffix TO for transfer objects exposed at the controller boundary (request/response payloads).
  - Business objects (domain models) use clear, normal names without suffixes.
- Responsibilities and flow:
  - Controller: receives HTTP request, validates input, converts from TO to Business Object (BO); after service processing, converts BO back to TO for the HTTP response.
  - Service: contains business logic only; works exclusively with BOs (no TO or Orm types here).
  - Repository: takes BOs as input, converts BO -> Orm for persistence/queries; on reads, converts Orm -> BO and returns BOs to the service.
- Example naming (illustrative only):
  - User (business object), UserOrm (ORM entity/table mapping), CreateUserTO (request), UserTO (response).
- Do not:
  - Use TOs inside service logic.
  - Return Orm objects beyond the repository layer.
  - Call the repository directly from the controller; always go through the service.

Test naming and discovery

- Use Bun’s default patterns so tests are auto-discovered:
  - **`**/\*.test.{js,jsx,ts,tsx,mjs,cjs,mts,cts}`\*\*
  - **`**/\*.spec.{js,jsx,ts,tsx,mjs,cjs,mts,cts}`\*\*
  - Or place tests under `__tests__/` or `tests/` directories.
- Do not use `*-test.ts` or `test-*.ts` filenames unless they live in a `tests`/`__tests__` folder. Prefer renaming to `*.test.ts`.
- Run unit tests with: `bun run test` (which executes `bun test`).

Notes for Junie when editing code

- Use minimal changes to satisfy issues and keep consistency with existing patterns.
- Respect Windows paths in scripts and documentation when relevant.
- Follow the Bun-only policy: replace any npm/npx usage with bun/bunx.
- When adding docs, prefer placing developer-facing docs at the repo root or in a docs/ folder; testing specs go under e2e/.
- When adding or changing commands, update both this file and the root README.md so humans can discover changes easily.

How to extend these guidelines

- Add subsections under Project structure for any new top-level folders you introduce.
- Add any new scripts you create to the Common scripts list and provide a short, precise description.
- If you change the preferred package runner, update the Package manager and runner section and mirror commands for npm if helpful.
