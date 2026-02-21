import React from 'react';
import { Box, Typography, Button, Grid, Paper, Stack, Chip } from '@mui/material';
import { Add, ListAlt, LocalFireDepartment, Spa, Grain, Science } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import ProgressBar from '../common/ProgressBar';
import StatusBadge from '../common/StatusBadge';

const MetricCard = ({ label, value, max, unit, type = "info", icon: Icon }) => {
    // Determine status badge type
    let statusType = 'default';
    let statusText = 'Normal';

    if (label === "Sugar") {
        if (value > max) { statusType = 'error'; statusText = 'High'; }
        else { statusType = 'success'; statusText = 'Safe'; }
    } else {
        if (value < max * 0.7) { statusType = 'warning'; statusText = 'Low'; }
        else if (value >= max) { statusType = 'success'; statusText = 'Good'; }
    }

    // Determine progress bar color
    let barColor = type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#22C55E';
    if (label === 'Sugar' && value > max) barColor = '#EF4444';

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.6)",
                border: "1px solid #E2E8F0",
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                height: '100%'
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {Icon && <Icon sx={{ fontSize: 20, color: '#64748B' }} />}
                    <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {label}
                    </Typography>
                </Box>
                <StatusBadge status={statusText} type={statusType} />
            </Box>

            <Box sx={{ mt: 1 }}>
                <ProgressBar
                    value={value || 0}
                    max={max || 1}
                    color={barColor}
                    trackColor="#F1F5F9"
                />
            </Box>

            <Typography variant="body2" sx={{ textAlign: 'right', color: '#94A3B8', fontSize: '0.75rem', mt: -1 }}>
                {Math.round(value)}{unit} / {max}{unit}
            </Typography>
        </Paper>
    );
};

const TodaySummary = ({ data, goals }) => {
    const navigate = useNavigate();

    return (
        <Box sx={{ mb: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E293B", fontFamily: "'Rajdhani', sans-serif" }}>
                    🔥 TODAY'S STATUS
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B" }}>
                    How you are fueling today
                </Typography>
            </Stack>

            <Grid container spacing={2} mb={3}>
                <Grid item xs={6} sm={3}>
                    <MetricCard
                        label="Calories"
                        value={data.calories}
                        max={goals.calories}
                        unit=""
                        icon={LocalFireDepartment}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <MetricCard
                        label="Protein"
                        value={data.protein}
                        max={goals.protein}
                        unit="g"
                        icon={Science}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <MetricCard
                        label="Sugar"
                        value={data.sugar}
                        max={goals.sugar}
                        unit="g"
                        icon={Spa}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <MetricCard
                        label="Fiber"
                        value={data.fiber}
                        max={goals.fiber}
                        unit="g"
                        icon={Grain}
                    />
                </Grid>
            </Grid>

            {/* ACTION BUTTONS */}
            <Stack direction="row" spacing={2}>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/dashboard')}
                    sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: "#22C55E",
                        boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
                        flex: 1,
                        py: 1.5,
                        fontSize: '1rem'
                    }}
                >
                    Add Meal
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<ListAlt />}
                    onClick={() => navigate('/meal-log')}
                    sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 700,
                        borderColor: "#CBD5E1",
                        color: "#475569",
                        flex: 1,
                        py: 1.5,
                        fontSize: '1rem',
                        bgcolor: "#fff"
                    }}
                >
                    View Log
                </Button>
            </Stack>
        </Box>
    );
};

export default TodaySummary;
