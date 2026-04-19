import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const ROOT = new URL('../../', import.meta.url).pathname;

export function runReview({ appId }) {
  const appDir = join(ROOT, 'apps', appId);
  if (!existsSync(appDir)) return { error: `apps/${appId} not found` };

  const tsc = spawnSync('pnpm', ['--filter', appId, 'typecheck'], { cwd: ROOT, shell: true, encoding: 'utf8' });
  const tscOutput = (tsc.stdout || '') + (tsc.stderr || '');
  const tsErrors = (tscOutput.match(/error TS\d+/g) || []).length;

  const diff = spawnSync('git', ['diff', '--name-only', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
  const changedFiles = (diff.stdout || '').split('\n')
    .filter(f => f.startsWith(`apps/${appId}/`) && (f.endsWith('.tsx') || f.endsWith('.ts')));

  const issues = [];
  for (const file of changedFiles) {
    const fullPath = join(ROOT, file);
    if (!existsSync(fullPath)) continue;
    const src = readFileSync(fullPath, 'utf8');
    if (/<img(?![^>]*alt=)/i.test(src)) issues.push({ file, rule: 'a11y', severity: 'error', msg: '<img> missing alt attribute' });
    if (/\bany\b/.test(src)) issues.push({ file, rule: 'types', severity: 'warn', msg: 'Avoid `any` type' });
    if (/console\.log/.test(src)) issues.push({ file, rule: 'quality', severity: 'warn', msg: 'console.log left in code' });
  }

  const errors = issues.filter(i => i.severity === 'error').length + (tsErrors > 0 ? 1 : 0);
  const warns = issues.filter(i => i.severity === 'warn').length;
  const grade = errors === 0 && warns === 0 ? 'A'
    : errors === 0 && warns <= 2 ? 'B'
    : errors === 0 ? 'C'
    : errors === 1 ? 'D' : 'F';

  return { tsErrors, changedFiles, issues, tscOk: tsc.status === 0, grade };
}
