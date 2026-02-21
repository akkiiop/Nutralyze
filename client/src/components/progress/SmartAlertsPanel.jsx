
import React, { useState } from 'react';
import { Box, Typography, Chip, Collapse, IconButton } from '@mui/material';
import { AutoAwesome, KeyboardArrowDown, KeyboardArrowUp, Warning, CheckCircle, Info } from '@mui/icons-material';

const SmartAlertsPanel = ({ advice = [] }) => {
    const [expanded, setExpanded] = useState(false);

    // Sort: Error > Warning > Info
    const sortedAdvice = [...advice].sort((a, b) => {
        const priority = { error: 3, warning: 2, success: 1, info: 0 };
        return priority[b.type] - priority[a.type];
    });

    const topAlerts = sortedAdvice.slice(0, 3);
    const hiddenAlerts = sortedAdvice.slice(3);

    if (advice.length === 0) return null;

    const getIcon = (type) => {
        if (type === 'error') return <Warning fontSize="small" />;
        if (type === 'success' || type === 'good') return <CheckCircle fontSize="small" />;
        return <Info fontSize="small" />;
    };

    const getColor = (type) => {
        if (type === 'error') return '#EF4444';
        if (type === 'warning') return '#F59E0B';
        if (type === 'success') return '#22C55E';
        return '#3B82F6';
    };

    const getBgColor = (type) => {
        if (type === 'error') return '#FEF2F2';
        if (type === 'warning') return '#FFFBEB';
        if (type === 'success') return '#F0FDF4';
        return '#EFF6FF';
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesome sx={{ color: "#8B5CF6", fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#64748B", textTransform: 'uppercase' }}>
                        Smart Insights
                    </Typography>
                </Box>
                {hiddenAlerts.length > 0 && (
                    <Box
                        onClick={() => setExpanded(!expanded)}
                        sx={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#64748B',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            '&:hover': { color: '#1E293B' }
                        }}
                    >
                        {expanded ? 'Show Less' : `View All (${advice.length})`}
                        {expanded ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
                    </Box>
                )}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {topAlerts.map((item, index) => (
                    <Chip
                        key={index}
                        icon={getIcon(item.type)}
                        label={item.text}
                        sx={{
                            bgcolor: getBgColor(item.type),
                            color: getColor(item.type),
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            height: 32,
                            border: `1px solid ${getBgColor(item.type)}`,
                            '& .MuiChip-icon': { color: 'inherit' }
                        }}
                    />
                ))}
            </Box>

            <Collapse in={expanded}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
                    {hiddenAlerts.map((item, index) => (
                        <Chip
                            key={`hidden-${index}`}
                            icon={getIcon(item.type)}
                            label={item.text}
                            sx={{
                                bgcolor: getBgColor(item.type),
                                color: getColor(item.type),
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                height: 32,
                                '& .MuiChip-icon': { color: 'inherit' }
                            }}
                        />
                    ))}
                </Box>
            </Collapse>
        </Box>
    );
};

export default SmartAlertsPanel;
