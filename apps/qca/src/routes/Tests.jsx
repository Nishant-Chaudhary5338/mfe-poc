import { useEffect } from 'react';
import { Card, Button } from '@repo/shared-ui';

export default function Tests() {
  useEffect(() => {
    console.log('Tests route loaded');
  }, []);

  const tests = [
    { name: 'Auth flow — login', status: 'passed' },
    { name: 'Auth flow — logout', status: 'passed' },
    { name: 'Product listing — pagination', status: 'failed' },
    { name: 'Checkout — payment validation', status: 'passed' },
    { name: 'Search — empty results', status: 'pending' },
  ];

  const statusColor = { passed: '#16a34a', failed: '#dc2626', pending: '#d97706' };

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>Tests</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tests.map((t) => (
          <Card key={t.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>{t.name}</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: statusColor[t.status],
                  textTransform: 'uppercase',
                }}
              >
                {t.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <Button>Run All Tests</Button>
      </div>
    </div>
  );
}
