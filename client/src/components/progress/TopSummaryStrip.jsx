
import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { LocalFireDepartment, Spa, Grain, Science } from '@mui/icons-material';
import StatusBadge from '../common/StatusBadge';

const KPICard = ({ label, value, max, unit, status, type, icon: Icon }) => {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: "#fff",
                border: "1px solid #E2E8F0",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '100%'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: type === 'error' ? '#FEF2F2' : type === 'warning' ? '#FFFBEB' : '#F0FDF4',
                    color: type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#16A34A'
                }}>
                    {Icon && <Icon sx={{ fontSize: 20 }} />}
                </Box>
                <Box>
                    <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {label}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: "#1E293B", lineHeight: 1.2 }}>
                        {value}<span style={{ fontSize: '0.75em', color: '#94A3B8', fontWeight: 600 }}>/{max}{unit}</span>
                    </Typography>
                </Box>
            </Box>

            {status && <StatusBadge status={status} type={type} />}
        </Paper>
    );
};

const TopSummaryStrip = ({ data, goals }) => {
    // Helper to determine status
    const getStatus = (val, target, isLimit = false) => {
        if (isLimit) {
            if (val > target) return { label: 'High', type: 'error' };
            return { label: 'Safe', type: 'success' };
        }
        if (val < target * 0.7) return { label: 'Low', type: 'warning' };
        if (val >= target) return { label: 'Good', type: 'success' };
        return { label: 'On Track', type: 'good' };
    };

    const caloriesStatus = getStatus(data.calories, goals.calories, true); // Treating calorie goal as limit for simplicity or modify logic
    const proteinStatus = getStatus(data.protein, goals.protein);
    const sugarStatus = getStatus(data.sugar, goals.sugar, true);
    const fiberStatus = getStatus(data.fiber, goals.fiber);

    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
                <KPICard
                    label="Calories"
                    value={Math.round(data.calories || 0)}
                    max={goals.calories}
                    unit=""
                    icon={LocalFireDepartment}
                    type={data.calories > goals.calories ? 'error' : 'good'}
                />
            </Grid>
            <Grid item xs={6} md={3}>
                <KPICard
                    label="Protein"
                    value={Math.round(data.protein || 0)}
                    max={goals.protein}
                    unit="g"
                    icon={Science}
                    status={proteinStatus.label}
                    type={proteinStatus.type}
                />
            </Grid>
            <Grid item xs={6} md={3}>
                <KPICard
                    label="Sugar"
                    value={Math.round(data.sugar || 0)}
                    max={goals.sugar}
                    unit="g"
                    icon={Spa}
                    status={sugarStatus.label}
                    type={sugarStatus.type}
                />
            </Grid>
            <Grid item xs={6} md={3}>
                <KPICard
                    label="Fiber"
                    value={Math.round(data.fiber || 0)}
                    max={goals.fiber}
                    unit="g"
                    icon={Grain}
                    status={fiberStatus.label}
                    type={fiberStatus.type}
                />
            </Grid>
        </Grid>
    );
};

export default TopSummaryStrip;
