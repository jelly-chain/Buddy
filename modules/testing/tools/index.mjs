// testing tools — jest, vitest, pytest, cargo test, coverage
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function sh(cmd, cwd = process.cwd(), timeout = 600000) {
  try { return { ok: true, out: execSync(cmd, { cwd, encoding: 'utf8', timeout }).trim() }; }
  catch (e) { return { ok: false, error: e.message, stderr: e.stderr?.toString().slice(0, 2000) }; }
}

export async function detect({ cwd = process.cwd() } = {}) {
  const frameworks = [];
  if (existsSync(join(cwd, 'package.json'))) {
    try {
      const pkg = JSON.parse(require('node:fs').readFileSync(join(cwd, 'package.json'), 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.jest) frameworks.push('jest');
      if (deps.vitest) frameworks.push('vitest');
      if (deps.mocha) frameworks.push('mocha');
      if (deps.playwright || deps['@playwright/test']) frameworks.push('playwright');
    } catch {}
  }
  if (existsSync(join(cwd, 'Cargo.toml'))) frameworks.push('cargo-test');
  if (existsSync(join(cwd, 'pytest.ini')) || existsSync(join(cwd, 'pyproject.toml'))) frameworks.push('pytest');
  return { ok: true, cwd, frameworks };
}

export async function run({ cwd = process.cwd(), framework = 'auto' } = {}) {
  const cmds = {
    jest: 'npx jest',
    vitest: 'npx vitest run',
    mocha: 'npx mocha',
    playwright: 'npx playwright test',
    npm: 'npm test',
    'cargo-test': 'cargo test',
    pytest: 'pytest',
    auto: 'npm test'
  };
  const cmd = cmds[framework] || cmds.auto;
  return sh(cmd, cwd);
}

export async function coverage({ cwd = process.cwd(), framework = 'jest' } = {}) {
  const cmds = {
    jest: 'npx jest --coverage',
    vitest: 'npx vitest run --coverage',
    pytest: 'pytest --cov',
    'cargo-test': 'cargo tarpaulin'
  };
  return sh(cmds[framework] || cmds.jest, cwd);
}

export async function watch({ cwd = process.cwd(), framework = 'vitest' } = {}) {
  const cmds = { jest: 'npx jest --watch', vitest: 'npx vitest' };
  try {
    execSync(`cd "${cwd}" && ${cmds[framework] || cmds.vitest} > /tmp/test-watch.log 2>&1 & disown`, { shell: '/bin/bash' });
    return { ok: true, started: true, log: '/tmp/test-watch.log' };
  } catch (e) { return { ok: false, error: e.message }; }
}
