# Push pre-built JS/TS/Docker GitHub Action

This GitHub action reduces CI execution time by pre-building JavaScript, TypeScript, and Docker container actions.

## What does this action do to make it pre-built?

### JavaScript / TypeScript action
This action compiles JavaScript GitHub Action into a single file (with cache files if you want), and pushes it to GitHub.
Compilation is powered by [zeit/ncc](https://github.com/zeit/ncc).

TypeScript is also supported. Specify your *.ts file to `action.yml#runs.main`

Since there is no need to commit `node_modules`, your GitHub Action can be released quickly
with less time for pushes during action development and pulls during CI execution.

> This Action written in TypeScript has been compiled by itself and released.
> [See pre-built commit](https://github.com/satackey/push-js-action/tree/release-master)

### Docker container action
This action builds an image from your Dockerfile, and pushes it to the Docker registry,
and rewrites `action.yml#rans.image` by pushed tag.

The job just pulls Docker image when using the action, and there's no time to build the Dockerfile.

## Usage

- [JavaScript / TypeScript](#javascript--typescript)
- [Docker container](#docker-container)

The description `action.yml` can be read as `action.yaml`.

### JavaScript / TypeScript

#### Example (Step only)
```yaml
    - uses: satackey/push-prebuilt-action@v0.1
      with:
        push-branch: release-master
```

[Click here](#javascript--typescript-action-example) to see workflow example

#### Basic flow
1. This action detects that your action is a JS/TS action by `action.yml`
1. This action compiles a file (e.g. `index.js`) specified in `action.yml#runs.main` into `dist/index.js`
1. Replaces the value of `runs.main` with `dist/index.js`.
1. Remove files exclude `/action.yml` and `dist/*`.
1. Checkout a new branch with the name specified in `push-branch`.
1. Commit all changes.
1. Force push new branch (and tags) to the `origin`

#### Basic inputs
<!-- COMMON DESCRIPTION -->
- `push-branch` **Required**  
    The name of branch to push compiled file.

<!-- COMMON DESCRIPTION -->
- `release-tags` optional  
    The names to tag the compiled file commit.

<!-- COMMON DESCRIPTION -->
- `commit-message` optional, default: `[auto]`  
    The commit message for the compiled.

#### Advanced configrations
<!-- COMMON DESCRIPTION -->
- `committer-name` **Required**  
    default: `github-actions`  
    The name to set as git `user.name`.

<!-- COMMON DESCRIPTION -->
- `committer-email` **Required**  
    default: `actions@github.com`  
    The email to set as git `user.email`.

<!-- COMMON DESCRIPTION -->
- `execlude-from-cleanup` **Required**  
    default: `action.yml action.yaml dist .git`  
    Files/dirs to leave for commit.

<!-- COMMON DESCRIPTION -->
- `force-push` **Required**  
    default: `'true'`  
    Whether to force push to branch or tags.
    Either 'true' or 'false'.

- `js-build-command` **Required**  
    default: `ncc build --v8-cache {main}`  
    The command and arguments to build JavaScript or TypeScript files.
    The artifacts must be in the dist/ directory and entrypoint must be dist/index.js.

### Docker container

#### Example (step only)
```yaml
    - uses: satackey/push-prebuilt-action@v0.1
      with:
        push-branch: release-<your_branch_name>
        docker-registry: docker.io
        docker-user: <your_dockerhub_username>
        docker-token: <your_dockerhub_access_token>
        docker-repotag: <your_repo>:${{ github.sha }}
```

[Click here](#docker-container-action-example) to see workflow example

#### Basic flow
1. This action detects that your action is a Docker container action by `action.yml`
1. This action builds the Dockerfile specifed in `action.yml#runs.image`
1. Replaces the value of `runs.image` with `docker://<docker-repotag>`.
1. Remove files exclude `/action.yml`.
1. Checkout a new branch with the name specified in `push-branch`.
1. Commit all changes.
1. Push the Docker image `<docker-repotag>` to the Docker registry `<docker-registry>`.
1. Force push new branch (and tags) to the `origin`

#### Basic inputs
<!-- COMMON DESCRIPTION -->
- `push-branch` **Required**  
    The name of branch to push compiled file.

<!-- COMMON DESCRIPTION -->
- `release-tags` optional  
    The names to tag the compiled file commit.

<!-- COMMON DESCRIPTION -->
- `commit-message` optional, default: `[auto]`  
    The commit message for the compiled.

- `docker-registry` **Required**  
    The Docker registry's repository of push action image.

- `docker-repotag` **Required**  
    The Docker registry's repository of push action image.

- `docker-user` **Required**  
    The username to login to the Docker registry.

- `docker-token` **Required**  
    The token to login to the Docker registry.

#### Advanced configrations
<!-- COMMON DESCRIPTION -->
- `committer-name` **Required**  
    default: `github-actions`  
    The name to set as git `user.name`.

<!-- COMMON DESCRIPTION -->
- `committer-email` **Required**  
    default: `actions@github.com`  
    The email to set as git `user.email`.

<!-- COMMON DESCRIPTION -->
- `execlude-from-cleanup` **Required**  
    default: `action.yml action.yaml dist .git`  
    Files/dirs to leave for commit.

<!-- COMMON DESCRIPTION -->
- `force-push` **Required**  
    default: `'true'`  
    Whether to force push to branch or tags.
    Either 'true' or 'false'.

- `docker-build-command` **Required**  
    default: `'true'`  
    The command and arguments to build Docker image.

## Contribution
PRs are accepted.

If you are having trouble or feature request, [post new issue](https://github.com/satackey/push-js-action/issues/new).

## Workflow Examples

### JavaScript / TypeScript action example

```yaml
name: Push pre-built action

on:
  push:
    branches:
    - '**'

jobs:
  build_and_push:
    runs-on: ubuntu-latest

    steps:
    - name: Setup node.js
      uses: actions/setup-node@v1
      with:
        node-version: 12.x

    - name: Checkout
      uses: actions/checkout@v2

    - name: Output branch name
      id: name
      run: echo "##[set-output name=branch;]${GITHUB_REF#refs/heads/}"

    - name: Push
      uses: satackey/push-prebuilt-action@v0.1
      with:
        push-branch: release-${{ steps.name.outputs.branch }}
        # [optional] The commit can be tagged.
        # release-tags: v1 v1.0 v1.0.0
        # [optional] You can change he commit message.
        # commit-message: '[ci skip]'
```

The distribution is pushed into `release-<your_branch>` like `release-master`.

#### Docker container action example

```yaml
name: Push pre-built action

on:
  push:
    branches:
    - '**'

jobs:
  build_and_push:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v2

    - name: Output branch name
      id: name
      run: echo "##[set-output name=branch;]${GITHUB_REF#refs/heads/}"

    - name: Push
      uses: satackey/push-prebuilt-action@v0.1
      with:
        push-branch: release-${{ steps.name.outputs.branch }}
        # [optional] The commit can be tagged.
        # release-tags: v1 v1.0 v1.0.0
        # [optional] You can change he commit message.
        # commit-message: '[ci skip]'
        docker-registry: docker.io
        docker-user: <your_dockerhub_username>
        docker-token: ${{ secrets.DOCKERHUB_TOKEN }} # your dockerhub access token
        docker-repotag: <your_repo>:${{ github.sha }}
```

The distribution is pushed into `release-<your_branch>` like `release-master`.
