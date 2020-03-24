# Release JavaScript GitHub Action

This GitHub Action compiles JavaScript GitHub Action into a single file (with caches), and pushes it to GitHub.
Compilation is powered by [zeit/ncc](https://github.com/zeit/ncc).

Since there is no need to commit `node_modules`, your GitHub Action can be released quickly
with less time for pushes during action development and pulls during CI execution.

> This Action has been compiled by itself and released.
> [See pre-built commit](https://github.com/satackey/release-js-action/tree/release-master)

## Inputs
- `release-branch` **Required**  
    The name of branch to push compiled file.

- `release-tags` optional  
    The names of the tag to attach to the commit of the compiled file.

## Contribution
PRs are accepted.

If you are having trouble or future request, [post new issue](https://github.com/satackey/release-js-action/issues/new).

## Example
```yaml
name: Relase distribution

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

    - name: Release
      # To use latest action, specify "release-master" instead of "v0.0.1"
      uses: satackey/release-js-action@v0.0.1
      with:
        release-branch: release-${{ steps.name.outputs.branch }}
        # You can tag the commit by uncommenting following line
        # release-tags: v1 v1.0 v1.0.0
```

The distribution is pushed into `release-<your_branch>` like `master-branch`.
