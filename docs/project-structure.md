# project structure

This project is a monorepo consisting of packages and apps. We use [turborepo](https://turbo.build/repo/docs) to manage this.

## apps and packages

Following apps and packages currently exists:

Apps:

- [api](./apps/api/readme.md)

Packages:

- [database](./packages/database) - Contains all of the database related utilities, including migrations and seeding
- [eslint-config](./packages/eslint-config) - Contains general eslint-config files to use across packages and apps
- [llm-model](./packages/llm-model) - Contains llm model utilies
- [typescript-config](./packages/typescript-config) - Contains general typescript-config files to use across packages and apps
- [ui](./packages/ui) - Contains common ui components (currently not in use)
- [utils](./packages/utils) - Contains common utilies to use across packages and apps
