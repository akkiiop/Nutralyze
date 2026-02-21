import { useState, useCallback } from "react";
import BarcodeScanner from "./BarcodeScanner";
import ProductDetails from "./ProductDetails";
import HarmfulReport from "./HarmfulReport";
import { normalizeIngredients } from "../../utils/normalizeIngredients";
import { FaBoxOpen, FaSearch, FaBarcode } from "react-icons/fa";
import "./PackageFood.css";
import { API } from "../../config/api";

const PackageFood = () => {
  const [product, setProduct] = useState(null);
  const [freqAnalysis, setFreqAnalysis] = useState(null);
  const [harmReport, setHarmReport] = useState([]);
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [scanMode, setScanMode] = useState("scan");

  // 0 = Idle, 1 = Processing Barcode, 2 = Fetching Product, 3 = Extracting Ingredients, 4 = Analyzing Safety, 5 = Finalizing
  const [loadingPhase, setLoadingPhase] = useState(0);

  const phaseMessages = {
    1: "Processing Barcode...",
    2: "Fetching Product Details...",
    3: "Extracting Ingredients...",
    4: "Analyzing Safety Profile...",
    5: "Finalizing..."
  };

  const analyzeIngredients = async (ingredients = []) => {
    if (!ingredients.length) {
      setHarmReport([]);
      setFreqAnalysis(null);
      return;
    }
    const normalized = normalizeIngredients(ingredients);
    const res = await fetch(`${API.GET_HARMFUL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: normalized }),
    });
    const data = await res.json();
    setHarmReport(Array.isArray(data.all) ? data.all : (Array.isArray(data.results) ? data.results : []));
    setFreqAnalysis(data.frequency_analysis || null);
  };

  const handleProductFetched = useCallback((p) => {
    setProduct(p);
  }, []);

  const handleHarmAnalyzed = useCallback((results) => {
    setHarmReport(results);
  }, []);

  const handleOCRScan = async (file) => {
    try {
      setLoadingOCR(true);
      setLoadingPhase(1);

      const formData = new FormData();
      formData.append("image", file);

      setLoadingPhase(2);

      const ocrRes = await fetch(`${API.OCR_INGREDIENTS}`, { method: "POST", body: formData });
      const ocrData = await ocrRes.json();

      if (!ocrData.ingredients?.length) {
        alert("No ingredients found in image.");
        return;
      }

      setLoadingPhase(3);
      // OCR result is now structured thanks to Gemini in Node!
      const finalIngredients = ocrData.ingredients;
      setProduct((prev) => ({ ...prev, ingredients: { list: finalIngredients } }));

      setLoadingPhase(4);
      await analyzeIngredients(finalIngredients);

      setLoadingPhase(5);
      await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      console.error("OCR Error", err);
      alert("Failed to process image.");
    } finally {
      setLoadingOCR(false);
      setLoadingPhase(0);
    }
  };

  const mergedHarmful = Object.values(
    harmReport.reduce((acc, item) => {
      const key = item.ingredient.match(/\d{3,4}/)?.[0] || item.ingredient.toLowerCase();
      acc[key] = acc[key] || item;
      return acc;
    }, {})
  );

  return (
    <div className="packagefood-container">
      {/* <div className="animated-bg"></div> REMOVED for cleaner look */}

      <header className="packagefood-header-card glass-card">
        <div className="header-icon-container">
          <FaBoxOpen className="header-main-icon" />
        </div>
        <div className="header-text-content">
          <h1 className="page-title">Packaged Food Analysis</h1>
          <p className="page-subtitle">Instantly analyze nutritional value and assess ingredient safety.</p>
        </div>
      </header>

      <div className="perspective-container">
        <section className="step step-find-product glass-card">
          {/* <div className="scan-line"></div> Optional: Remove scan line for static feel if desired, keeping for now as subtle */}
          <h2 className="step-title"><FaBarcode /> Step 1 · Capture Product Label</h2>
          <div className="step-content">
            <BarcodeScanner
              manualOnly={scanMode === "manual"}
              setLoadingPhase={setLoadingPhase}
              loadingPhase={loadingPhase}
              onProductFetched={handleProductFetched}
              onHarmAnalyzed={handleHarmAnalyzed}
            />
          </div>
        </section>
      </div>

      {product && (
        <section className="card product-details-card glass-card">
          <h2 className="step-title">Step 2 · Nutritional & Safety Analysis</h2>
          <ProductDetails
            product={product}
            onUploadIngredients={handleOCRScan}
            loadingOCR={loadingOCR}
            loadingPhase={loadingPhase}
          />
        </section>
      )}

      {(loadingOCR || loadingPhase > 0) && (
        <div className="loading-overlay">
          <div className="loader"></div>
          <strong>{loadingOCR ? "Neural Processing..." : (phaseMessages[loadingPhase] || "Loading...")}</strong>
        </div>
      )}

      {(mergedHarmful.length > 0 || freqAnalysis) && (
        <section className="card glass-card harmful-section">
          <h2 className="step-title">🛡️ Ingredient Safety Assessment</h2>
          <HarmfulReport report={mergedHarmful} frequency={freqAnalysis} />
        </section>
      )}
    </div>
  );
};

export default PackageFood;