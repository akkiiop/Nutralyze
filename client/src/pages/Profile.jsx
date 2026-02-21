import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Alert,
  MenuItem,
  Grid,
  InputAdornment,
  Stack,
  Chip,
  Divider,
  Snackbar
} from "@mui/material";
import axiosInstance from "../config/axiosInstance";
import { useAuth } from "../contexts/AuthContext";
import "./Profile.css";

const Profile = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "male",
    height: "",
    weight: "",
    targetWeight: "",
    activityLevel: "sedentary",
    dietType: "veg",
    preferredCuisine: "indian",
    mealFrequency: "3",
    budgetRange: "standard",
    sleepDuration: "8",
    medicalConditions: "",
    allergies: "",
    avoidIngredients: "",
    goal: "maintenance",
    calorieTarget: "",
    proteinTarget: "",
    sugarTarget: "50",
    fiberTarget: "30",
    waterIntakeGoal: "",
    fastingStart: "20:00",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false); /* Phase 1: Notification State */

  const completeness = useMemo(() => {
    const requiredKeys = [
      "age", "gender", "height", "weight", "targetWeight",
      "activityLevel", "dietType", "goal",
      "calorieTarget", "proteinTarget", "waterIntakeGoal",
    ];

    let filled = 0;
    requiredKeys.forEach((key) => {
      const v = formData[key];
      if (v !== null && v !== undefined && String(v).trim() !== "") filled += 1;
    });

    const percent = Math.round((filled / requiredKeys.length) * 100);
    let level = percent >= 85 ? "Excellent" : percent >= 65 ? "Good" : percent >= 40 ? "Moderate" : "Low";
    const color = percent >= 65 ? "success" : percent >= 40 ? "warning" : "error";

    return { percent, level, color };
  }, [formData]);

  useEffect(() => {
    if (!currentUser) return;
    axiosInstance.get("/user/me")
      .then((res) => {
        if (res.data.success) {
          const data = res.data.user;
          setFormData({
            ...formData,
            ...data,
            medicalConditions: (data.medicalConditions || []).join(", "),
            allergies: (data.allergies || []).join(", "),
            avoidIngredients: (data.avoidIngredients || []).join(", "),
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch metabolic profile");
        setLoading(false);
      });
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...formData,
        medicalConditions: formData.medicalConditions.split(",").map(s => s.trim()).filter(Boolean),
        allergies: formData.allergies.split(",").map(s => s.trim()).filter(Boolean),
        avoidIngredients: formData.avoidIngredients.split(",").map(s => s.trim()).filter(Boolean),
      };
      await axiosInstance.put("/user/update", payload);
      setShowSuccess(true); /* Phase 2: Trigger custom UI */
    } catch (err) {
      setError("Update failed. Check your network.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box className="loader-container"><CircularProgress color="success" /></Box>;

  return (
    <Box className="profile-page">
      <Container maxWidth="md">
        <Paper className="profile-form-container" elevation={0}>
          <Stack spacing={1} mb={4}>
            <Typography
              variant="h4"
              className="form-header"
              sx={{
                color: "#1F2937 !important",
                fontWeight: 800,
                opacity: 1,
                mb: 1
              }}
            >
              PERSONAL HEALTH PROFILE
            </Typography>
            <Typography variant="body1" sx={{ color: "#6B7280", fontWeight: 500, fontSize: "1rem" }}>
              Set your health details and dietary preferences.
            </Typography>
          </Stack>

          <Box className="profile-completeness-panel">
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography sx={{ fontWeight: 800, color: "#1F2937", fontSize: "1.1rem" }}>Profile Completion</Typography>
              <Chip size="small" label={`${completeness.percent}% • ${completeness.level}`} color={completeness.color} variant="outlined" sx={{ fontWeight: 800 }} />
            </Stack>
            <Box className="progress-row">
              <div className="progress-track">
                <div className={`progress-fill ${completeness.color}`} style={{ width: `${completeness.percent}%` }} />
              </div>
            </Box>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Grid container spacing={3}>
            {/* PHYSICAL METRICS */}
            <Grid item xs={12}><Typography className="group-title">BODY METRICS</Typography></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Age" name="age" value={formData.age} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth label="Gender" name="gender" value={formData.gender} onChange={handleChange}>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Height" name="height" value={formData.height} onChange={handleChange} InputProps={{ endAdornment: <InputAdornment position="end">cm</InputAdornment> }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Current Weight" name="weight" value={formData.weight} onChange={handleChange} InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Target Weight" name="targetWeight" value={formData.targetWeight} onChange={handleChange} InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }} /></Grid>

            {/* DIETARY INTELLIGENCE */}
            <Grid item xs={12} mt={2}><Typography className="group-title">FOOD PREFERENCES</Typography></Grid>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth label="Diet Type" name="dietType" value={formData.dietType} onChange={handleChange}>
                <MenuItem value="veg">Vegetarian</MenuItem>
                <MenuItem value="non-veg">Non-Vegetarian</MenuItem>
                <MenuItem value="vegan">Vegan</MenuItem>
                <MenuItem value="eggetarian">Eggetarian</MenuItem>
                <MenuItem value="jain">Jain (No Onion/Garlic)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth label="Cuisine" name="preferredCuisine" value={formData.preferredCuisine} onChange={handleChange}>
                <MenuItem value="indian">Indian</MenuItem>
                <MenuItem value="continental">Continental</MenuItem>
                <MenuItem value="mediterranean">Mediterranean</MenuItem>
                <MenuItem value="western">Western</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth label="Meals Per Day" name="mealFrequency" value={formData.mealFrequency} onChange={handleChange}>
                <MenuItem value="3">3 Big Meals</MenuItem>
                <MenuItem value="4">4 Meals (Small snacks)</MenuItem>
                <MenuItem value="6">6 Small Meals</MenuItem>
              </TextField>
            </Grid>

            {/* SYSTEM TARGETS */}
            <Grid item xs={12} mt={2}><Typography className="group-title">DAILY NUTRITION GOALS</Typography></Grid>
            <Grid item xs={12} sm={3}><TextField fullWidth label="Calories" name="calorieTarget" value={formData.calorieTarget} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={3}><TextField fullWidth label="Protein (g)" name="proteinTarget" value={formData.proteinTarget} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={3}><TextField fullWidth label="Sugar Cap (g)" name="sugarTarget" value={formData.sugarTarget} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={3}><TextField fullWidth label="Fiber (g)" name="fiberTarget" value={formData.fiberTarget} onChange={handleChange} /></Grid>

            {/* AI GUARDRAILS */}
            <Grid item xs={12} mt={2}><Typography className="group-title">HEALTH & SAFETY PREFERENCES</Typography></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Allergies" name="allergies" value={formData.allergies} onChange={handleChange} helperText="e.g. Milk, Peanuts, Gluten" /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Ingredients to Avoid" name="avoidIngredients" value={formData.avoidIngredients} onChange={handleChange} helperText="e.g. Palm Oil, MSG, White Sugar" /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Medical Conditions" name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} helperText="e.g. Type 2 Diabetes, Hypertension, PCOS" /></Grid>

            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Activity Level" name="activityLevel" value={formData.activityLevel} onChange={handleChange}>
                <MenuItem value="sedentary">Sedentary (Office/Home)</MenuItem>
                <MenuItem value="lightly_active">Lightly Active</MenuItem>
                <MenuItem value="moderately_active">Moderately Active</MenuItem>
                <MenuItem value="very_active">Very Active (Athlete)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Health Goal" name="goal" value={formData.goal} onChange={handleChange}>
                <MenuItem value="weight_loss">Weight Loss</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="weight_gain">Weight Gain</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Button variant="contained" className="update-btn" fullWidth onClick={handleSave} disabled={saving} sx={{ mt: 6 }}>
            {saving ? "Updating..." : "Update Profile"}
          </Button>
        </Paper>
      </Container>

      {/* Phase 3: Custom Premium Notification UI */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          className="premium-notification"
          sx={{
            width: '100%',
            background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
            color: '#fff',
            fontWeight: 600,
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(22, 197, 94, 0.2)',
            '& .MuiAlert-icon': { color: '#fff' }
          }}
        >
          Profile Updated Successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;