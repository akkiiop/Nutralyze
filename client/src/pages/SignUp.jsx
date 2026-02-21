import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { API } from "../config/api";
import { GoogleLogin } from '@react-oauth/google';
import "../styles/Auth.css";

import {
  Box,
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";

import { isValidEmail, isValidPassword } from "../utils/validation";

// ... existing imports

const SignUp = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSignup = async () => {
    const { name, email, password } = form;

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isValidPassword(password)) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API.AUTH}/signup`, form);

      if (!res.data.success) {
        setError(res.data.message || "Signup failed.");
        return;
      }

      navigate("/signin");
    } catch (err) {
      setError("Signup failed. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API.AUTH}/google-login`, {
        tokenId: credentialResponse.credential,
      });

      if (res.data.success) {
        login(res.data.user, res.data.token);
        navigate("/dashboard");
      } else {
        setError(res.data.message || "Google signup failed.");
      }
    } catch (err) {
      setError("Google verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setError("Google Sign-In was unsuccessful. Try again.");
  };

  return (
    <Box className="auth-page-wrapper">
      <Container maxWidth="sm" className="animate-entrance">
        <Card className="auth-glass-card" elevation={0}>
          <CardContent sx={{ textAlign: "center", p: 0 }}>
            <Typography variant="h3" className="auth-header staggered-1">
              Create Account
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <Box className="google-btn-wrapper staggered-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
                useOneTap
                theme="filled_blue"
                shape="pill"
                size="large"
                width="100% !important"
              />
            </Box>

            <Divider className="auth-divider staggered-3">
              <span className="auth-divider-text">OR SIGN UP WITH EMAIL</span>
            </Divider>

            <Box component="form" noValidate sx={{ mt: 1 }} className="staggered-4">
              <TextField
                fullWidth
                label="Full Name"
                variant="outlined"
                className="auth-input-field"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />

              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                className="auth-input-field"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                className="auth-input-field"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
              />

              <Button
                fullWidth
                variant="contained"
                className="auth-submit-btn"
                onClick={handleSignup}
                disabled={loading}
              >
                {loading ? <CircularProgress size={26} color="inherit" /> : "Create Account"}
              </Button>
            </Box>

            <Typography variant="body2" className="auth-footer-text staggered-5">
              Already have an account?
              <Button
                onClick={() => navigate("/signin")}
                className="auth-action-link"
              >
                Sign In
              </Button>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default SignUp;
