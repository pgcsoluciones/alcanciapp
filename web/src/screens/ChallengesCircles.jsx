import React from 'react';
import { Trophy, Users, ArrowLeft } from 'lucide-react';

export default function ChallengesCircles({ type = 'challenges', onBack }) {
    const isChallenges = type === 'challenges';

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px 16px' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <button onClick={onBack} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px', cursor: 'pointer' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold' }}>
                        {isChallenges ? 'Retos de Ahorro' : 'Círculos'}
                    </h1>
                </div>

                <div style={{ background: 'white', borderRadius: '20px', padding: '32px 24px', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', background: isChallenges ? '#FFFBEB' : '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        {isChallenges ? <Trophy size={40} color="#F59E0B" /> : <Users size={40} color="#10B981" />}
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
                        {isChallenges ? 'Competencia Sana' : 'Comunidad de Ahorro'}
                    </h2>
                    <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.6' }}>
                        {isChallenges
                            ? 'Únete a retos globales y compite con otros ahorradores para ganar insignias exclusivas.'
                            : 'Crea o únete a círculos de confianza para ahorrar en grupo y alcanzar metas comunes.'}
                    </p>

                    <div style={{ marginTop: '30px', padding: '16px', border: '1px solid #E5E7EB', borderRadius: '16px', backgroundColor: '#F9FAFB', color: '#6B7280', fontSize: '13px' }}>
                        Vistas de exploración. Lógica de red próximamente operativa.
                    </div>
                </div>
            </div>
        </div>
    );
}
