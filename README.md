# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
bunx sv create

# create a new project in my-app
bunx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
bun run dev

# or start the server and open the app in a new browser tab
bun run dev -- --open
```

## Building

To create a production version of your app:

```sh
bun run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Junie AI Guidelines

For the guidelines about project structure and which commands to use, see JUNIE_GUIDELINES.md.

## Testing

### Unit Tests

Run unit tests with:

```sh
bun run test
```

### Repository Tests with Docker

The project includes a setup for testing repositories with a local test database using Docker:

```sh
# Run repository tests with the test database
bun run test:repo
```

For more details about the repository testing setup, see [Repository Testing Documentation](src/lib/server/test/README.md).

### End-to-End Tests

Run end-to-end tests with:

```sh
bun run test:e2e
```
