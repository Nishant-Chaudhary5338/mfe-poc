import { useEffect } from 'react';
import { Button } from '@repo/shared-ui';

export default function Upload() {
  useEffect(() => {
    console.log('Upload route loaded');
  }, []);

  return (
    <div style={{ maxWidth: 500 }}>
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>Upload</h2>
      <div
        style={{
          border: '2px dashed #c4b5fd',
          borderRadius: 12,
          padding: 48,
          textAlign: 'center',
          background: '#faf5ff',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
        <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>Drop files here</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>or click to browse</div>
        <Button>Browse Files</Button>
      </div>
      <div style={{ fontSize: 13, color: '#64748b' }}>
        Supported formats: JPG, PNG, SVG, MP4, PDF, ZIP · Max size: 500 MB
      </div>
    </div>
  );
}
