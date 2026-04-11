export default function Card({ title, children, style }) {
  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: 16,
        background: 'white',
        ...style,
      }}
    >
      {title && (
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#1e293b' }}>
          {title}
        </h3>
      )}
      <div style={{ color: '#475569', fontSize: 14 }}>{children}</div>
    </div>
  );
}
