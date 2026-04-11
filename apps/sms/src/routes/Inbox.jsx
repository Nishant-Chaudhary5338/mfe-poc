import { useEffect } from 'react';
import { Card, Button } from '@repo/shared-ui';

export default function Inbox() {
  useEffect(() => {
    console.log('Inbox route loaded');
  }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>Inbox</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card title="Alice Johnson">
          Hey, are we still on for the sync tomorrow at 2pm?
          <div style={{ marginTop: 12 }}>
            <Button>Reply</Button>
          </div>
        </Card>
        <Card title="Bob Martinez">
          Please review the attached Q3 report when you get a chance.
          <div style={{ marginTop: 12 }}>
            <Button>Reply</Button>
          </div>
        </Card>
        <Card title="Carol Lee">
          The deployment went smoothly. All systems are green.
          <div style={{ marginTop: 12 }}>
            <Button>Reply</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
