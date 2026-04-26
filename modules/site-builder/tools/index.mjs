// site-builder tools — scaffold Vite React, Next.js, Tailwind, shadcn
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function sh(cmd, cwd = process.cwd(), timeout = 600000) {
  try { return { ok: true, out: execSync(cmd, { cwd, encoding: 'utf8', timeout }).trim() }; }
  catch (e) { return { ok: false, error: e.message, stderr: e.stderr?.toString() }; }
}

export async function vite_react({ name = 'my-app', cwd = process.cwd(), ts = true } = {}) {
  const template = ts ? 'react-ts' : 'react';
  const r = sh(`npm create vite@latest ${name} -- --template ${template} --yes`, cwd, 300000);
  if (!r.ok) return r;
  sh(`cd ${name} && npm install`, cwd, 300000);
  return { ok: true, name, path: join(cwd, name), template };
}

export async function next_app({ name = 'my-next-app', cwd = process.cwd() } = {}) {
  return sh(`npx create-next-app@latest ${name} --typescript --tailwind --app --eslint --src-dir --import-alias "@/*" --use-npm --yes`, cwd, 600000);
}

export async function add_tailwind({ cwd = process.cwd() } = {}) {
  const steps = [
    'npm install -D tailwindcss postcss autoprefixer',
    'npx tailwindcss init -p'
  ];
  for (const s of steps) {
    const r = sh(s, cwd, 120000);
    if (!r.ok) return r;
  }
  return { ok: true, cwd, installed: 'tailwindcss postcss autoprefixer' };
}

export async function add_shadcn({ cwd = process.cwd() } = {}) {
  return sh(`npx shadcn@latest init --yes`, cwd, 120000);
}

export async function dev_server({ cwd = process.cwd(), port = 3000 } = {}) {
  try {
    const pkg = join(cwd, 'package.json');
    if (!existsSync(pkg)) return { ok: false, error: 'no package.json' };
    execSync(`cd "${cwd}" && PORT=${port} npm run dev > /tmp/site-builder-${port}.log 2>&1 & disown`, { shell: '/bin/bash' });
    return { ok: true, cwd, port, log: `/tmp/site-builder-${port}.log`, url: `http://localhost:${port}` };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function create_component({ name, cwd = process.cwd(), framework = 'react' } = {}) {
  if (!name) return { ok: false, error: 'name required' };
  const dir = join(cwd, 'src', 'components');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${name}.tsx`);
  const body = `export interface ${name}Props {}\n\nexport function ${name}(_props: ${name}Props) {\n  return (\n    <div className="p-4 rounded-lg border">\n      <h2 className="text-lg font-semibold">${name}</h2>\n    </div>\n  );\n}\n`;
  writeFileSync(path, body);
  return { ok: true, path, name };
}
