import { useEffect } from 'react';
import { Card, Button } from '@repo/shared-ui';

export default function Reports() {
  useEffect(() => {
    console.log('Reports route loaded');
  }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>Reports</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card title="Weekly QA Summary — Week 14">
          Coverage: 87% | Pass rate: 97.9% | New failures: 3
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary">Download PDF</Button>
          </div>
        </Card>
        <Card title="Sprint 22 Regression Report">
          All regression tests passed. Zero P0 defects.
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary">Download PDF</Button>
          </div>
        </Card>
        <Card title="Performance Baseline — April 2026">
          API p95 latency: 142ms | UI FCP: 1.2s
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary">Download PDF</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
