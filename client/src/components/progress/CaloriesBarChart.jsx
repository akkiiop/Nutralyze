
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import StatsCard from '../common/StatsCard';
import { Box } from '@mui/material';

const CaloriesBarChart = ({ data = [] }) => {
    // data expected: [{ date: 'Mon', calories: 2100, goal: 2000 }, ...]

    return (
        <StatsCard title="Weekly Calories">
            <Box sx={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barGap={0}>
                        <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            stroke="#94A3B8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => value ? value.slice(5) : ''}
                        />
                        <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }}
                        />
                        <Bar dataKey="calories" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.calories > (entry.goal || 2500) ? '#EF4444' : '#22C55E'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </StatsCard>
    );
};

export default CaloriesBarChart;
