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

    const planCode = String(user?.current_plan_code || 'free').toLowerCase();

    const getPlanLabel = (code) => {
        if (code === 'premium') return 'Premium';
        if (code === 'sponsored' || code === 'patrocinado') return 'Patrocinado';
        if (code === 'promo' || code === 'promocional') return 'Promocional';
        return 'Free';
    };

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

    const planBoxStyle = {
        backgroundColor: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '20px',
    };

    const planLabelStyle = {
        fontSize: '13px',
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: '6px',
    };

    const planValueStyle = {
        fontSize: '16px',
        fontWeight: '700',
        color: '#111827',
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

    const btnBackStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#10B981',
        marginBottom: '20px',
        cursor: 'pointer',
        fontWeight: '600',
    };

    return (
        <div style={containerStyle}>
            <div style={{ maxWidth: '440px', margin: '0 auto 16px' }}>
                <div style={btnBackStyle} onClick={onBack}>
                    <ArrowLeft size={18} />
                    Volver
                </div>
            </div>

            <div style={cardStyle}>
                <div style={avatarContainerStyle}>
                    <img
                        src={ASSET.avatar(selectedAvatar)}
                        alt="Avatar"
                        style={avatarStyle}
                    />
                    <div style={editIconStyle} onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
                        <Camera size={16} />
                    </div>
                </div>

                {showAvatarPicker && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px',
                        marginBottom: '20px'
                    }}>
                        {AVATAR_FILES.map((avatarFile) => (
                            <img
                                key={avatarFile}
                                src={ASSET.avatar(avatarFile)}
                                alt={avatarFile}
                                onClick={() => {
                                    setSelectedAvatar(avatarFile);
                                    setShowAvatarPicker(false);
                                }}
                                style={{
                                    width: '100%',
                                    borderRadius: '12px',
                                    border: selectedAvatar === avatarFile ? '3px solid #10B981' : '2px solid transparent',
                                    cursor: 'pointer'
                                }}
                            />
                        ))}
                    </div>
                )}

                <label style={labelStyle}>Nombre</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle}
                    placeholder="Tu nombre"
                />

                <label style={labelStyle}>Correo electrónico</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    placeholder="Tu correo"
                />

                <div style={planBoxStyle}>
                    <div style={planLabelStyle}>Plan actual</div>
                    <div style={planValueStyle}>{getPlanLabel(planCode)}</div>
                </div>

                {success && (
                    <div style={{
                        color: '#065F46',
                        backgroundColor: '#D1FAE5',
                        padding: '12px',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        fontSize: '14px'
                    }}>
                        Perfil actualizado correctamente.
                    </div>
                )}

                {errorMsg && (
                    <div style={{
                        color: '#991B1B',
                        backgroundColor: '#FEE2E2',
                        padding: '12px',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        fontSize: '14px'
                    }}>
                        {errorMsg}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    style={{
                        ...btnSaveStyle,
                        opacity: isSaving ? 0.7 : 1,
                        cursor: isSaving ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isSaving}
                >
                    <Save size={18} />
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </div>
        </div>
    );
}