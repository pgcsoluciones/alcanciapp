import {
    X, LayoutDashboard, Target, PlusCircle, Award,
    BarChart3, Users, Trophy, UserCircle, LogOut,
    HelpCircle, Archive
} from 'lucide-react';
import { ASSET } from '../lib/assets';

export default function Sidebar({ isOpen, onClose, onNavigate, user, onLogout }) {
    const menuItems = [
        { id: 'dashboard', label: 'Mi panel', icon: <LayoutDashboard size={20} /> },
        { id: 'registrarAporte', label: 'Registrar aporte', icon: <PlusCircle size={20} /> },
        { id: 'activeGoals', label: 'Mis metas activas', icon: <Target size={20} /> },
        { id: 'archivedGoals', label: 'Metas archivadas', icon: <Archive size={20} /> },
        { id: 'selectGoal', label: 'Nueva meta', icon: <PlusCircle size={20} /> },
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
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: isOpen ? 'block' : 'none',
        transition: 'opacity 0.3s ease',
    };

    const sidebarStyle = {
        position: 'fixed',
        top: 0,
        left: isOpen ? 0 : '-300px',
        width: '285px',
        height: '100%',
        backgroundColor: 'white',
        zIndex: 1001,
        transition: 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '10px 0 40px rgba(0,0,0,0.1)',
        borderRadius: '0 24px 24px 0',
    };

    const headerStyle = {
        padding: '30px 20px',
        borderBottom: '1px solid #F3F4F6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    };

    const userSectionStyle = {
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        background: 'linear-gradient(to right, #F9FAFB, white)',
        borderBottom: '1px solid #F3F4F6',
    };

    const avatarStyle = {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: 'white',
        objectFit: 'contain',
        border: '3px solid #10B981',
        padding: '3px',
    };

    const navStyle = {
        flex: 1,
        overflowY: 'auto',
        padding: '16px 0',
    };

    const navItemStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 24px',
        color: '#4B5563',
        textDecoration: 'none',
        fontSize: '15.5px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
    };

    const footerStyle = {
        padding: '24px',
        borderTop: '1px solid #F3F4F6',
    };

    return (
        <>
            <div style={overlayStyle} onClick={onClose} />
            <div style={sidebarStyle}>
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={ASSET.logo()} alt="Logo" style={{ height: '42px', width: 'auto' }} />
                        <span style={{ fontWeight: '900', fontSize: '22px', color: '#10B981', letterSpacing: '-0.03em' }}>
                            AlcanciApp
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#F9FAFB',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '10px',
                            cursor: 'pointer',
                            color: '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={userSectionStyle}>
                    <img
                        src={user?.avatar ? ASSET.avatar(user.avatar, 128) : ASSET.avatar('1.png', 128)}
                        alt="Avatar"
                        style={avatarStyle}
                    />
                    <div style={{ overflow: 'hidden' }}>
                        <div
                            style={{
                                fontWeight: '800',
                                fontSize: '17px',
                                color: '#111827',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {user?.name || 'Ahorrador'}
                        </div>
                        <div
                            style={{
                                fontSize: '12px',
                                color: '#9CA3AF',
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {user?.email || 'usuario@ejemplo.com'}
                        </div>
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
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F0FDF4';
                                e.currentTarget.style.color = '#10B981';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#4B5563';
                            }}
                        >
                            <span style={{ opacity: 0.9 }}>{item.icon}</span>
                            {item.label}
                        </div>
                    ))}
                </div>

                <div style={footerStyle}>
                    <div
                        style={{ ...navItemStyle, color: '#EF4444', padding: '14px 20px', borderRadius: '16px' }}
                        onClick={() => {
                            onLogout();
                            onClose();
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <LogOut size={20} />
                        Cerrar sesión
                    </div>
                </div>
            </div>
        </>
    );
}