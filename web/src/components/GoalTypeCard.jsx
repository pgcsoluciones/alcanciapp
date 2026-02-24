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
                padding: '12px',
                margin: '6px',
                backgroundColor: isSelected ? 'rgba(76, 175, 80, 0.1)' : 'white',
                border: isSelected ? '2px solid #4CAF50' : '2px solid transparent',
                borderRadius: '16px',
                boxShadow: isSelected ? '0 0 10px rgba(76, 175, 80, 0.5)' : '0 4px 6px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                width: '100%',
                maxWidth: '140px',
                aspectRatio: '1',
                boxSizing: 'border-box'
            }}
        >
            <div style={{ width: '64px', height: '64px', marginBottom: '8px' }}>
                <img
                    src={imageSrc}
                    alt={title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            </div>
            <span style={{
                fontSize: '14px',
                fontWeight: isSelected ? 'bold' : 'normal',
                color: isSelected ? '#4CAF50' : '#333',
                textAlign: 'center'
            }}>
                {title}
            </span>
        </div>
    );
};

export default GoalTypeCard;
