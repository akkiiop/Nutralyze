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
import { classifyIngredients, getCategoryStyles } from "../../utils/classifyIngredients";

// Helper Component for Grouped Ingredients
const IngredientsGroupRenderer = ({ list }) => {
  const groups = useMemo(() => classifyIngredients(list), [list]);

  if (!groups) return <p>No ingredients data.</p>;

  const sections = [
    { key: 'primary', icon: <FaLeaf />, ...getCategoryStyles('primary') },
    { key: 'sugarsFats', icon: <FaCube />, ...getCategoryStyles('sugarsFats') },
    { key: 'additives', icon: <FaFlask />, ...getCategoryStyles('additives') },
    { key: 'allergens', icon: <FaAllergies />, ...getCategoryStyles('allergens') }
  ];

  return (
    <div className="ingredients-grouped-container">
      {sections.map(({ key, label, color, icon }) => {
        const items = groups[key];
        if (!items || items.length === 0) return null;

        return (
          <div key={key} className={`ing-group-section group-${color}`}>
            <h4 className="ing-group-title">
              {icon} {label}
            </h4>
            <div className="ing-chips-wrapper">
              {items.map((ing, i) => (
                <span
                  key={i}
                  className={`ing-pill pill-${color} ${ing.isAllergen ? 'allergen-alert' : ''}`}
                  title={ing.isAllergen ? "Potential Allergen" : label}
                >
                  {ing.name}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
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
      {ingredients.length > 0 && (
        <div className="composition-full-width">
          <div className="section-title-bar">
            <div className="comp-title">
              <FaListAlt />
              <h3>Ingredients Composition</h3>
            </div>
            <span className="item-count">{ingredients.length} items analyzed</span>
          </div>

          <IngredientsGroupRenderer list={ingredients} />
        </div>
      )}

      {/* =========================
          OCR FALLBACK
         ========================= */}
      {ingredients.length === 0 && (
        <div className="missing-data-placeholder">
          <div className="warning-callout">
            <FaCamera />
            <p>Ingredients not readable. Please capture a clear photo of the label.</p>
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
