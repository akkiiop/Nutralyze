
import React from 'react';
import { Chip } from '@mui/material';

const StatusBadge = ({ status, type = 'default' }) => {
    let color = 'default';
    let bgcolor = '#E2E8F0';
    let textColor = '#64748B';

    switch (type) {
        case 'success':
        case 'good':
            color = 'success';
            bgcolor = 'rgba(34, 197, 94, 0.1)';
            textColor = '#22C55E';
            break;
        case 'warning':
            color = 'warning';
            bgcolor = 'rgba(245, 158, 11, 0.1)';
            textColor = '#F59E0B';
            break;
        case 'error':
        case 'high':
            color = 'error';
            bgcolor = 'rgba(239, 68, 68, 0.1)';
            textColor = '#EF4444';
            break;
        default:
            break;
    }

    return (
        <Chip
            label={status}
            size="small"
            sx={{
                bgcolor: bgcolor,
                color: textColor,
                fontWeight: 700,
                borderRadius: '6px',
                border: `1px solid ${bgcolor}`
            }}
        />
    );
};

export default StatusBadge;
