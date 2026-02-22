import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import "./Navbar.css";

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const menuItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Meal Log", path: "/meal-log" },
    { label: "Diet Plan", path: "/diet-plan" },
    { label: "Package Food", path: "/package-food" },
    { label: "Progress", path: "/progress" },
    { label: "My Profile", path: "/profile" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <motion.div
          className="nav-logo"
          onClick={() => navigate("/dashboard")}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="logo-nutra">NUTRA</span>
          <span className="logo-lyze">LYZE</span>
          <span className="logo-dot">.</span>
        </motion.div>

        <div className="nav-menu">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.label}
                className={`nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {isActive && (
                  <motion.div
                    className="active-bg"
                    layoutId="activeTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="nav-text">{item.label}</span>
              </motion.button>
            );
          })}
        </div>

        <motion.button
          className="logout-btn"
          onClick={handleLogout}
          whileHover={{ scale: 1.05, backgroundColor: "#FEE2E2" }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          Logout
        </motion.button>
      </div>
    </nav>
  );
};

export default Navbar;
