import React, { useState } from 'react';
import { DollarSign, Plus } from 'lucide-react';

export default function ContributionForm({ onSubmit, isLoading }) {
    const [amount, setAmount] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return;
        onSubmit({ amount: Number(amount) });
        setAmount('');
    };

    return (
        <form onSubmit={handleSubmit} style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid #E5E7EB',
            marginTop: '24px'
        }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 16px 0', color: '#111827', fontWeight: 'bold' }}>Nuevo Aporte</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <DollarSign size={20} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Monto (RD$)"
                        required
                        min="1"
                        style={{
                            width: '100%',
                            padding: '16px 16px 16px 44px',
                            borderRadius: '12px',
                            border: '1px solid #E5E7EB',
                            fontSize: '18px',
                            fontWeight: '600',
                            boxSizing: 'border-box',
                            outline: 'none',
                            color: '#059669',
                            backgroundColor: '#F9FAFB',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#10B981'}
                        onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !amount}
                    style={{
                        backgroundColor: (isLoading || !amount) ? '#A7F3D0' : '#10B981',
                        color: (isLoading || !amount) ? '#065F46' : 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '16px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        cursor: (isLoading || !amount) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: (isLoading || !amount) ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.25)'
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = (isLoading || !amount) ? 'none' : 'scale(0.98)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Plus size={20} />
                    {isLoading ? 'Registrando...' : 'Aportar ahora'}
                </button>
            </div>
        </form>
    );
}
