// HarmfulReport.jsx
import { FaShieldAlt, FaExclamationCircle, FaInfoCircle } from "react-icons/fa";
import "./HarmfulReport.css";

const HarmfulReport = ({ report = [], frequency = null }) => {
  const hazards = report.filter((r) => r.label === "harmful");
  const warnings = report.filter((r) => r.label === "warning");

  // FREQUENCY CARD RENDERER
  const renderFrequencyCard = () => {
    if (!frequency) return null;
    const { level, color, advice } = frequency;

    // Map legacy colors to new soft classes if needed, or rely on CSS
    return (
      <div className={`frequency-card border-${color}`}>
        <div className={`freq-header bg-${color}`}>
          <h3>Consumption Advice</h3>
          <span className="freq-level">{level}</span>
        </div>
        <div className="freq-body">
          <p>{advice}</p>
        </div>
      </div>
    );
  };

  const renderSection = (items, title, icon, colorClass, badgeText) => {
    if (!items.length) return null;

    // colorClass: 'red' -> 'danger', 'orange' -> 'warning' for clearer semantics
    const themeClass = colorClass === 'red' ? 'danger' : 'warning';

    return (
      <div className={`hazard-report-group ${themeClass}-group`}>
        {/* COMPACT HEADER */}
        <div className="hazard-header-compact">
          <div className="hazard-title-group">
            {icon}
            <h2>{title}</h2>
          </div>
          <span className={`count-badge bg-${themeClass}`}>
            {items.length} {badgeText}
          </span>
        </div>

        {/* COMPACT LIST VIEW */}
        <div className="hazard-list-container">
          <div className="hazard-list-header">
            <span className="col-name">Ingredient</span>
            <span className="col-risk">Potential Health Impact</span> {/* Renamed */}
            <span className="col-sev">Severity</span>
          </div>

          <div className="hazard-list-body">
            {items.map((item, i) => (
              <div key={i} className="hazard-list-row">
                {/* 1. Name & Source */}
                <div className="col-name">
                  <span className="row-name">{item.ingredient}</span>
                  {item.source && <span className="row-source">({item.source})</span>}
                </div>

                {/* 2. Description (Reason) */}
                <div className="col-risk">
                  <p>{item.reason}</p>
                </div>

                {/* 3. Severity Badge */}
                <div className="col-sev">
                  <span className={`sev-badge sev-${item.severity?.toLowerCase()}`}>
                    {item.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!hazards.length && !warnings.length) {
    return (
      <div className="safe-status-container">
        <div className="safe-badge">
          <FaShieldAlt size={24} />
          <span>Clean Label: No high-risk ingredients detected.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hazard-report-wrapper">
      {renderFrequencyCard()}
      {renderSection(hazards, "High-Risk Ingredients Identified", <FaExclamationCircle />, "red", "ALERTS")}
      {renderSection(warnings, "Ingredients of Concern", <FaInfoCircle />, "orange", "WARNINGS")}
    </div>
  );
};

export default HarmfulReport;