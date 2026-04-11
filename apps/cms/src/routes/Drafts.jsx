import { useEffect } from 'react';
import { Card, Button } from '@repo/shared-ui';

export default function Drafts() {
  useEffect(() => {
    console.log('Drafts route loaded');
  }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>Drafts</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Card title="React 19 Deep Dive">
          Last edited 2 hours ago · 1,240 words
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button>Continue Editing</Button>
            <Button variant="secondary">Preview</Button>
          </div>
        </Card>
        <Card title="Micro-Frontend Architecture Guide">
          Last edited yesterday · 890 words
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button>Continue Editing</Button>
            <Button variant="secondary">Preview</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
