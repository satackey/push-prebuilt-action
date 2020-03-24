# release-js-action

This GitHub Action compiles JavaScript GitHub Action into a single file (with caches), and pushes it to GitHub.
Compilation is powered by [zeit/ncc](https://github.com/zeit/ncc).
<!-- You need not commit node_modules. -->
Since there is no need to commit `node_modules`, your GitHub Action can be released quickly
with less time for pushes during action development and pulls during CI execution.


## Inputs
- `release-branch` **Required**  
    The name of branch to push compiled file.

- `release-tags` optional  
    The names of the tag to attach to the commit of the compiled file.

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
      uses: satackey/release-js-action@release-master
      with:
        release-branch: release-${{ steps.name.outputs.branch }}
```

The distribution is pushed into `release-<your_branch>` like `master-branch`.