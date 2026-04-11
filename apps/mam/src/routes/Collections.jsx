import { useEffect } from 'react';
import { Card, Button } from '@repo/shared-ui';

export default function Collections() {
  useEffect(() => {
    console.log('Collections route loaded');
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>Collections</h2>
        <Button>New Collection</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <Card title="Brand Assets">
          24 items · Last updated Apr 9
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary">Open</Button>
          </div>
        </Card>
        <Card title="Campaign Q2 2026">
          67 items · Last updated Apr 10
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary">Open</Button>
          </div>
        </Card>
        <Card title="Product Screenshots">
          31 items · Last updated Apr 7
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary">Open</Button>
          </div>
        </Card>
        <Card title="Social Media">
          89 items · Last updated Apr 6
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary">Open</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
