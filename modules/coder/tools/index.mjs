// coder tools — lint, test, format, build, run for various languages
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function sh(cmd, cwd = process.cwd(), timeoutMs = 120000) {
  try {
    const out = execSync(cmd, { cwd, encoding: 'utf8', timeout: timeoutMs, stdio: ['pipe', 'pipe', 'pipe'] });
    return { ok: true, out: out.trim() };
  } catch (e) {
    return { ok: false, error: e.message, stdout: e.stdout?.toString() || '', stderr: e.stderr?.toString() || '' };
  }
}

function detect(cwd = process.cwd()) {
  if (existsSync(join(cwd, 'package.json'))) return 'node';
  if (existsSync(join(cwd, 'Cargo.toml'))) return 'rust';
  if (existsSync(join(cwd, 'pyproject.toml')) || existsSync(join(cwd, 'requirements.txt'))) return 'python';
  if (existsSync(join(cwd, 'go.mod'))) return 'go';
  return 'unknown';
}

export async function detect_lang({ cwd = process.cwd() } = {}) {
  return { ok: true, lang: detect(cwd), cwd };
}

export async function install({ cwd = process.cwd() } = {}) {
  const lang = detect(cwd);
  if (lang === 'node') return sh('npm install', cwd, 300000);
  if (lang === 'rust') return sh('cargo build', cwd, 300000);
  if (lang === 'python') return sh('pip install -r requirements.txt', cwd, 300000);
  if (lang === 'go') return sh('go mod download', cwd, 300000);
  return { ok: false, error: 'unknown language' };
}

export async function lint({ cwd = process.cwd() } = {}) {
  const lang = detect(cwd);
  if (lang === 'node') return sh('npx eslint . || true', cwd);
  if (lang === 'rust') return sh('cargo clippy', cwd);
  if (lang === 'python') return sh('ruff check . || flake8 . || true', cwd);
  if (lang === 'go') return sh('go vet ./...', cwd);
  return { ok: false, error: 'unknown language' };
}

export async function test({ cwd = process.cwd() } = {}) {
  const lang = detect(cwd);
  if (lang === 'node') return sh('npm test', cwd);
  if (lang === 'rust') return sh('cargo test', cwd);
  if (lang === 'python') return sh('pytest || python -m unittest discover', cwd);
  if (lang === 'go') return sh('go test ./...', cwd);
  return { ok: false, error: 'unknown language' };
}

export async function build({ cwd = process.cwd() } = {}) {
  const lang = detect(cwd);
  if (lang === 'node') return sh('npm run build', cwd);
  if (lang === 'rust') return sh('cargo build --release', cwd);
  if (lang === 'python') return sh('python -m build || true', cwd);
  if (lang === 'go') return sh('go build ./...', cwd);
  return { ok: false, error: 'unknown language' };
}

export async function format({ cwd = process.cwd() } = {}) {
  const lang = detect(cwd);
  if (lang === 'node') return sh('npx prettier --write . || true', cwd);
  if (lang === 'rust') return sh('cargo fmt', cwd);
  if (lang === 'python') return sh('ruff format . || black .', cwd);
  if (lang === 'go') return sh('gofmt -w .', cwd);
  return { ok: false, error: 'unknown language' };
}

export async function syntax_check({ file } = {}) {
  if (!file) return { ok: false, error: 'file required' };
  if (file.endsWith('.mjs') || file.endsWith('.js')) return sh(`node --check "${file}"`);
  if (file.endsWith('.ts')) return sh(`npx tsc --noEmit "${file}"`);
  if (file.endsWith('.py')) return sh(`python -m py_compile "${file}"`);
  if (file.endsWith('.rs')) return sh(`rustc --emit=metadata "${file}"`);
  return { ok: false, error: 'unsupported extension' };
}

export async function run({ cmd, cwd = process.cwd(), timeout = 60000 } = {}) {
  if (!cmd) return { ok: false, error: 'cmd required' };
  return sh(cmd, cwd, timeout);
}
