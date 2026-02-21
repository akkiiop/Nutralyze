
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import StatsCard from '../common/StatsCard';
import { Box, Typography } from '@mui/material';

const MacroDonutChart = ({ data }) => {
    const formattedData = [
        { name: 'Protein', value: data?.protein || 0, color: '#3B82F6' },
        { name: 'Carbs', value: data?.carbs || 0, color: '#F59E0B' },
        { name: 'Fats', value: data?.fats || 0, color: '#EF4444' },
    ];

    const total = formattedData.reduce((acc, cur) => acc + cur.value, 0);

    const totalMacroCalories = Math.round(
        (data?.protein || 0) * 4 +
        (data?.carbs || 0) * 4 +
        (data?.fats || 0) * 9
    );

    return (
        <StatsCard title="Macro Distribution">
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minHeight: 0 }}>
                    {/* 1. Chart - 55% Width */}
                    <Box sx={{ width: '55%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={formattedData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={60}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {formattedData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>

                    {/* 2. Custom Legend - 45% Width */}
                    <Box sx={{ width: '45%', pl: 1 }}>
                        {formattedData.map((item) => (
                            <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Box
                                    sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        bgcolor: item.color,
                                        mr: 1,
                                        flexShrink: 0
                                    }}
                                />
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', lineHeight: 1 }}>
                                        {item.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 700, lineHeight: 1.2 }}>
                                        {Math.round(item.value)}g
                                        <span style={{ fontSize: '0.7em', color: '#94A3B8', marginLeft: '4px' }}>
                                            {total > 0 ? `(${Math.round(item.value / total * 100)}%)` : ''}
                                        </span>
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* 3. Total Calories from Macros */}
                <Box sx={{ textAlign: 'center', mt: 1, pt: 1, borderTop: '1px dashed #E2E8F0' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                        ≈ {totalMacroCalories} kcal from macros
                    </Typography>
                </Box>
            </Box>
        </StatsCard>
    );
};

export default MacroDonutChart;
