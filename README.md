# Push pre-built JavaScript GitHub Action

This GitHub Action compiles JavaScript GitHub Action into a single file (with cache files), and pushes it to GitHub.
Compilation is powered by [zeit/ncc](https://github.com/zeit/ncc).

TypeScript is also supported. Specify your *.ts file to `action.yml#runs.main` (or `action.yaml`)

Since there is no need to commit `node_modules`, your GitHub Action can be released quickly
with less time for pushes during action development and pulls during CI execution.

> This Action has been compiled by itself and released.
> [See pre-built commit](https://github.com/satackey/push-js-action/tree/release-master)

## Example (short ver.)
```yaml
    - # To use latest action, specify "release-master" instead of "v0.0.2"
      uses: satackey/push-js-action@v0.0.2
      with:
        push-branch: release-YOUR_BRANCH_NAME
        # [optional] The commit can be tagged as follows
        # release-tags: v1 v1.0 v1.0.0
```

## Description
1. This action compiles a file (e.g. `index.js`) specified by `runs.main` in `action.yml` or `action.yaml` into `dist/index.js`
1. Replaces the value of `runs.main` with `dist/index.js`.
1. Remove files exclude `/action.yml/` and `dist/*` (or `action.yaml`).
1. Checkout a new branch with the name specified in `push-branch` of inputs.
1. Commit all changes.
1. If `release-tags` are specified, they are will be added to the commit.
1. Force push new branch (and tags) to the `origin`

## Inputs
- `push-branch` **Required**  
    The name of branch to push compiled file.

- `release-tags` optional  
    The names to tag the compiled file commit.

## Contribution
PRs are accepted.

If you are having trouble or feature request, [post new issue](https://github.com/satackey/push-js-action/issues/new).

## Example (long ver.)

```yaml
name: Push pre-built action

on:
  push:
    branches:
    - '**'

jobs:
  build_and_push:
    runs-on: ubuntu-18.04

    steps:
    - name: Setup node.js
      uses: actions/setup-node@v1
      with:
        node-version: 12.x

    - name: Checkout
      uses: actions/checkout@v2

    - name: Output branch name
      id: name
      run: |
        echo "##[set-output name=branch;]${GITHUB_REF#refs/heads/}"

    - name: Push
      # To use latest action, specify "release-master" instead of "v0.0.2"
      uses: satackey/push-js-action@v0.0.2
      with:
        push-branch: release-${{ steps.name.outputs.branch }}
        # The commit can be tagged as follows
        # release-tags: v1 v1.0 v1.0.0
```

The distribution is pushed into `release-<your_branch>` like `release-master`.
