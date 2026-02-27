import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  RestaurantMenu as MealIcon,
  EventNote as DietIcon,
  Inventory2 as PackageIcon,
  TrendingUp as ProgressIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import "./Navbar.css";

const Navbar = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setIsOpen(open);
  };

  const handleLogout = () => {
    logout();
    navigate("/signin");
    setIsOpen(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Meal Log", path: "/meal-log", icon: <MealIcon /> },
    { label: "Diet Plan", path: "/diet-plan", icon: <DietIcon /> },
    { label: "Package Food", path: "/package-food", icon: <PackageIcon /> },
    { label: "Progress", path: "/progress", icon: <ProgressIcon /> },
    { label: "My Profile", path: "/profile", icon: <ProfileIcon /> },
  ];

  const userName = currentUser?.name || currentUser?.displayName || "User";
  const userEmail = currentUser?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

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

        {isMobile ? (
          <>
            <IconButton
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              className="hamburger-btn"
              disableRipple
              sx={{
                padding: '8px',
                borderRadius: '10px',
                '&:hover': {
                  backgroundColor: 'rgba(31, 122, 76, 0.08)',
                },
                '&:focus': {
                  outline: 'none',
                },
              }}
            >
              <MenuIcon sx={{ fontSize: 26 }} />
            </IconButton>
            <Drawer
              anchor="right"
              open={isOpen}
              onClose={toggleDrawer(false)}
              classes={{ paper: "mobile-drawer" }}
            >
              {/* Drawer Content Wrapper */}
              <Box className="drawer-content-wrapper">
                {/* Close Button */}
                <Box className="drawer-close-row">
                  <IconButton
                    onClick={toggleDrawer(false)}
                    className="drawer-close-btn"
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>

                {/* Profile Section */}
                <Box
                  className="drawer-profile"
                  onClick={() => handleNavigate("/profile")}
                >
                  <Avatar className="drawer-avatar">
                    {userInitial}
                  </Avatar>
                  <Box className="drawer-profile-info">
                    <Typography className="drawer-profile-name">
                      {userName}
                    </Typography>
                    {userEmail && (
                      <Typography className="drawer-profile-email">
                        {userEmail}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Navigation Items */}
                <List className="mobile-nav-list">
                  {menuItems.map((item) => (
                    <ListItem
                      button
                      key={item.label}
                      onClick={() => handleNavigate(item.path)}
                      className={`mobile-nav-item ${location.pathname === item.path ? "active" : ""}`}
                    >
                      <ListItemIcon className="mobile-nav-icon">
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '15px',
                          fontWeight: location.pathname === item.path ? 600 : 500,
                        }}
                      />
                    </ListItem>
                  ))}
                </List>

                {/* Logout at bottom */}
                <Box className="drawer-footer">
                  <Button
                    fullWidth
                    className="mobile-logout-btn"
                    onClick={handleLogout}
                    startIcon={<LogoutIcon />}
                  >
                    Logout
                  </Button>
                </Box>
              </Box>
            </Drawer>
          </>
        ) : (
          <>
            <div className="nav-menu">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.button
                    key={item.label}
                    className={`nav-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavigate(item.path)}
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Logout
            </motion.button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
