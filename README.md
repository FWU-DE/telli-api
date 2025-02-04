# deutschlandgpt knotenpunkt

## requirements

1. [nvm](https://github.com/nvm-sh/nvm)
2. [docker](https://docs.docker.com/engine/install/) (for proper local development)

## docs

If you want to understand the project in-depth, you can find more docs in the [`docs`](./docs) folder.
[Project Structure](./docs/project-structure.md) is a good starting point.

## development

Set the correct versions of the tools:

```sh
# set node version through the .nvmrc file
nvm use
# set the pnpm version through the package.json
corepack enable
corepack prepare
```

Install dependencies

```sh
pnpm i
```

Start the server (you will need environment variables for this to work properly).

```sh
pnpm dev:api
```

## environment variables

Following environment variables are required:

```.env
DATABASE_URL=
API_BASE_URL=
```

You can find example env variables inside the [`.env.example`](./.env.example) file.
If you develop locally it is enough to just copy the variables over:

```sh
cp .env.example .env
```

## database

We use postgres as our database.
To spin up a local database, run the following command:

```sh
docker compose -f docker-compose.db.yml up -d
```

If you want to have a fresh database run:

```sh
docker compose -f docker-compose.db.yml down --volumes
docker compose -f docker-compose.db.yml up -d
```
