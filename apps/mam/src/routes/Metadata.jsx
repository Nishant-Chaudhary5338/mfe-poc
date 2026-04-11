import { useEffect } from 'react';
import { Card, Button } from '@repo/shared-ui';

export default function Metadata() {
  useEffect(() => {
    console.log('Metadata route loaded');
  }, []);

  const fieldStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    fontSize: 13,
    boxSizing: 'border-box',
    fontFamily: 'system-ui, sans-serif',
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>Metadata Editor</h2>
      <Card title="Brand Guidelines v3.pdf">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 3 }}>Title</label>
            <input style={fieldStyle} defaultValue="Brand Guidelines v3" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 3 }}>Description</label>
            <textarea style={{ ...fieldStyle, height: 80, resize: 'vertical' }} defaultValue="Official brand guidelines for Q2 2026." />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 3 }}>Tags</label>
            <input style={fieldStyle} defaultValue="brand, guidelines, 2026" />
          </div>
          <div style={{ marginTop: 4 }}>
            <Button>Save Metadata</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
