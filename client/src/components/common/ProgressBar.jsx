
import React from 'react';
import { Box, Typography, LinearProgress, linearProgressClasses, styled } from '@mui/material';

const BorderLinearProgress = styled(LinearProgress)(({ theme, barcolor, trackcolor }) => ({
    height: 10,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: trackcolor || theme.palette.grey[200],
    },
    [`& .${linearProgressClasses.bar}`]: {
        borderRadius: 5,
        backgroundColor: barcolor || theme.palette.primary.main,
    },
}));

const ProgressBar = ({ value, max, label, color, trackColor }) => {
    const percentage = Math.min((value / max) * 100, 100);

    return (
        <Box sx={{ width: '100%', mb: 2 }}>
            {label && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                        {Math.round(value)} / {max}
                    </Typography>
                </Box>
            )}
            <BorderLinearProgress
                variant="determinate"
                value={percentage}
                barcolor={color}
                trackcolor={trackColor}
            />
        </Box>
    );
};

export default ProgressBar;
