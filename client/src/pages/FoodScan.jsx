import React, { useState } from "react";
import { Box, Typography, TextField, Button, Paper, CircularProgress } from "@mui/material";
import BarcodeScanner from "react-qr-barcode-scanner";
import api from "../services/api";
import imageCompression from 'browser-image-compression';

export default function FoodScan() {
  const [barcode, setBarcode] = useState("");
  const [scanned, setScanned] = useState(false);
  const [product, setProduct] = useState(null);
  const [harmful, setHarmful] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("barcode");

  // --- 1. BARCODE LOGIC (From your original file) ---
  const fetchProduct = async (code) => {
    try {
      const res = await api.get(`/api/scan-food/barcode/${code}`);
      return res.data;
    } catch (err) {
      console.error("Fetch error:", err);
      return { success: false };
    }
  };

  const analyzeHarmful = async (ingredientsText) => {
    try {
      const res = await api.post("/api/analysis/analyze", {
        ingredients: ingredientsText,
      });
      return res.data.harmfulFound;
    } catch (err) {
      console.error("Harmful error:", err);
      return [];
    }
  };

  const handleScanResult = async (result) => {
    if (!result || scanned) return;
    const code = result.text;
    setScanned(true);
    setBarcode(code);

    setLoading(true);
    const productData = await fetchProduct(code);

    if (!productData.success) {
      alert("Product not found");
      setScanned(false);
      setLoading(false);
      return;
    }

    setProduct({
      name: productData.product.name,
      ingredients: productData.product.ingredients,
    });

    const harmfulList = await analyzeHarmful(productData.product.ingredients);
    setHarmful(harmfulList);
    setLoading(false);
    setScanned(false);
  };

  // --- 2. PHOTO/GROQ LOGIC (New) ---
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      const formData = new FormData();
      formData.append("image", compressedFile);

      const res = await api.post("/api/food/detect-fresh", formData);

      if (res.data.success) {
        setProduct({
          name: res.data.data.dish_name,
          ingredients: res.data.data.ingredients.join(", "),
          calories: res.data.data.total_calories
        });
        // We can also run the harmful analysis on the ingredients Groq found
        const harmfulList = await analyzeHarmful(res.data.data.ingredients.join(", "));
        setHarmful(harmfulList);
      }
    } catch (err) {
      console.error("Photo Analysis Error:", err);
      alert("Failed to analyze photo. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h4" fontWeight={700} mb={2}>Nutralyze Scanner</Typography>

      {/* Mode Switcher */}
      <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
        <Button variant={mode === "barcode" ? "contained" : "outlined"} onClick={() => { setMode("barcode"); setProduct(null); }}>
          Scan Barcode
        </Button>
        <Button variant={mode === "photo" ? "contained" : "outlined"} onClick={() => { setMode("photo"); setProduct(null); }}>
          Analyze Photo (Groq)
        </Button>
      </Box>

      {mode === "barcode" ? (
        <Box>
          <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>
            <BarcodeScanner width={"100%"} height={250} onUpdate={(err, result) => result && handleScanResult(result)} />
          </Paper>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField fullWidth label="Enter Barcode Manually" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            <Button variant="contained" onClick={() => handleScanResult({ text: barcode })}>Go</Button>
          </Box>
        </Box>
      ) : (
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3, border: '2px dashed #ccc' }}>
          <Typography variant="h6" mb={2}>Snap a dish or upload an image</Typography>
          <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} id="photo-upload" />
          <label htmlFor="photo-upload">
            <Button variant="contained" size="large" component="span" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Take Photo / Upload"}
            </Button>
          </label>
        </Paper>
      )}

      {/* SHARED RESULTS SECTION */}
      {loading && mode === "photo" && <Typography sx={{ mt: 2, textAlign: 'center' }}>AI is analyzing your food...</Typography>}

      {product && (
        <Paper sx={{ p: 3, borderRadius: 3, mt: 3, boxShadow: 3 }}>
          <Typography variant="h5" color="primary" fontWeight={600}>{product.name}</Typography>
          <Typography variant="body1" sx={{ mt: 1 }}><b>Ingredients:</b> {product.ingredients}</Typography>
          {product.calories && <Typography variant="body1" sx={{ mt: 1, color: '#ed6c02', fontWeight: 'bold' }}>Calories: ~{product.calories} kcal</Typography>}

          <Typography variant="h6" sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>Harmful Ingredients Check:</Typography>
          {harmful.length === 0 ? (
            <Typography sx={{ color: "green", mt: 1 }}>✅ No known harmful additives detected.</Typography>
          ) : (
            harmful.map((item, idx) => <Typography key={idx} sx={{ color: "red", mt: 0.5 }}>⚠️ {item}</Typography>)
          )}
        </Paper>
      )}
    </Box>
  );
}