
import React, { useEffect, useState } from "react";
import { Box, Container, Typography, CircularProgress, Alert, Grid, Button, Stack } from "@mui/material";
import axiosInstance from "../config/axiosInstance";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from 'react-router-dom';
import { Add } from '@mui/icons-material';

// New Components
import TopSummaryStrip from "../components/progress/TopSummaryStrip";
import SmartAlertsPanel from "../components/progress/SmartAlertsPanel";
import WeightLineGraph from "../components/progress/WeightLineGraph";
import CaloriesBarChart from "../components/progress/CaloriesBarChart";
import MacroDonutChart from "../components/progress/MacroDonutChart";
import WeeklyAverage from "../components/progress/WeeklyAverage";
import "./Dashboard.css";

const Progress = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [timeRange, setTimeRange] = useState("7");
  const [data, setData] = useState({
    today: {},
    goals: {},
    advice: [],
    weekly: []
  });

  // Use local date to match MealLog/Backend storage (which usually expects YYYY-MM-DD from client)
  const todayDate = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        // 1. Get Daily Summary (Today)
        const dailyRes = await axiosInstance.get(`/progress/daily/${currentUser._id}/${todayDate}`);

        // 2. Get History (Variable Range)
        const historyRes = await axiosInstance.get(`/progress/history?days=${timeRange}`);

        if (dailyRes.data.success) {
          setData({
            today: dailyRes.data.today || {},
            goals: dailyRes.data.goals || {},
            advice: dailyRes.data.advice || [],
            weekly: historyRes.data.success ? historyRes.data.history : (dailyRes.data.weekly || [])
          });
        }
      } catch (err) {
        console.error("Progress Load Error:", err);
        setError("Failed to load your progress. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, todayDate, timeRange]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  const hasHistory = data.weekly?.some(item => (item.calories > 0 || item.weight > 0));
  const hasTodayData = data.today && (data.today.calories > 0 || data.today.protein > 0);

  return (
    <Box className="dash-page-root" sx={{ pt: 3, px: { xs: 2, md: 3 }, pb: 4, minHeight: '100vh' }}>
      <Container maxWidth="xl">

        {/* HEADER */}
        <Box mb={3} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" className="neon-text-green" sx={{ fontWeight: 800, fontFamily: "'Rajdhani', sans-serif" }}>
              YOUR PROGRESS
            </Typography>
          </Box>
          <Box>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#fff',
                color: '#475569',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* 1. TOP SUMMARY STRIP */}
        {hasTodayData ? (
          <TopSummaryStrip data={data.today} goals={data.goals} />
        ) : (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }} action={
            <Button color="inherit" size="small" onClick={() => navigate('/dashboard')}>
              Log Meal
            </Button>
          }>
            No data logged for today yet.
          </Alert>
        )}

        {/* 2. SMART ALERTS */}
        <SmartAlertsPanel advice={data.advice} />

        {/* 3. ANALYTICS GRID */}
        {(hasHistory || hasTodayData) ? (
          <Grid container spacing={3}>
            {/* Row 1 */}
            <Grid item xs={12} md={6} lg={6}>
              <WeightLineGraph data={data.weekly} />
            </Grid>
            <Grid item xs={12} md={6} lg={6}>
              <CaloriesBarChart data={data.weekly} />
            </Grid>

            {/* Row 2 */}
            <Grid item xs={12} md={6} lg={6}>
              <MacroDonutChart data={data.today} />
            </Grid>
            <Grid item xs={12} md={6} lg={6}>
              <WeeklyAverage data={data.weekly} />
            </Grid>
          </Grid>
        ) : (
          <Box sx={{
            textAlign: 'center',
            py: 8,
            bgcolor: '#F8FAFC',
            borderRadius: 4,
            border: '2px dashed #E2E8F0',
            mt: 2
          }}>
            <Typography variant="h6" sx={{ color: '#64748B', mb: 2 }}>
              No history available yet
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<Add />}
              onClick={() => navigate('/dashboard')}
              sx={{ borderRadius: 4, textTransform: 'none', fontWeight: 700 }}
            >
              Start Tracking Today
            </Button>
          </Box>
        )}

      </Container>
    </Box>
  );
};

export default Progress;
