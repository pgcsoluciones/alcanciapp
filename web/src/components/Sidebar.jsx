import React from 'react';
import {
    X, LayoutDashboard, Target, PlusCircle, Award,
    BarChart3, Users, Trophy, UserCircle, Settings, LogOut, HelpCircle
} from 'lucide-react';
import { ASSET } from '../lib/assets';

export default function Sidebar({ isOpen, onClose, onNavigate, user, onLogout }) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'activeGoals', label: 'Mis metas activas', icon: <Target size={20} /> },
        { id: 'selectGoal', label: 'Registrar aporte', icon: <PlusCircle size={20} /> },
        { id: 'achievements', label: 'Mis logros', icon: <Award size={20} /> },
        { id: 'goalLevels', label: 'Niveles por meta', icon: <BarChart3 size={20} /> },
        { id: 'circles', label: 'Círculos', icon: <Users size={20} /> },
        { id: 'challenges', label: 'Retos', icon: <Trophy size={20} /> },
        { id: 'coach', label: 'Invitar coach', icon: <HelpCircle size={20} /> },
        { id: 'profile', label: 'Mi perfil', icon: <UserCircle size={20} /> },
    ];

    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: isOpen ? 'block' : 'none',
        transition: 'opacity 0.3s ease',
    };

    const sidebarStyle = {
        position: 'fixed',
        top: 0,
        left: isOpen ? 0 : '-300px',
        width: '280px',
        height: '100%',
        backgroundColor: 'white',
        zIndex: 1001,
        transition: 'left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 12px rgba(0,0,0,0.1)',
    };

    const headerStyle = {
        padding: '24px 20px',
        borderBottom: '1px solid #F3F4F6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    };

    const userSectionStyle = {
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#F9FAFB',
    };

    const avatarStyle = {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: '#E5E7EB',
        objectFit: 'cover',
        border: '2px solid #10B981',
    };

    const navStyle = {
        flex: 1,
        overflowY: 'auto',
        padding: '12px 0',
    };

    const navItemStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 20px',
        color: '#4B5563',
        textDecoration: 'none',
        fontSize: '15px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background 0.2s',
    };

    const footerStyle = {
        padding: '20px',
        borderTop: '1px solid #F3F4F6',
    };

    return (
        <>
            <div style={overlayStyle} onClick={onClose} />
            <div style={sidebarStyle}>
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={ASSET.logo()} alt="Logo" style={{ height: '28px' }} />
                        <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Alcancía</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={userSectionStyle}>
                    <img
                        src={user?.avatar ? ASSET.mascot(user.avatar, 128) : ASSET.mascot('mascot_happy.png', 128)}
                        alt="Avatar"
                        style={avatarStyle}
                    />
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#111827' }}>{user?.name || 'Ahorrador'}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{user?.email || 'usuario@ejemplo.com'}</div>
                    </div>
                </div>

                <div style={navStyle}>
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            style={navItemStyle}
                            onClick={() => {
                                onNavigate(item.id);
                                onClose();
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                            {item.icon}
                            {item.label}
                        </div>
                    ))}
                </div>

                <div style={footerStyle}>
                    <div
                        style={{ ...navItemStyle, color: '#EF4444' }}
                        onClick={() => {
                            onLogout();
                            onClose();
                        }}
                    >
                        <LogOut size={20} />
                        Cerrar sesión
                    </div>
                </div>
            </div>
        </>
    );
}
