// Home page - TON Escrow MVP
'use client';

import React from 'react';

export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>TON Escrow MVP</h1>
      <p>Xavfsiz va ishonchli escrow xizmati TON blockchain'da</p>

      <div style={{ marginTop: '2rem' }}>
        <h2>Xususiyatlar:</h2>
        <ul>
          <li>✅ Ikki tomon o'rtasida xavfsiz escrow</li>
          <li>✅ Smart contract asosida avtomatik boshqaruv</li>
          <li>✅ TON wallet integratsiyasi</li>
          <li>✅ Real-time tranzaksiya monitoring</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button style={{
          padding: '1rem 2rem',
          fontSize: '1rem',
          backgroundColor: '#0088cc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          Walletni ulash
        </button>
      </div>
    </main>
  );
}
