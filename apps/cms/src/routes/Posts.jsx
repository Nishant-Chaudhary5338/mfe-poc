import { useEffect } from 'react';
import { Card, Button } from '@repo/shared-ui';

export default function Posts() {
  useEffect(() => {
    console.log('Posts route loaded');
  }, []);

  const posts = [
    { title: 'Introducing Module Federation', status: 'Published', date: 'Apr 10, 2026' },
    { title: 'Turborepo Best Practices', status: 'Published', date: 'Apr 8, 2026' },
    { title: 'React 19 Deep Dive', status: 'Draft', date: 'Apr 5, 2026' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>Posts</h2>
        <Button>New Post</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {posts.map((p) => (
          <Card key={p.title}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.date}</div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: p.status === 'Published' ? '#16a34a' : '#d97706',
                }}
              >
                {p.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
