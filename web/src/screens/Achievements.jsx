import React from 'react';
import { Award, ArrowLeft } from 'lucide-react';
import { ASSET, BADGE_FILES } from '../lib/assets';

export default function Achievements({ onBack }) {
    // Simulación de logros obtenidos
    const unlockedBadges = ['badge_first_goal.png', 'badge_saving_champion.png', 'badge_iron_streak.png'];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px 16px' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <button onClick={onBack} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px', cursor: 'pointer' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold' }}>Mis Logros</h1>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {BADGE_FILES.slice(0, 8).map(badge => {
                        const isUnlocked = unlockedBadges.includes(badge);
                        return (
                            <div key={badge} style={{
                                background: 'white',
                                borderRadius: '20px',
                                padding: '20px',
                                textAlign: 'center',
                                opacity: isUnlocked ? 1 : 0.4,
                                filter: isUnlocked ? 'none' : 'grayscale(1)',
                                border: isUnlocked ? '2px solid #F59E0B' : '1px solid #E5E7EB'
                            }}>
                                <img src={ASSET.badge(badge, 128)} alt="Insignia" style={{ width: '80px', marginBottom: '12px' }} />
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>
                                    {badge.replace('badge_', '').replace('.png', '').split('_').join(' ')}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
