export function StagingBanner() {
  if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'staging') return null;
  return (
    <div style={{
      background: '#f59e0b',
      color: '#000',
      textAlign: 'center',
      padding: '6px',
      fontSize: '13px',
      fontWeight: 600,
      letterSpacing: '0.05em',
    }}>
      AMBIENTE DE PRUEBA
    </div>
  );
}
