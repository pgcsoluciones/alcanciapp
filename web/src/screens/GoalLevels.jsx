import React from 'react';
import { BarChart3, ArrowLeft } from 'lucide-react';

export default function GoalLevels({ onBack }) {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px 16px' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <button onClick={onBack} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px', cursor: 'pointer' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold' }}>Niveles por Meta</h1>
                </div>

                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '20px', border: '1px dashed #E5E7EB' }}>
                    <BarChart3 size={48} color="#D1D5DB" style={{ marginBottom: '16px' }} />
                    <p style={{ color: '#6B7280', fontSize: '15px' }}>Visualiza tu avance por niveles o etapas en cada una de tus metas.</p>
                </div>
            </div>
        </div>
    );
}
