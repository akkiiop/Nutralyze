import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Box,
  Container,
  Typography,
  Grid,
  Divider,
  Button,
  Stack,
  LinearProgress,
  Card,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";

import {
  AutoAwesome,
  Refresh,
  RestaurantMenu,
  Timeline as TimelineIcon,
  Insights as InsightsIcon,
} from "@mui/icons-material";

import { useAuth } from "../contexts/AuthContext";
import axiosInstance from "../config/axiosInstance";

import "./DietPlan.css"; // Import the standardized Fresh Market styling

/** ✅ ADAPTIVE MACRO GAUGE (SAFE) */
const MacroGauge = ({ label, remaining = 0, target = 0, unit = "", color }) => {
  const safeTarget = Number(target) > 0 ? Number(target) : 1;
  const safeRemaining = Math.max(0, Number(remaining) || 0);

  // remaining% of target
  const percentage = Math.min(100, Math.max(0, (safeRemaining / safeTarget) * 100));

  return (
    <Box className="macro-gauge-container">
      <Box sx={{ mb: 1 }}>
        <Typography variant="caption" className="macro-label" sx={{ color: "black", fontWeight: "bold" }}>
          {label}
        </Typography>
        <Typography variant="caption" className="macro-value-sub" sx={{ color: "black" }}>
          {Math.round(safeRemaining)} {unit} remaining
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={percentage}
        className="linear-progress-track"
        sx={{
          "& .MuiLinearProgress-bar": { bgcolor: color },
        }}
      />
    </Box>
  );
};

const formatEngine = (engine) => {
  const map = {
    ai: "AI",
    rule: "RULE",
    ai_adaptive: "AI ADAPTIVE",
    system_fallback: "FALLBACK",
  };
  return map[engine] || "UNKNOWN";
};

const DietPlan = () => {
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [dietPlan, setDietPlan] = useState(null);

  const fetchLatestPlan = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axiosInstance.get("/diet/latest");
      if (res.data?.success) setDietPlan(res.data?.dietPlan || null);
    } catch (err) {
      setError("Sync failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const generateNewPlan = useCallback(async () => {
    setError("");
    setGenerating(true);
    try {
      const res = await axiosInstance.post("/diet/generate");
      if (res.data?.success) setDietPlan(res.data.dietPlan);
    } catch (err) {
      setError("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, []);

  const regeneratePlan = useCallback(async () => {
    setError("");
    setGenerating(true);
    try {
      const res = await axiosInstance.post("/diet/regenerate");
      if (res.data?.success) setDietPlan(res.data.dietPlan);
    } catch (err) {
      console.error("Regeneration Error:", err);
      setError("Recalibration failed. AI engine is currently busy.");
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) fetchLatestPlan();
  }, [currentUser, fetchLatestPlan]);

  const adaptiveStatus = dietPlan?.inputSnapshot?.todayStatus || null;
  const profile = dietPlan?.inputSnapshot?.profile || {};

  const remaining = useMemo(() => {
    return (
      adaptiveStatus?.remaining || {
        calories: 0,
        protein: 0,
        sugar: 0,
        fiber: 0,
      }
    );
  }, [adaptiveStatus]);

  const targets = useMemo(() => {
    return (
      adaptiveStatus?.targets || {
        calories: 2000,
        protein: 100,
        sugar: 50,
        fiber: 30,
      }
    );
  }, [adaptiveStatus]);

  const engineLabel = formatEngine(dietPlan?.engineUsed);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Box className="diet-page-root">
      <Container maxWidth="lg">
        {/* HEADER */}
        <Card className="diet-header-card">
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Box>
              <Typography variant="h5" className="diet-title">
                <AutoAwesome sx={{ mr: 1, color: "var(--primary-green)" }} /> Personalized Diet Advisor
              </Typography>

              <Typography variant="caption" className="diet-subtitle">
                Optimization Engine: <b>{engineLabel}</b>
                {" • "}
                {(profile.dietType || "veg").toUpperCase()}
                {" • "}
                {(profile.preferredCuisine || "indian").toUpperCase()}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              {!dietPlan ? (
                <Button
                  variant="contained"
                  onClick={generateNewPlan}
                  disabled={generating}
                  className="action-btn"
                >
                  {generating ? "Creating..." : "Create Plan"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={regeneratePlan}
                  disabled={generating}
                  className="action-btn"
                >
                  {generating ? "Updating..." : "Update Plan"}
                </Button>
              )}
            </Stack>
          </Stack>
        </Card>

        {/* EMPTY STATE */}
        {!dietPlan ? (
          <Card className="content-card">
            <Typography variant="h6" sx={{ color: "black", fontWeight: "bold" }}>
              No Diet Plan Generated Yet
            </Typography>
            <Typography variant="body2" sx={{ color: "black", mt: 1 }}>
              Click <b>Generate</b> to create your first adaptive plan.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {/* REMAINING BUDGET */}
            <Grid item xs={12} md={4}>
              <Card className="content-card">
                <Typography
                  variant="subtitle2"
                  className="card-title"
                >
                  <TimelineIcon sx={{ mr: 1, color: "var(--primary-green)" }} /> Today’s Intake Overview
                </Typography>

                <MacroGauge
                  label="Calories"
                  remaining={remaining.calories}
                  target={targets.calories}
                  unit="kcal"
                  color="var(--primary-green)"
                />
                <MacroGauge
                  label="Protein"
                  remaining={remaining.protein}
                  target={targets.protein}
                  unit="g"
                  color="#38bdf8"
                />
                <MacroGauge
                  label="Sugar Remaining"
                  remaining={remaining.sugar}
                  target={targets.sugar}
                  unit="g"
                  color="#f43f5e"
                />
                <MacroGauge
                  label="Fiber Remaining"
                  remaining={remaining.fiber}
                  target={targets.fiber}
                  unit="g"
                  color="#a855f7"
                />

                <Box className="ai-insight-box">
                  <Typography
                    variant="caption"
                    className="ai-insight-title"
                    sx={{ color: "black", fontWeight: "bold" }}
                  >
                    <InsightsIcon sx={{ fontSize: 16, mr: 1, color: "black" }} /> Daily Insight
                  </Typography>

                  <Typography variant="body2" className="ai-insight-text">
                    {dietPlan?.aiInsight || "Calibrating corrective meals based on today's intake..."}
                  </Typography>
                </Box>
              </Card>
            </Grid>

            {/* MEAL SUGGESTIONS */}
            <Grid item xs={12} md={8}>
              <Card className="content-card">
                <Typography
                  variant="subtitle2"
                  className="card-title"
                >
                  <RestaurantMenu sx={{ mr: 1, color: "var(--primary-green)" }} /> AI Meal Suggestions
                </Typography>

                <Grid container spacing={2}>
                  {(dietPlan?.meals || []).map((meal, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Box className="meal-item-box">
                        <Typography
                          variant="subtitle1"
                          className="meal-name"
                        >
                          {meal.name.startsWith("meal")
                            ? `MEAL ${meal.name.replace("meal", "")}`
                            : meal.name.toUpperCase()}

                        </Typography>
                        <Divider className="meal-divider" />
                        <Typography variant="body2" className="meal-description">
                          {meal.description}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Grid container spacing={2} sx={{ mt: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" className="power-food-title" sx={{ color: "black" }}>
                      ✓ POWER FOODS
                    </Typography>
                    <Box className="markdown-content">
                      <ReactMarkdown>{dietPlan?.recommendedFoods || ""}</ReactMarkdown>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" className="avoid-food-title" sx={{ color: "black" }}>
                      ✕ AVOID LIST
                    </Typography>
                    <Box className="markdown-content">
                      <ReactMarkdown>{dietPlan?.foodsToAvoid || ""}</ReactMarkdown>
                    </Box>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError("")}>
        <Alert severity="error" variant="filled" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DietPlan;
