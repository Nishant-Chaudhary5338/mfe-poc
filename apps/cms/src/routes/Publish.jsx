import { useEffect } from 'react';
import { Card, Button } from '@repo/shared-ui';

export default function Publish() {
  useEffect(() => {
    console.log('Publish route loaded');
  }, []);

  return (
    <div style={{ maxWidth: 500 }}>
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>Publish</h2>
      <Card title="Ready to Publish">
        <p style={{ marginTop: 0 }}>
          <strong>React 19 Deep Dive</strong> is ready for review.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#64748b' }}>
            Schedule for:
            <input
              type="datetime-local"
              style={{
                marginLeft: 8,
                padding: '6px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                fontSize: 13,
              }}
            />
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button>Publish Now</Button>
            <Button variant="secondary">Schedule</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
