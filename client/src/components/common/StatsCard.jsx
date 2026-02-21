
import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const StatsCard = ({ title, children, icon: Icon, action, height = 280 }) => {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: "#fff",
                border: "1px solid #E2E8F0",
                height: height,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {Icon && <Icon sx={{ color: '#64748B', fontSize: 20 }} />}
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1E293B", fontFamily: "'Rajdhani', sans-serif" }}>
                        {title}
                    </Typography>
                </Box>
                {action}
            </Box>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                {children}
            </Box>
        </Paper>
    );
};

export default StatsCard;
