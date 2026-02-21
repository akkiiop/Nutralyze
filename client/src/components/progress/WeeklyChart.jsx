import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const WeeklyChart = ({ data = [] }) => {
    const chartData = {
        labels: data.map(d => d.date.slice(5)), // MM-DD
        datasets: [
            {
                label: 'Calories',
                data: data.map(d => d.calories),
                backgroundColor: 'rgba(34, 197, 94, 0.6)', // Green
                borderRadius: 4,
                barThickness: 20,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#1E293B',
                padding: 10,
                cornerRadius: 8,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#64748B' }
            },
            y: {
                grid: { color: '#E2E8F0', borderDash: [5, 5] },
                ticks: { color: '#64748B' },
                beginAtZero: true
            }
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 4,
                bgcolor: "#fff",
                border: "1px solid #E2E8F0",
                mt: 4
            }}
        >
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B", fontFamily: "'Rajdhani', sans-serif", mb: 2 }}>
                📊 WEEKLY TREND
            </Typography>

            <Box sx={{ height: 250 }}>
                {data.length > 0 ? (
                    <Bar data={chartData} options={options} />
                ) : (
                    <Typography sx={{ color: "#94A3B8", textAlign: 'center', mt: 10 }}>
                        No data available for this week.
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

export default WeeklyChart;
