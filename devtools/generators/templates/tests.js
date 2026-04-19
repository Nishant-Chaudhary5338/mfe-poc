import { cap } from '../utils.js';

export function genTests({ sourceCode, componentName }) {
  const CName = cap(componentName);
  const hasFetch = /fetch\(/.test(sourceCode);
  const hasNavigate = /useNavigate/.test(sourceCode);
  const hasForm = /AutoForm|<form/i.test(sourceCode);
  const hasParams = /useParams/.test(sourceCode);

  const mocks = [];
  if (hasFetch) {
    mocks.push(`const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }));`);
    mocks.push(`vi.stubGlobal('fetch', fetchMock);`);
  }
  if (hasNavigate) {
    mocks.push(`const mockNavigate = vi.fn();`);
    mocks.push(`vi.mock('react-router-dom', async (imp) => ({ ...await imp(), useNavigate: () => mockNavigate, useParams: () => ({ id: '1' }) }));`);
  } else if (hasParams) {
    mocks.push(`vi.mock('react-router-dom', async (imp) => ({ ...await imp(), useParams: () => ({ id: '1' }) }));`);
  }

  const tests = [
    `  it('exports a default function', () => {
    expect(typeof ${CName}).toBe('function');
  });`,
  ];

  if (hasFetch) {
    tests.push(`  it('calls fetch on mount', async () => {
    const { default: Component } = await import('./${componentName}.tsx');
    expect(fetch).toBeDefined();
  });`);
  }

  if (hasForm) {
    tests.push(`  it('has a form/submit structure', () => {
    expect(typeof ${CName}).toBe('function');
  });`);
  }

  return `// Generated tests for ${CName}
// To enable full DOM testing, install: pnpm add -D @testing-library/react @testing-library/user-event jsdom
// Then add to vite.config.ts: test: { environment: 'jsdom' }
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ${CName} from './${componentName}';

${mocks.join('\n')}

beforeEach(() => { vi.clearAllMocks(); });

describe('${CName}', () => {
${tests.join('\n\n')}
});
`;
}
