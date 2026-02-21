
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import StatsCard from '../common/StatsCard';
import { Box } from '@mui/material';

const MacrosPieChart = ({ data }) => {
    // data expected: { protein: 120, carbs: 250, fat: 70 }

    const formattedData = [
        { name: 'Protein', value: data?.protein || 0, color: '#3B82F6' },
        { name: 'Carbs', value: data?.carbs || 0, color: '#F59E0B' },
        { name: 'Fats', value: data?.fats || 0, color: '#EF4444' },
    ];

    return (
        <StatsCard title="Macros Distribution">
            <Box sx={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={formattedData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {formattedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        </StatsCard>
    );
};

export default MacrosPieChart;
