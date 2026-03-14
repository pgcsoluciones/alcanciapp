import React, { useState } from 'react';
import { Camera, Save, ArrowLeft } from 'lucide-react';
import { ASSET, AVATAR_FILES } from '../lib/assets';
import { API_BASE_URL } from '../lib/config';

export default function Profile({ user, onSave, onBack }) {
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    // Bug fix: usar AVATAR_FILES (retratos) no MASCOT_FILES (mascotas)
    const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '1.png');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSave = async () => {
        setErrorMsg('');
        setIsSaving(true);
        try {
            const token = localStorage.getItem('alcanciapp:token');
            const res = await fetch(`${API_BASE_URL}/api/v1/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, email, avatar: selectedAvatar })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || 'Error al guardar perfil');
            // Actualizar contexto global + localStorage via prop
            onSave({ ...user, name, email, avatar: selectedAvatar });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const containerStyle = {
        minHeight: '100vh',
        backgroundColor: '#F9FAFB',
        padding: '24px 16px',
        boxSizing: 'border-box',
    };

    const cardStyle = {
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        maxWidth: '440px',
        margin: '0 auto',
    };

    const avatarContainerStyle = {
        position: 'relative',
        width: '100px',
        height: '100px',
        margin: '0 auto 24px',
    };

    const avatarStyle = {
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '3px solid #10B981',
    };

    const editIconStyle = {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#10B981',
        color: 'white',
        borderRadius: '50%',
        padding: '6px',
        cursor: 'pointer',
        border: '2px solid white',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: '8px',
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        fontSize: '16px',
        marginBottom: '20px',
        outline: 'none',
        transition: 'border-color 0.2s',
    };

    const btnSaveStyle = {
        width: '100%',
        padding: '14px',
        backgroundColor: '#10B981',
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        fontWeight: 'bold',
        fontSize: '16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '10px',
    };

    return (
        <div style={containerStyle}>
            <div style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button onClick={onBack} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: '#6B7280' }}>
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold' }}>Mi Perfil</h1>
            </div>

            <div style={cardStyle}>
                <div style={avatarContainerStyle} onClick={() => setShowAvatarPicker(true)}>
                    <img
                        src={ASSET.avatar(selectedAvatar, 256)}
                        alt="Avatar"
                        style={avatarStyle}
                    />
                    <div style={editIconStyle}>
                        <Camera size={16} />
                    </div>
                </div>

                {showAvatarPicker && (
                    <div style={{ marginBottom: '24px', border: '1.5px solid #A7F3D0', borderRadius: '16px', padding: '16px', background: '#F0FDF4' }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#059669', marginBottom: '12px' }}>Elige tu avatar:</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                            {AVATAR_FILES.map(file => (
                                <img
                                    key={file}
                                    src={ASSET.avatar(file, 128)}
                                    alt="Avatar"
                                    onClick={() => {
                                        setSelectedAvatar(file);
                                        setShowAvatarPicker(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        aspectRatio: '1/1',
                                        objectFit: 'cover',
                                        cursor: 'pointer',
                                        borderRadius: '50%',
                                        border: selectedAvatar === file ? '2px solid #10B981' : '1px solid #F3F4F6',
                                        padding: '2px'
                                    }}
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => setShowAvatarPicker(false)}
                            style={{ width: '100%', marginTop: '12px', padding: '12px', border: 'none', background: '#F3F4F6', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            Cancelar
                        </button>
                    </div>
                )}

                <div>
                    <label style={labelStyle}>Nombre completo</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jhon Doe"
                        style={inputStyle}
                    />

                    <label style={labelStyle}>Correo electrónico</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jhon@ejemplo.com"
                        style={inputStyle}
                    />

                    {success && (
                        <div style={{ backgroundColor: '#ECFDF5', color: '#065F46', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '14px', textAlign: 'center', fontWeight: '700' }}>
                            ✅ ¡Perfil actualizado correctamente!
                        </div>
                    )}

                    {errorMsg && (
                        <div style={{ backgroundColor: '#FEF2F2', color: '#DC2626', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', border: '1px solid #FCA5A5' }}>
                            {errorMsg}
                        </div>
                    )}

                    <button style={{ ...btnSaveStyle, opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }} onClick={handleSave} disabled={isSaving}>
                        <Save size={20} />
                        {isSaving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}
