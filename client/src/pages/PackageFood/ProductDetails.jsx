import {
  FaMicroscope,
  FaExclamationTriangle,
  FaCamera,
  FaListAlt,
  FaExchangeAlt,
  FaLeaf,
  FaCube,
  FaFlask,
  FaAllergies
} from "react-icons/fa";
import "./ProductDetails.css";

import { useAuth } from "../../contexts/AuthContext";
import axiosInstance from "../../config/axiosInstance";
import { useEffect, useState, useMemo } from "react";

// Enhanced Ingredient Cleaning Logic
const formatIngredientName = (name) => {
  if (!name) return "";

  // 1. Convert to lowercase for uniform processing initially
  let clean = name.trim().toLowerCase();

  // 2. Remove common headers/prefixes entirely (case-insensitive)
  const prefixes = [
    /^(ingredients|contains|may contain|allergy information|allergy info|contains less than 2% of)[:\s]*/i,
    /^(enriched wheat flour)\b/i, // Example to check if we need to keep this? (Usually yes, but stripped for simplicity)
  ];
  prefixes.forEach(p => { clean = clean.replace(p, "").trim(); });

  // 3. Remove content inside square brackets or parentheses if they are just numbers/codes
  // (e.g., "[123]", "(E123)")
  clean = clean.replace(/\d+\s*%/g, ""); // Remove percentages for de-duplication
  clean = clean.replace(/\b[eE]\d{3,4}[a-z]?\b/g, ""); // Remove E-numbers

  // 4. Handle nested lists - if it's "Chocolate chunk (chocolate liquor, sugar...)",
  // we often want to isolate the main item or the sub-items.
  // The user wanted "nice UI", so we'll try to keep the primary name clean.
  clean = clean.split(/[([;]/)[0].trim();

  // 5. Remove problematic characters and extra spaces
  clean = clean.replace(/[.,;*:]+$/g, "").trim();
  clean = clean.replace(/\s+/g, " ");

  if (clean.length < 2) return null;

  // 6. Sentence Case for Professional Look
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const ProductDetails = ({ product, onUploadIngredients, loadingOCR, loadingPhase }) => {
  const { currentUser } = useAuth();

  // View Mode: 'per100g' or 'serving'
  const [viewMode, setViewMode] = useState("per100g");

  if (!product) {
    return (
      <div className="analysis-card-wrapper">
        <div className="missing-data-placeholder">
          <p style={{ opacity: 0.7 }}>Loading product details...</p>
        </div>
      </div>
    );
  }

  /* =========================
     DATA EXTRACT
     ========================= */
  const identity = product?.identity || {};
  const ingredients = product?.ingredients?.list || [];
  const nutrition = product?.nutrition || {};
  const per100g = nutrition.per100g || {};
  const canonical = nutrition.canonical || {};
  const quantityLabel = identity.quantity || "Serving";

  // Determine availability
  const hasPer100g = Number.isFinite(per100g.calories);
  const hasServing = Number.isFinite(canonical.calories);

  // Initialize viewMode based on data availability (Prefer 100g standard)
  useEffect(() => {
    if (hasPer100g) setViewMode("per100g");
    else if (hasServing) setViewMode("serving");
  }, [product, hasPer100g, hasServing]);

  // Active Data Selection
  const activeData = viewMode === "per100g" ? per100g : canonical;
  const activeLabel = viewMode === "per100g" ? "Per 100g" : `Per ${quantityLabel}`;

  const handleLogPackagedFood = async () => {
    try {
      if (!currentUser?._id) {
        alert("Please login to log meals.");
        return;
      }

      // Always log canonical (serving) size if possible, or calculate?
      // Convention: Backend expects typically consumed amount. 
      // If we only have 100g, we might need to ask quantity. For now, log what we have.
      const logNutrition = {
        calories: activeData.calories || 0,
        protein: activeData.protein || 0,
        carbs: activeData.carbs || 0,
        fats: activeData.fats || 0,
      };

      await axiosInstance.post("/meals/detected", {
        userId: currentUser._id,
        mealType: "snacks",
        foodName: identity.name || "Packaged Food",
        nutrition: logNutrition,
        timestamp: new Date().toISOString(),
        source: "packaged",
        ingredients: {
          rawText: product.ingredients?.rawText || null,
          list: product.ingredients?.list?.map((i) => i.name).filter(Boolean) || [],
        },
        packagedMeta: {
          barcode: identity.barcode || null,
          brand: identity.brand || null,
          quantity: identity.quantity || null,
          isEstimated: nutrition.isEstimated || false,
        },
      });

      alert("✅ Logged successfully!");
    } catch (err) {
      console.error("❌ Packaged log error:", err);
      alert("Failed to log packaged food.");
    }
  };

  return (
    <div className="analysis-card-wrapper">
      {/* =========================
          HEADER
         ========================= */}
      <div className="header-action-bar">
        <div className="title-group">
          <FaMicroscope className="title-icon" />
          <h2>Product Information</h2>
        </div>

        <div className="header-controls">
          {/* TOGGLE SWITCH */}
          {hasPer100g && hasServing && (
            <div className="view-toggle-container">
              <button
                className={`toggle-option ${viewMode === 'per100g' ? 'active' : ''}`}
                onClick={() => setViewMode("per100g")}
              >
                Per 100g
              </button>
              <button
                className={`toggle-option ${viewMode === 'serving' ? 'active' : ''}`}
                onClick={() => setViewMode("serving")}
              >
                Per Serving
              </button>
            </div>
          )}

          <button className="log-meal-btn" onClick={handleLogPackagedFood}>
            Log Food
          </button>
        </div>
      </div>

      {/* =========================
          PRODUCT OVERVIEW GRID
         ========================= */}
      <div className="product-overview-grid">
        {/* LEFT — PRODUCT IMAGE & IDENTITY */}
        <div className="product-image-col">
          <div className="left-column-top">
            <div className="detail-box identity-box">
              <span className="identity-label">Product Name</span>
              <h3 className="product-name">{identity.name || "Unknown Product"}</h3>
              <p className="product-brand">{identity.brand || "Unknown Brand"}</p>
            </div>
          </div>

          <div className="left-column-bottom">
            <div className="detail-box image-box-fill">
              {product?.images?.front ? (
                <img src={product.images.front} alt={identity.name} className="product-front-image" />
              ) : (
                <div className="image-placeholder">No Image Available</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — INFO */}
        <div className="product-data-col">
          {/* Row 1: Nutri-Score (Centered if possible) */}
          <div className={`nutri-score-plate ${product?.scores?.nutriScore?.toLowerCase() || 'unknown'}`}>
            <span className="plate-label">Nutri-Score</span>
            <span className="plate-value">{product?.scores?.nutriScore || "?"}</span>
          </div>

          {/* Row 2: Nutrition Data */}
          <div className="nutrition-data-card">
            <div className="nutrition-header-row">
              <span className="nutrition-mini-title">Nutritional Values ({activeLabel})</span>
            </div>

            {/* Main Macro Grid */}
            <div className="macro-stats-grid">
              <div className="macro-item highlight">
                <span className="macro-label">Energy</span>
                <span className="macro-value">{Number(activeData.calories || 0).toFixed(0)} <small>kcal</small></span>
              </div>

              <div className="macro-divider"></div>

              <div className="macro-item">
                <span className="macro-label">Protein</span>
                <span className="macro-value">{Number(activeData.protein || 0).toFixed(1)}g</span>
              </div>

              <div className="macro-item">
                <span className="macro-label">Carbs</span>
                <span className="macro-value">{Number(activeData.carbs || 0).toFixed(1)}g</span>
              </div>

              <div className="macro-item">
                <span className="macro-label">Fat</span>
                <span className="macro-value">{Number(activeData.fats || 0).toFixed(1)}g</span>
              </div>
            </div>

            {nutrition.isEstimated && (
              <div className="nutrition-mini-est">
                <FaExclamationTriangle /> Values estimated from text/AI
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================
          INGREDIENTS
         ========================= */}
      {(ingredients.length > 0 || product.ingredients?.rawText) && (
        <div className="composition-full-width">
          <div className="section-title-bar">
            <div className="comp-title">
              <FaListAlt />
              <h3>Ingredients Composition</h3>
            </div>
          </div>

          <div className="ingredients-simple-list">
            {(() => {
              let listToProcess = [];
              if (ingredients.length > 0) {
                listToProcess = ingredients.map(ing => ing.name || ing);
              } else if (product.ingredients?.rawText) {
                // Split by common delimiters if only raw text is available
                listToProcess = product.ingredients.rawText.split(/[,;]/);
              }

              return [...new Set(listToProcess.map(ing => formatIngredientName(ing)))]
                .filter(name => name && name.length > 2)
                .map((name, i) => (
                  <span key={i} className="ingredient-chip">
                    {name}
                  </span>
                ));
            })()}
          </div>
        </div>
      )}

      {/* =========================
          OCR FALLBACK
         ========================= */}
      {ingredients.length === 0 && (
        <div className="missing-data-placeholder">
          <div className="warning-callout">
            <FaCamera />
            <p>Sorry, ingredients are not available. Please capture a clear photo of the label.</p>
          </div>

          <div className="custom-upload-wrapper">
            <input
              type="file"
              id="ocr-upload"
              className="hidden-file-input"
              accept="image/*"
              disabled={loadingOCR || loadingPhase > 0}
              onChange={(e) => onUploadIngredients(e.target.files[0])}
            />
            <label htmlFor="ocr-upload" className={`premium-upload-btn ${loadingPhase > 0 ? 'loading' : ''}`}>
              {loadingPhase > 0 ? (
                <>
                  <span className="spinner-mini"></span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FaCamera className="btn-icon" />
                  <span>Scan Ingredient Label</span>
                </>
              )}
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
