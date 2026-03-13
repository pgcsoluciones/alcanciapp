import React from 'react';
import { ASSET } from '../lib/assets.js';

export function AuthCard({ title, subtitle, children, error, footerText, footerActionText, onFooterAction }) {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#F9FAFB', // Diseño financiero claro
            padding: '24px',
            boxSizing: 'border-box'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '32px 24px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                textAlign: 'center'
            }}>
                <img
                    src={ASSET.logo()}
                    alt="AlcanciApp Logo"
                    style={{ height: '80px', marginBottom: '16px' }}
                />
                <h1 style={{ fontSize: '24px', color: '#1a1a1a', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                    {title}
                </h1>
                <p style={{ color: '#666', fontSize: '14px', margin: '0 0 24px 0', lineHeight: '1.5' }}>
                    {subtitle}
                </p>

                {error && (
                    <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: '500' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    {children}
                </div>

                {footerText && (
                    <div style={{ marginTop: '24px', fontSize: '14px', color: '#666' }}>
                        {footerText}{' '}
                        <button
                            onClick={onFooterAction}
                            style={{ background: 'none', border: 'none', color: '#4CAF50', fontWeight: 'bold', cursor: 'pointer', padding: 0, fontSize: '14px' }}
                        >
                            {footerActionText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export function AuthInput({ label, type = 'text', value, onChange, placeholder, icon: Icon, required = false }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#444' }}>{label}</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {Icon && <Icon size={20} color="#888" style={{ position: 'absolute', left: '12px' }} />}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    style={{
                        width: '100%',
                        padding: `14px 14px 14px ${Icon ? '40px' : '14px'}`,
                        border: '1px solid #ddd',
                        borderRadius: '12px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        backgroundColor: '#fafafa'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#4CAF50'; e.target.style.backgroundColor = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.backgroundColor = '#fafafa'; }}
                />
            </div>
        </div>
    );
}

export function AuthButton({ children, type = 'submit', disabled = false, isLoading = false, onClick }) {
    return (
        <button
            type={type}
            disabled={disabled || isLoading}
            onClick={onClick}
            style={{
                width: '100%',
                padding: '16px',
                backgroundColor: disabled || isLoading ? '#A7F3D0' : '#10B981',
                color: disabled || isLoading ? '#065F46' : 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                marginTop: '8px',
                cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s, transform 0.1s',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '56px',
                boxShadow: disabled ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
            onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
            onMouseUp={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(1)'; }}
        >
            {isLoading ? 'Cargando...' : children}
        </button>
    );
}
