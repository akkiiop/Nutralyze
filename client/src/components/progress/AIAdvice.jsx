import React from 'react';
import { Box, Typography, Stack, Alert, AlertTitle } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';

const AIAdvice = ({ advice = [] }) => {
    return (
        <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" gap={1} mb={2}>
                <AutoAwesome sx={{ color: "#8B5CF6" }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B", fontFamily: "'Rajdhani', sans-serif" }}>
                    AI HEALTH COACH
                </Typography>
            </Stack>

            <Stack spacing={2}>
                {advice.length > 0 ? (
                    advice.map((item, index) => (
                        <Alert
                            key={index}
                            severity={item.type || "info"}
                            variant="filled"
                            sx={{
                                borderRadius: 3,
                                fontWeight: 600,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                color: "#fff",
                                // Custom colors to match theme better
                                ...(item.type === "success" && { bgcolor: "#22C55E" }),
                                ...(item.type === "warning" && { bgcolor: "#F59E0B" }),
                                ...(item.type === "error" && { bgcolor: "#EF4444" }),
                                ...(item.type === "info" && { bgcolor: "#3B82F6" }),
                            }}
                        >
                            {item.text}
                        </Alert>
                    ))
                ) : (
                    <Alert severity="info" sx={{ borderRadius: 3 }}>
                        No enough data yet. Log some meals to get advice!
                    </Alert>
                )}
            </Stack>
        </Box>
    );
};

export default AIAdvice;
