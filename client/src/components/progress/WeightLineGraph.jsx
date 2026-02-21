
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import StatsCard from '../common/StatsCard';
import { Box } from '@mui/material';

const WeightLineGraph = ({ data = [] }) => {
    // data expected: [{ date: '2023-10-01', weight: 75 }, ...]

    const hasData = data.some(d => d.weight > 0);

    return (
        <StatsCard title="Weight Trend">
            <Box sx={{ width: '100%', height: 220 }}>
                {!hasData ? (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                        No weight data yet
                    </Box>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis
                                dataKey="date"
                                stroke="#94A3B8"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value ? value.slice(5) : ''}
                                interval="preserveStartEnd"
                            />
                            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="weight"
                                stroke="#8B5CF6"
                                strokeWidth={3}
                                dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </Box>
        </StatsCard>
    );
};

export default WeightLineGraph;
