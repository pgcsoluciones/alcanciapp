import React from 'react';

const GoalTypeCard = ({ title, Icon, isSelected, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 8px',
                backgroundColor: isSelected ? '#ECFDF5' : 'white',
                border: `2px solid ${isSelected ? '#10B981' : 'transparent'}`,
                borderRadius: '16px',
                boxShadow: isSelected ? '0 4px 12px rgba(16,185,129,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                aspectRatio: '1',
                boxSizing: 'border-box',
                transform: isSelected ? 'translateY(-2px)' : 'none'
            }}
        >
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Icon && <Icon size={32} color={isSelected ? '#10B981' : '#6B7280'} />}
            </div>
            <span style={{
                fontSize: '13px',
                fontWeight: '600',
                color: isSelected ? '#065F46' : '#4B5563',
                textAlign: 'center'
            }}>
                {title}
            </span>
        </div>
    );
};

export default GoalTypeCard;
