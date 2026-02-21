
import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import StatsCard from '../common/StatsCard';
import { Whatshot, Restaurant, Opacity } from '@mui/icons-material';

const StatRow = ({ icon: Icon, label, value, unit, color }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: `${color}15`, color: color }}>
                <Icon fontSize="small" />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
                {label}
            </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B' }}>
            {value}<span style={{ fontSize: '0.7em', color: '#94A3B8' }}>{unit}</span>
        </Typography>
    </Box>
);

const WeeklyAverage = ({ data = [] }) => {
    // 1. Consistency: Days with > 0 calories logged
    const loggedDays = data.filter(d => d.calories && d.calories > 0).length;

    // 2. Average Calories: Sum / Count(loggedDays)
    const totalCals = data.reduce((acc, d) => acc + (d.calories || 0), 0);
    const avgCals = loggedDays > 0 ? Math.round(totalCals / loggedDays) : 0;

    // 3. Average Weight: Sum / Count(validWeights)
    const validWeights = data.filter(d => d.weight && d.weight > 0).map(d => d.weight);
    const avgWeight = validWeights.length
        ? (validWeights.reduce((a, b) => a + b, 0) / validWeights.length).toFixed(1)
        : '--';

    // 4. Max consistnecy calculation (should be 7 or data.length in theory, likely 7 for this view)
    const totalDays = 7; // Assuming this component is mostly used in "Weekly" context or we want 7-day consistency score.
    // If logic needs to adapt to 30 days, we should pass 'days' prop or use data.length. 
    // Given the UI shows "/ 7", let's clamp it or strictly use 7 if data > 7?
    // User requested "unique_logged_days / 7".
    const viewConsistency = Math.min(loggedDays, 7);

    return (
        <StatsCard title="Weekly Average">
            <Box sx={{ mt: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <StatRow
                    icon={Whatshot}
                    label="Calories / Day"
                    value={avgCals}
                    unit=" kcal"
                    color="#F59E0B"
                />
                <StatRow
                    icon={Opacity} // Using opacity for weight just as a visual
                    label="Avg Weight"
                    value={avgWeight}
                    unit=" kg"
                    color="#3B82F6"
                />
                <Box sx={{ mt: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: 3, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                        Consistency
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#10B981' }}>
                        {/* Show actual logged days / 7 for weekly consistency */}
                        {loggedDays} / 7
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                        days logged this week
                    </Typography>
                </Box>
            </Box>
        </StatsCard>
    );
};

export default WeeklyAverage;
