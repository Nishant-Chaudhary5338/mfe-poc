import { useEffect } from 'react';
import { Card, Button } from '@repo/shared-ui';

export default function Assets() {
  useEffect(() => {
    console.log('Assets route loaded');
  }, []);

  const assets = [
    { name: 'Brand Guidelines v3.pdf', type: 'PDF', size: '2.4 MB' },
    { name: 'Product Demo.mp4', type: 'Video', size: '148 MB' },
    { name: 'Logo Pack.zip', type: 'Archive', size: '12 MB' },
    { name: 'Campaign Photos.zip', type: 'Archive', size: '340 MB' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>Assets</h2>
        <Button>Upload Asset</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {assets.map((a) => (
          <Card key={a.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500, color: '#1e293b' }}>{a.name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{a.type} · {a.size}</div>
              </div>
              <Button variant="secondary">Download</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
