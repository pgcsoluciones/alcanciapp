import React from 'react';
import { ASSET } from '../lib/assets.js';

const GoalTypeCard = ({ title, imageSrc, isSelected, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 12px',
                margin: '0',
                backgroundImage: `url('${ASSET.ui.panelSquareGold()}')`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent',
                // El asset de la tarjeta ya trae contornos, usamos CSS drop-shadow en vez de borders / box-shadows flat
                filter: isSelected ? 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.8))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                width: '100%',
                maxWidth: '180px',
                aspectRatio: '0.85', // Ajustar el ratio al del "panel_square_gold" para que no se deforme
                boxSizing: 'border-box',
                transform: isSelected ? 'scale(1.02)' : 'none'
            }}
        >
            {/* Ícono Meta */}
            <div style={{ width: '85px', height: '85px', marginBottom: '8px', filter: 'drop-shadow(0px 8px 8px rgba(0,0,0,0.4))' }}>
                <img
                    src={imageSrc}
                    alt={title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            </div>

            {/* Título */}
            <span style={{
                fontSize: '17px',
                fontWeight: '900',
                color: isSelected ? '#A06000' : '#444',
                textShadow: isSelected ? '0px 1px 2px rgba(255,255,255,0.8)' : 'none',
                textAlign: 'center',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                {title}
            </span>
        </div>
    );
};

export default GoalTypeCard;
