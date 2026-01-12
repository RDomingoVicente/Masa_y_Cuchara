'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>¡Gracias por tu pedido, Ricardo!</h1>
      <p>Tu pago ha sido procesado exitosamente.</p>
      {sessionId && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          <p style={{ fontSize: '12px' }}>Session ID:</p>
          <p style={{ fontSize: '10px', wordBreak: 'break-all' }}>{sessionId}</p>
        </div>
      )}
      <div style={{ marginTop: '30px' }}>
        <a href="/" style={{ 
          display: 'inline-block',
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px'
        }}>
          Volver al inicio
        </a>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
