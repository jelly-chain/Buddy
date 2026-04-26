// ci-cd tools — GitHub Actions generate, trigger, status
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

function sh(cmd, cwd = process.cwd()) {
  try { return { ok: true, out: execSync(cmd, { cwd, encoding: 'utf8' }).trim() }; }
  catch (e) { return { ok: false, error: e.message, stderr: e.stderr?.toString() }; }
}

export async function gen_node_ci({ cwd = process.cwd() } = {}) {
  const path = join(cwd, '.github', 'workflows', 'ci.yml');
  const yml = `name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test --if-present
      - run: npm run build --if-present
`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, yml);
  return { ok: true, path };
}

export async function gen_rust_ci({ cwd = process.cwd() } = {}) {
  const path = join(cwd, '.github', 'workflows', 'rust.yml');
  const yml = `name: Rust CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rs/toolchain@v1
        with: { toolchain: stable, components: clippy, rustfmt }
      - run: cargo fmt -- --check
      - run: cargo clippy -- -D warnings
      - run: cargo test
`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, yml);
  return { ok: true, path };
}

export async function run_workflow({ workflow, cwd = process.cwd() } = {}) {
  if (!workflow) return { ok: false, error: 'workflow required' };
  return sh(`gh workflow run "${workflow}"`, cwd);
}

export async function list_workflows({ cwd = process.cwd() } = {}) {
  return sh(`gh workflow list`, cwd);
}

export async function run_status({ cwd = process.cwd() } = {}) {
  return sh(`gh run list --limit 10`, cwd);
}

export async function pr_create({ cwd = process.cwd(), title = '', body = '' } = {}) {
  if (!title) return { ok: false, error: 'title required' };
  return sh(`gh pr create --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}"`, cwd);
}
