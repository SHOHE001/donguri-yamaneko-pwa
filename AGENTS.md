# Repository guidance

## Development workflow

- Use GitHub Issues for durable task context and acceptance criteria.
- Work on a `feature/`, `fix/`, `refactor/`, or `chore/` branch. Do not push directly to the default branch.
- Open a pull request, run CI, and merge only after required checks pass.
- Do not commit secrets, personal information, generated logs, or local environment files.
- Preserve the source and credit information for the Aozora Bunko text.

## Verification

Run the checks that exist for the current branch:

```sh
npm test
npm run check
npm run test:browser
```

For a manual PWA check, serve the repository over HTTP and verify installability, offline reload, reading preferences, and progress restoration.

