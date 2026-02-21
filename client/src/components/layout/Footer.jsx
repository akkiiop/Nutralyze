import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Container, Grid, Typography, Stack, Divider } from '@mui/material';
import './Footer.css';

const Footer = () => {
    const location = useLocation();
    const isLanding = location.pathname === '/';
    const isDashboard = location.pathname === '/dashboard';

    // STRICT VISIBILITY: Only show on Landing Page
    if (!isLanding) return null;

    // Compact Footer (Dashboard Only)
    if (isDashboard) {
        return (
            <Box component="footer" className="academic-footer compact">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography className="af-brand" sx={{ fontSize: '1.2rem' }}>
                        NUTRALYZE
                    </Typography>
                    <Typography className="af-badge" sx={{ mt: 0 }}>
                        Final Year Engineering Project
                    </Typography>
                </Box>
            </Box>
        );
    }

    // Full Footer (Landing Page)
    return (
        <Box component="footer" className="academic-footer">
            <Container maxWidth="xl" sx={{ p: '0 !important' }}>
                <Grid container spacing={6}>

                    {/* LEFT COLUMN: Brand Identity */}
                    <Grid item xs={12} md={4}>
                        <Typography className="af-brand">
                            NUTRALYZE
                        </Typography>
                        <Typography className="af-subtitle">
                            AI-Powered Nutrition & Food Safety Platform
                        </Typography>
                        <Box className="af-badge">
                            Final Year Engineering Project
                        </Box>
                    </Grid>

                    {/* CENTER COLUMN: Project Team */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Typography className="af-heading">
                            Project Team
                        </Typography>
                        <Typography className="af-text" sx={{ fontWeight: 600 }}>
                            Nutralyze Development Group
                        </Typography>
                        <Typography className="af-text">
                            BE Computer Engineering
                        </Typography>
                        <Typography className="af-text">
                            Batch 2025–2026
                        </Typography>
                        <Typography className="af-guide">
                            Under Guidance: Dr. N. B. Vikhe
                        </Typography>
                    </Grid>

                    {/* RIGHT COLUMN: Data & Disclaimer */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Typography className="af-heading">
                            Data Sources & Disclaimer
                        </Typography>
                        <Typography className="af-text">
                            Powered by Open Food Facts, WHO databases, and AI-based nutrition estimation.
                        </Typography>
                        <Typography className="af-disclaimer">
                            For educational use only. Not medical advice.
                        </Typography>
                    </Grid>

                </Grid>
            </Container>
        </Box>
    );
};

export default Footer;
