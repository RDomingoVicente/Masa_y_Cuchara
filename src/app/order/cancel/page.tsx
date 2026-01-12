export default function OrderCancelPage() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>Pedido cancelado</h1>
      <p>No se ha realizado ningún cargo.</p>
      <p>Tu pedido ha sido cancelado y el stock ha sido liberado.</p>
      <div style={{ marginTop: '30px' }}>
        <a href="/" style={{ 
          display: 'inline-block',
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px',
          marginRight: '10px'
        }}>
          Volver al inicio
        </a>
        <a href="/menu" style={{ 
          display: 'inline-block',
          padding: '10px 20px',
          backgroundColor: 'white',
          color: '#0070f3',
          textDecoration: 'none',
          borderRadius: '5px',
          border: '2px solid #0070f3'
        }}>
          Ver el menú
        </a>
      </div>
    </div>
  );
}
