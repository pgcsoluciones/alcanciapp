import React from 'react';

const GoalTypeCard = ({ title, imageSrc, isSelected, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                margin: '8px',
                backgroundColor: isSelected ? 'rgba(76, 175, 80, 0.15)' : 'white',
                border: isSelected ? '2px solid #4CAF50' : '2px solid transparent',
                borderRadius: '20px',
                boxShadow: isSelected ? '0 0 15px rgba(76, 175, 80, 0.6)' : '0 6px 12px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                width: '100%',
                maxWidth: '160px',
                aspectRatio: '1',
                boxSizing: 'border-box'
            }}
        >
            <div style={{ width: '74px', height: '74px', marginBottom: '12px' }}>
                <img
                    src={imageSrc}
                    alt={title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            </div>
            <span style={{
                fontSize: '15px',
                fontWeight: isSelected ? 'bold' : 'normal',
                color: isSelected ? '#4CAF50' : '#444',
                textAlign: 'center'
            }}>
                {title}
            </span>
        </div>
    );
};

export default GoalTypeCard;
