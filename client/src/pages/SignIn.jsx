import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { API } from "../config/api";
import { useGoogleLogin } from '@react-oauth/google';
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

import { isValidEmail } from "../utils/validation";

// ... existing imports

const SignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API.AUTH}/login`, { email, password });

      if (!res.data.success) {
        setError(res.data.message || "Login failed.");
        return;
      }

      login(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // Custom Google Login Hook
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        // Send access_token to backend
        const res = await axios.post(`${API.AUTH}/google-login`, {
          accessToken: tokenResponse.access_token,
        });

        if (res.data.success) {
          login(res.data.user, res.data.token);
          navigate("/dashboard");
        } else {
          setError(res.data.message || "Google login failed.");
        }
      } catch (err) {
        setError("Google verification failed. Try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google Sign-In was unsuccessful. Try again."),
  });

  const handleGoogleFailure = () => {
    setError("Google Sign-In was unsuccessful. Try again.");
  };

  return (
    <Box className="auth-page-wrapper">
      <Container maxWidth="sm" className="animate-entrance">
        <Card className="auth-glass-card" elevation={0}>
          <CardContent sx={{ textAlign: "center", p: 0 }}>
            <Typography variant="h3" className="auth-header staggered-1">
              Welcome Back
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            {/* Google Custom Button */}
            <button onClick={() => googleLogin()} className="google-custom-btn staggered-2">
              <svg className="google-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.213,0-9.634-3.322-11.286-7.962l-6.528,5.021C9.682,39.594,16.345,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <Divider className="auth-divider staggered-3">
              <span className="auth-divider-text">OR LOGIN WITH EMAIL</span>
            </Divider>

            <Box component="form" noValidate sx={{ mt: 1 }} className="staggered-4">
              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                className="auth-input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                className="auth-input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button
                fullWidth
                variant="contained"
                className="auth-submit-btn"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? <CircularProgress size={26} color="inherit" /> : "Sign In"}
              </Button>
            </Box>

            <Typography variant="body2" className="auth-footer-text staggered-5">
              New to Nutralyze?
              <Button
                onClick={() => navigate("/signup")}
                className="auth-action-link"
              >
                Create Account
              </Button>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default SignIn;
