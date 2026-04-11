import { useEffect } from 'react';
import { Button } from '@repo/shared-ui';

export default function Compose() {
  useEffect(() => {
    console.log('Compose route loaded');
  }, []);

  const fieldStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box',
    fontFamily: 'system-ui, sans-serif',
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>Compose</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>To</label>
          <input style={fieldStyle} placeholder="recipient@example.com" />
        </div>
        <div>
          <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Message</label>
          <textarea style={{ ...fieldStyle, height: 120, resize: 'vertical' }} placeholder="Type your message..." />
        </div>
        <div>
          <Button>Send Message</Button>
        </div>
      </div>
    </div>
  );
}
