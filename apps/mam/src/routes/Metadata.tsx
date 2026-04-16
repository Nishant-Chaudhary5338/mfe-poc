import type { CSSProperties } from 'react';

const COLOR = '#F4511E';

const field: CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid #D6D9E8', borderRadius: 8,
  fontSize: 13, boxSizing: 'border-box',
  fontFamily: "'DM Sans', sans-serif",
  color: '#1E2235', background: 'white',
  outline: 'none',
};

export default function Metadata() {
  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D1020', margin: 0 }}>Metadata Editor</h2>
        <p style={{ color: '#8C94B0', fontSize: 13, marginTop: 4 }}>Edit asset metadata before publishing to channels</p>
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #ECEEF5', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #F7F8FC' }}>
          <div style={{
            width: 80, height: 50, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, #F4511E 0%, #7C2006 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)',
          }}>4K UHD</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1E2235' }}>UEFA_Final_2025_RAW.mp4</div>
            <div style={{ fontSize: 12, color: '#8C94B0', marginTop: 2 }}>H.265 · 4K UHD · 2h 14m · 48.2 GB · Ingested 2025-06-10</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#636B8A', display: 'block', marginBottom: 6 }}>Title</label>
            <input style={field} defaultValue="UEFA Champions League Final 2025" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#636B8A', display: 'block', marginBottom: 6 }}>Description</label>
            <textarea style={{ ...field, height: 80, resize: 'vertical' }}
              defaultValue="Live coverage of the UEFA Champions League Final 2025. Full match recording with pre and post-match analysis." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#636B8A', display: 'block', marginBottom: 6 }}>Channel</label>
              <select style={field}>
                <option>Sports</option>
                <option>News</option>
                <option>Drama</option>
                <option>Entertainment</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#636B8A', display: 'block', marginBottom: 6 }}>Publish Date</label>
              <input style={field} type="date" defaultValue="2025-06-11" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#636B8A', display: 'block', marginBottom: 6 }}>Tags</label>
            <input style={field} defaultValue="football, UEFA, Champions League, live, sports, 2025" />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button style={{
              padding: '9px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: COLOR, color: 'white', border: 'none', cursor: 'pointer',
            }}>Save Metadata</button>
            <button style={{
              padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: '#F7F8FC', color: '#636B8A', border: '1.5px solid #D6D9E8', cursor: 'pointer',
            }}>Discard</button>
          </div>
        </div>
      </div>
    </div>
  );
}
