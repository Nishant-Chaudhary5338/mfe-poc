import { useEffect } from 'react';
import { Card, Button } from '@repo/shared-ui';

export default function Dashboard() {
  useEffect(() => {
    console.log('Dashboard route loaded');
  }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <Card title="Tests Passed">
          <span style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>142</span>
        </Card>
        <Card title="Tests Failed">
          <span style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>3</span>
        </Card>
        <Card title="Pending Review">
          <span style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>17</span>
        </Card>
      </div>
      <Card title="Recent Activity">
        All critical path tests passing. 3 flaky tests flagged for investigation.
        <div style={{ marginTop: 12 }}>
          <Button>View Full Report</Button>
        </div>
      </Card>
    </div>
  );
}
