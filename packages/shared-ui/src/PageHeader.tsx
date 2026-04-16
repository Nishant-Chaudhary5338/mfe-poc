interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'white' }}>{title}</h1>
      {subtitle && (
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
