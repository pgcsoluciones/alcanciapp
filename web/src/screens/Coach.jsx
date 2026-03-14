import React from 'react';
import { HelpCircle, ArrowLeft, UserPlus } from 'lucide-react';

export default function Coach({ onBack }) {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px 16px' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <button onClick={onBack} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px', cursor: 'pointer' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold' }}>Invitar Coach</h1>
                </div>

                <div style={{ background: 'white', borderRadius: '20px', padding: '32px 24px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: '80px', height: '80px', background: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <HelpCircle size={40} color="#3B82F6" />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>¿Necesitas un impulso?</h2>
                    <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                        Un coach o motivador puede ver tu progreso y enviarte recordatorios para que no pierdas el ritmo.
                    </p>

                    <button style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'not-allowed',
                        opacity: 0.7
                    }}>
                        <UserPlus size={20} />
                        Próximamente
                    </button>

                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '16px' }}>
                        Esta funcionalidad está siendo preparada para la versión 1.2
                    </p>
                </div>
            </div>
        </div>
    );
}
