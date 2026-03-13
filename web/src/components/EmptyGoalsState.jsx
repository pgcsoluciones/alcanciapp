import React from 'react';
import { Target, PlusCircle } from 'lucide-react';

export default function EmptyGoalsState({ onCreateClick }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid #E5E7EB',
            marginTop: '24px'
        }}>
            <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#ECFDF5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
            }}>
                <Target size={32} color="#10B981" />
            </div>

            <h3 style={{ fontSize: '18px', color: '#111827', margin: '0 0 8px 0', fontWeight: 'bold' }}>Ahorrar tiene propósito</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 28px 0', maxWidth: '280px', lineHeight: '1.5' }}>
                Crea tu primera meta y descubre lo fácil que es alcanzar tus objetivos paso a paso.
            </p>

            <button
                onClick={onCreateClick}
                style={{
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 24px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <PlusCircle size={20} />
                Crear mi primera meta
            </button>
        </div>
    );
}
