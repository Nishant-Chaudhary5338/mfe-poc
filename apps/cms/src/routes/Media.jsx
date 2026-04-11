import { useEffect } from 'react';
import { Card, Button } from '@repo/shared-ui';

export default function Media() {
  useEffect(() => {
    console.log('Media route loaded');
  }, []);

  const items = ['hero-image.png', 'product-demo.mp4', 'logo-dark.svg', 'banner-april.jpg'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>Media Library</h2>
        <Button>Upload</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {items.map((name) => (
          <Card key={name}>
            <div
              style={{
                height: 80,
                background: '#f1f5f9',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                color: '#94a3b8',
                fontSize: 24,
              }}
            >
              📄
            </div>
            <div style={{ fontSize: 13, color: '#475569' }}>{name}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
