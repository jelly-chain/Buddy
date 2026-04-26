// rust tools — cargo build/test/clippy/fmt, wasm-pack
import { execSync } from 'node:child_process';

function sh(cmd, cwd = process.cwd(), timeout = 600000) {
  try { return { ok: true, out: execSync(cmd, { cwd, encoding: 'utf8', timeout }).trim() }; }
  catch (e) { return { ok: false, error: e.message, stderr: e.stderr?.toString() }; }
}

export async function build({ cwd = process.cwd(), release = false } = {}) {
  return sh(`cargo build ${release ? '--release' : ''}`, cwd);
}

export async function test({ cwd = process.cwd() } = {}) {
  return sh('cargo test', cwd);
}

export async function clippy({ cwd = process.cwd(), strict = false } = {}) {
  return sh(`cargo clippy ${strict ? '-- -D warnings' : ''}`, cwd);
}

export async function fmt({ cwd = process.cwd(), check = false } = {}) {
  return sh(`cargo fmt ${check ? '-- --check' : ''}`, cwd);
}

export async function run({ cwd = process.cwd(), args = '' } = {}) {
  return sh(`cargo run ${args ? `-- ${args}` : ''}`, cwd);
}

export async function wasm_pack_build({ cwd = process.cwd(), target = 'web', release = true } = {}) {
  return sh(`wasm-pack build --target ${target} ${release ? '--release' : '--dev'}`, cwd, 900000);
}

export async function new_project({ name, kind = 'bin', cwd = process.cwd() } = {}) {
  if (!name) return { ok: false, error: 'name required' };
  return sh(`cargo new --${kind} ${name}`, cwd);
}

export async function rust_version() {
  return sh('rustc --version && cargo --version');
}

export async function update() {
  return sh('rustup update');
}

export async function add_dep({ cwd = process.cwd(), dep, features = '' } = {}) {
  if (!dep) return { ok: false, error: 'dep required' };
  return sh(`cargo add ${dep} ${features ? `--features ${features}` : ''}`, cwd);
}
