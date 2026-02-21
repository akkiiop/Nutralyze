import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { scanPackageFood } from "../../services/packageFoodApi";
import { normalizeIngredients } from "../../utils/normalizeIngredients";
import { FaCamera, FaKeyboard, FaInfoCircle } from "react-icons/fa";
import "./BarcodeScanner.css";

const BarcodeScanner = ({ onProductFetched, onHarmAnalyzed, setLoadingPhase, loadingPhase }) => {
  const scannerRef = useRef(null);
  const scanned = useRef(false);
  const [manualBarcode, setManualBarcode] = useState("");

  const analyzeWithML = async (ingredients) => {
    if (!ingredients || ingredients.length === 0) {
      if (typeof onHarmAnalyzed === "function") onHarmAnalyzed([]);
      return;
    }

    // Phase 4: Analyzing Safety
    if (setLoadingPhase) setLoadingPhase(4);

    try {
      const normalized = normalizeIngredients(ingredients);
      const res = await fetch("http://localhost:8002/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: normalized }),
      });
      const data = await res.json();

      // Phase 5: Finalizing
      if (setLoadingPhase) setLoadingPhase(5);

      // Short delay to let user see "Finalizing"
      await new Promise(r => setTimeout(r, 600));

      if (typeof onHarmAnalyzed === "function") onHarmAnalyzed(data.results || []);
    } catch (error) {
      console.error("ML Analysis failed:", error);
    }
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "barcode-reader",
      {
        fps: 15,
        qrbox: { width: 250, height: 150 },
        showScanImageFile: false,
        rememberLastUsedCamera: false,
      },
      false
    );
    scannerRef.current = scanner;
    scanner.render(async (text) => {
      if (scanned.current) return;
      scanned.current = true;

      // Phase 1: Processing Barcode
      if (setLoadingPhase) setLoadingPhase(1);

      try {
        // Phase 2: Fetching Product Details
        if (setLoadingPhase) setLoadingPhase(2);

        const res = await scanPackageFood(text.trim());
        onProductFetched(res.product);

        // Phase 3: Extracting Ingredients
        if (setLoadingPhase) setLoadingPhase(3);

        const ingredients = res.product?.ingredients?.list || res.product?.ingredients_text?.split(",") || [];
        await analyzeWithML(ingredients);
      } catch (err) {
        console.error(err);
        scanned.current = false;
        alert("Product not found or error occurred.");
      } finally {
        if (setLoadingPhase) setLoadingPhase(0);
        scanner.clear().catch(() => { });
        // NOTE: scanned.current remains true to prevent rapid re-scan loop until component remount
        // or user manually resets. If you want continuous scanning, set it to false here.
      }
    });
    return () => scanner.clear().catch(() => { });
  }, [onProductFetched, onHarmAnalyzed, setLoadingPhase]);

  const handleManualSubmit = async () => {
    if (!manualBarcode.trim()) return;

    // Phase 1: Processing Barcode
    if (setLoadingPhase) setLoadingPhase(1);

    try {
      // Phase 2: Fetching Product
      if (setLoadingPhase) setLoadingPhase(2);

      const res = await scanPackageFood(manualBarcode.trim());
      onProductFetched(res.product);

      // Phase 3: Extracting Ingredients
      if (setLoadingPhase) setLoadingPhase(3);

      const ingredients = res.product?.ingredients?.list || res.product?.ingredients_text?.split(",") || [];
      await analyzeWithML(ingredients);
    } catch (err) {
      console.error(err);
      alert("Product not found or error occurred.");
    } finally {
      if (setLoadingPhase) setLoadingPhase(0);
    }
  };

  return (
    <div className="scanner-interface-container">
      <div className="interface-grid">

        {/* CARD 1: OPTICAL SCANNER */}
        <div className="interface-card optical-card">
          <div className="card-top-decoration"></div>
          <div className="card-header">
            <FaCamera className="header-icon" />
            <h3>Optical Scanner</h3>
          </div>

          <div className="scanner-frame-wrapper">
            <div className="scan-corner tl"></div>
            <div className="scan-corner tr"></div>
            <div className="scan-corner bl"></div>
            <div className="scan-corner br"></div>
            <div id="barcode-reader" />
          </div>

          {/* Footer Removed */}
        </div>

        {/* CARD 2: MANUAL ENTRY */}
        <div className="interface-card manual-card">
          <div className="card-top-decoration secondary"></div>
          <div className="card-header">
            <FaKeyboard className="header-icon" />
            <h3>Manual Entry</h3>
          </div>

          <div className="manual-content">
            <p className="card-desc">Enter the 13-digit EAN or UPC code below</p>
            <div className={`cyber-input-field ${loadingPhase > 0 ? "locked" : ""}`}>
              <input
                type="text"
                className="glow-input"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="0000000000000"
                disabled={loadingPhase > 0}
              />
              <div className="input-glow-bar"></div>
            </div>

            <button
              className={`premium-btn ${loadingPhase > 0 ? "loading" : ""}`}
              onClick={handleManualSubmit}
              disabled={loadingPhase > 0}
            >
              {loadingPhase > 0 ? (
                <>
                  <span className="spinner-mini"></span>
                  <span className="btn-text">PROCESSING...</span>
                </>
              ) : (
                <>
                  <span className="btn-text">INITIALIZE SEARCH</span>
                  <div className="btn-shine"></div>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BarcodeScanner;