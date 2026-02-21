import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box, Container, Typography, Button, CircularProgress, Paper,
  Divider, Grid, ToggleButtonGroup, ToggleButton, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton, Stack
} from "@mui/material";

import {
  Add,
  CalendarMonth as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
  Restore as RestoreIcon // Import Restore Icon
} from "@mui/icons-material";


import axiosInstance from "../config/axiosInstance";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "./MealLog.css";

const MEAL_TYPES = ["breakfast", "lunch", "snacks", "dinner"];

/** --------------------------
 * Helpers
 * -------------------------- */
function calculateTotals(meals) {
  return meals.reduce(
    (acc, meal) => {
      const n = meal.nutrition || {};

      acc.calories += Number(n.calories ?? meal.calories ?? 0);
      acc.protein += Number(n.protein ?? meal.protein ?? 0);
      acc.carbs += Number(n.carbs ?? meal.carbs ?? 0);
      acc.fat += Number(n.fats ?? n.fat ?? meal.fat ?? 0);

      // ✅ ADD THESE TWO (CRITICAL)
      acc.sugar += Number(n.sugar ?? 0);
      acc.fiber += Number(n.fiber ?? 0);

      return acc;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sugar: 0,   // ✅ NEW
      fiber: 0,   // ✅ NEW
    }
  );
}

const MACRO_LABELS = {
  calories: "ENERGY",
  protein: "PROTEIN",
  carbs: "CARBOHYDRATES",
  fat: "FAT",
  sugar: "SUGAR",
  fiber: "FIBER"
};


function normalizeMealType(type) {
  const t = String(type || "").toLowerCase();
  return MEAL_TYPES.includes(t) ? t : "snacks";
}

function formatTime(meal) {
  const t = meal.time || meal.timestamp || meal.createdAt || Date.now();
  return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function macroValue(meal, key) {
  const n = meal.nutrition || {};

  if (key === "calories") return Number(n.calories ?? meal.calories ?? 0);
  if (key === "protein") return Number(n.protein ?? meal.protein ?? 0);
  if (key === "carbs") return Number(n.carbs ?? meal.carbs ?? 0);
  if (key === "fat") return Number(n.fats ?? n.fat ?? meal.fat ?? 0);

  return 0;
}


export default function MealLog({ userId }) {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Sorting
  const [sortOrder, setSortOrder] = useState("newest");

  // ✅ View Toggle: Grouped vs Timeline
  const [viewMode, setViewMode] = useState("grouped"); // "grouped" | "timeline"

  // ✅ Manual add dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMeal, setNewMeal] = useState({
    mealType: "breakfast",
    foodName: "",
    time: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const isoDate = selectedDate.format("YYYY-MM-DD");
  const isToday = selectedDate.isSame(dayjs(), 'day');

  const dateLabel = useMemo(() => {
    if (isToday) return "Today";
    // Check if it's currently yesterday or tomorrow based on *current actual date*
    // Note: 'dayjs()' returns current time, so we compare dates.
    const today = dayjs();
    if (selectedDate.isSame(today.subtract(1, 'day'), 'day')) return "Yesterday";
    if (selectedDate.isSame(today.add(1, 'day'), 'day')) return "Tomorrow";
    return selectedDate.format("ddd, MMM D");
  }, [selectedDate, isToday]);

  /** --------------------------
   * Fetch Meals
   * -------------------------- */
  const fetchMeals = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const res = await axiosInstance.get(`/meals/${userId}/${isoDate}`);
      const data = res.data?.meals || [];
      setMeals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching meals:", err);
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, [userId, isoDate]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  /** --------------------------
   * Date Navigation
   * -------------------------- */
  const goPrevDay = () => setSelectedDate((d) => d.subtract(1, "day"));
  const goNextDay = () => setSelectedDate((d) => d.add(1, "day"));
  const goToday = () => setSelectedDate(dayjs());

  /** --------------------------
   * Derived Data
   * -------------------------- */
  const totals = useMemo(() => calculateTotals(meals), [meals]);
  console.log("🧮 TOTALS DEBUG", totals);


  const sortedMeals = useMemo(() => {
    const copy = [...meals];
    copy.sort((a, b) => {
      const timeA = new Date(a.time || a.timestamp || a.createdAt || Date.now()).getTime();
      const timeB = new Date(b.time || b.timestamp || b.createdAt || Date.now()).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });
    return copy;
  }, [meals, sortOrder]);

  const mealsByType = useMemo(() => {
    const map = {
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: []
    };

    meals.forEach((m) => {
      map[normalizeMealType(m.mealType)].push(m);
    });

    // sort each meal-type list (time)
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => {
        const timeA = new Date(a.time || a.timestamp || a.createdAt || Date.now()).getTime();
        const timeB = new Date(b.time || b.timestamp || b.createdAt || Date.now()).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      });
    });

    return map;
  }, [meals, sortOrder]);

  /** --------------------------
   * Add Manual Meal
   * -------------------------- */
  const handleAddMeal = async () => {
    try {
      if (!userId) return;
      const cleanFoodName = String(newMeal.foodName || "").trim();
      if (!cleanFoodName) return;

      const timestamp = newMeal.time
        ? dayjs(`${isoDate} ${newMeal.time}`).toISOString()
        : new Date().toISOString();

      const payload = {
        userId,
        date: isoDate,
        meal: {
          mealType: newMeal.mealType,
          foodName: cleanFoodName,
          nutrition: {
            calories: Number(newMeal.calories || 0),
            protein: Number(newMeal.protein || 0),
            carbs: Number(newMeal.carbs || 0),
            fats: Number(newMeal.fat || 0),

            // ✅ ADD THESE (even if 0)
            sugar: Number(newMeal.sugar || 0),
            fiber: Number(newMeal.fiber || 0),
          },

          timestamp,
          source: "manual",
        },
      };

      await axiosInstance.post(`/meals/add`, payload);

      setAddDialogOpen(false);
      setNewMeal({
        mealType: "breakfast",
        foodName: "",
        time: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
      });

      fetchMeals();
    } catch (err) {
      console.error("Error adding meal:", err);
    }
  };

  /** --------------------------
   * UI Components
   * -------------------------- */
  const renderMealCard = (meal, idx) => {
    const name = meal.foodName || meal.mealName || "Food Item";
    const time = formatTime(meal);
    const mType = normalizeMealType(meal.mealType);

    const calories = macroValue(meal, "calories");
    const protein = macroValue(meal, "protein");
    const carbs = macroValue(meal, "carbs");
    const fat = macroValue(meal, "fat");

    const sourceTag =
      meal?.source === "package" || meal?.source === "packaged" ? "Packaged"
        : meal?.source === "manual" ? "Manual"
          : null; // Hide AI/Dashboard sources as requested

    return (
      <Grid item xs={12} sm={6} md={4} key={meal._id || idx}>
        <Paper className="meal-entry-card" elevation={0}>
          <Box className="meal-card-header">
            <Box>
              <Typography className="meal-card-name">{name}</Typography>
              <Typography className="meal-card-time">
                {time} • <span className="meal-card-type">{mType}</span>
              </Typography>
            </Box>

            {sourceTag && (
              <Chip size="small" label={sourceTag} className="ai-chip" />
            )}
          </Box>

          <Divider className="card-divider" />

          <Box className="meal-card-macros">
            <Box className="macro-box">
              <Typography className="m-label">CALS</Typography>
              <Typography className="m-val">{Math.round(calories)}</Typography>
            </Box>
            <Box className="macro-box">
              <Typography className="m-label">PRO</Typography>
              <Typography className="m-val">{protein.toFixed(1)}g</Typography>
            </Box>
            <Box className="macro-box">
              <Typography className="m-label">CARB</Typography>
              <Typography className="m-val">{carbs.toFixed(1)}g</Typography>
            </Box>
            <Box className="macro-box">
              <Typography className="m-label">FAT</Typography>
              <Typography className="m-val">{fat.toFixed(1)}g</Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
    );
  };

  const renderGroupedMeals = () => {
    return (
      <Stack spacing={3}>
        {MEAL_TYPES.map((type) => {
          const list = mealsByType[type] || [];
          return (
            <Box key={type}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.2 }}>
                <Typography variant="h6" className="section-title" sx={{ textTransform: "capitalize" }}>
                  {type}
                </Typography>
                <Chip size="small" label={`${list.length} ${list.length === 1 ? 'item' : 'items'}`} className="count-chip" />
              </Box>

              {list.length === 0 ? (
                <Paper className="empty-section-card">
                  <Typography variant="body2" sx={{ opacity: 0.6 }}>
                    No meals added for {type} yet.
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  {list.map((meal, idx) => renderMealCard(meal, `${type}-${idx}`))}
                </Grid>
              )}
            </Box>
          );
        })}
      </Stack>
    );
  };

  if (!userId) return null;

  return (
    <Box className="meal-log-root">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* HEADER */}
        <Paper className="header-glass-card" elevation={0}>
          <Box className="header-flex">
            {/* Date selector + nav */}
            <Box className="date-selector-wrapper">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Meal Date"
                  value={selectedDate}
                  onChange={(d) => d && setSelectedDate(d)}
                  slotProps={{
                    textField: {
                      variant: "standard",
                      className: "compact-date-picker"
                    }
                  }}
                />
              </LocalizationProvider>

              {/* ✅ Date nav buttons */}
              <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                <IconButton onClick={goPrevDay} size="small" className="nav-btn">
                  <ChevronLeft />
                </IconButton>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={isToday ? <TodayIcon /> : <RestoreIcon />}
                  onClick={goToday}
                  className="today-btn-neon"
                  sx={{ minWidth: "120px" }}
                >
                  {isToday ? "Go to Today" : dateLabel}
                </Button>

                <IconButton onClick={goNextDay} size="small" className="nav-btn">
                  <ChevronRight />
                </IconButton>
              </Box>
            </Box>

            {/* actions */}
            <Box className="header-actions">
              <ToggleButtonGroup
                size="small"
                value={sortOrder}
                exclusive
                onChange={(e, v) => v && setSortOrder(v)}
                className="sort-toggle-group"
              >
                <ToggleButton value="newest">Newest First</ToggleButton>
                <ToggleButton value="oldest">Oldest First</ToggleButton>
              </ToggleButtonGroup>

              {/* ✅ View switch */}
              <ToggleButtonGroup
                size="small"
                value={viewMode}
                exclusive
                onChange={(e, v) => v && setViewMode(v)}
                className="sort-toggle-group"
                sx={{ ml: 1 }}
              >
                <ToggleButton value="grouped">Grouped by Meal</ToggleButton>
                <ToggleButton value="timeline">Timeline View</ToggleButton>
              </ToggleButtonGroup>

              <Button
                className="add-btn-neon"
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddDialogOpen(true)}
              >
                Add Meal Manually
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* TOTALS */}
        <Grid container spacing={2} sx={{ mb: 4, mt: 0.5 }}>
          {Object.entries(totals).map(([label, val]) => (
            <Grid item xs={6} sm={3} key={label}>
              <Paper className="macro-stat-card" elevation={0}>
                <Typography className="stat-label">{MACRO_LABELS[label] || label}</Typography>
                <Typography className="stat-value">
                  {Math.round(val)}
                  <span className="unit">{label === "calories" ? " kcal" : "g"}</span>
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* MEALS */}
        <Typography variant="h5" className="page-header-title">
          Meal Log · {selectedDate.format("DD MMM YYYY")}
        </Typography>
        <Divider className="custom-divider" sx={{ mb: 3 }} />

        {loading ? (
          <Box className="loader-container">
            <CircularProgress color="success" />
          </Box>
        ) : meals.length === 0 ? (
          <Paper className="empty-log-card">
            <Typography variant="h6">No meals added for {isToday ? "today" : "this date"}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              Add a meal manually or scan food from Dashboard.
            </Typography>
          </Paper>
        ) : viewMode === "grouped" ? (
          renderGroupedMeals()
        ) : (
          <Grid container spacing={2}>
            {sortedMeals.map((meal, idx) => renderMealCard(meal, idx))}
          </Grid>
        )}

        {/* ADD MEAL DIALOG */}
        <Dialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          className="dark-dialog"
        >
          <DialogTitle className="dialog-title">Manual Meal Entry</DialogTitle>

          <DialogContent className="dialog-content">
            <TextField
              select
              fullWidth
              label="Meal Type"
              margin="dense"
              value={newMeal.mealType}
              onChange={(e) => setNewMeal({ ...newMeal, mealType: e.target.value })}
            >
              {MEAL_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t.toUpperCase()}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Food Description"
              margin="dense"
              value={newMeal.foodName}
              onChange={(e) => setNewMeal({ ...newMeal, foodName: e.target.value })}
            />

            <TextField
              fullWidth
              label="Time"
              type="time"
              margin="dense"
              InputLabelProps={{ shrink: true }}
              value={newMeal.time}
              onChange={(e) => setNewMeal({ ...newMeal, time: e.target.value })}
            />

            <Box className="macro-inputs-grid">
              <TextField
                label="Cals"
                type="number"
                value={newMeal.calories}
                onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })}
              />
              <TextField
                label="Prot"
                type="number"
                value={newMeal.protein}
                onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })}
              />
              <TextField
                label="Carb"
                type="number"
                value={newMeal.carbs}
                onChange={(e) => setNewMeal({ ...newMeal, carbs: e.target.value })}
              />
              <TextField
                label="Fat"
                type="number"
                value={newMeal.fat}
                onChange={(e) => setNewMeal({ ...newMeal, fat: e.target.value })}
              />
            </Box>
          </DialogContent>

          <DialogActions className="dialog-actions">
            <Button className="dialog-dismiss-btn" onClick={() => setAddDialogOpen(false)}>Dismiss</Button>
            <Button className="dialog-save-btn" onClick={handleAddMeal}>
              Save Log
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
