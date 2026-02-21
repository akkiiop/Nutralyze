import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Stack,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  BarChart as BarChartIcon,
  Shield as ShieldIcon,
  Restaurant as RestaurantIcon,
  ShowChart as ShowChartIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import "../styles/Welcome.css";

const featureCards = [
  {
    icon: <PhotoCameraIcon sx={{ fontSize: 32, color: '#10b981' }} />,
    title: 'AI Food Scanner',
    description: 'Instantly detect food items and portion sizes using computer vision and deep learning.'
  },
  {
    icon: <BarChartIcon sx={{ fontSize: 32, color: '#10b981' }} />,
    title: 'Smart Nutrition Analysis',
    description: 'Get detailed calorie, protein, carb, fat, sugar, and fiber breakdown for every meal.'
  },
  {
    icon: <ShieldIcon sx={{ fontSize: 32, color: '#10b981' }} />,
    title: 'Food Safety Checker',
    description: 'Analyze packaged foods for harmful ingredients using global health databases.'
  },
  {
    icon: <RestaurantIcon sx={{ fontSize: 32, color: '#10b981' }} />,
    title: 'Personalized Diet Planner',
    description: 'Generate AI-powered diet plans based on goals, habits, and health conditions.'
  },
  {
    icon: <ShowChartIcon sx={{ fontSize: 32, color: '#10b981' }} />,
    title: 'Progress Monitoring',
    description: 'Track daily nutrition, goals, and improvements with intelligent visual reports.'
  },
  {
    icon: <AssignmentIcon sx={{ fontSize: 32, color: '#10b981' }} />,
    title: 'Smart Meal Logging',
    description: 'Automatically log meals from scans, packaged foods, and manual entries.'
  }
];

const Welcome = () => {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    let particles = [];
    const particleCount = 40;

    // Path Data for silhouettes (Simplified/Stylized)
    const shapes = {
      apple: 'M10,20 Q10,10 20,10 Q30,10 30,20 Q30,35 20,35 Q10,35 10,20 M20,10 L20,5',
      carrot: 'M10,5 L30,5 L20,35 Z',
      broccoli: 'M15,20 Q10,15 15,10 Q20,5 25,10 Q30,15 25,20 L25,30 L15,30 Z',
      leaf: 'M10,20 Q20,10 30,20 Q20,30 10,20 M20,20 L20,10'
    };

    class MetabolicParticle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * 0.8 + 0.2; // Depth layer
        this.size = (20 + Math.random() * 30) * this.z;
        this.speed = (0.5 + Math.random() * 1.5) * this.z;
        this.angle = Math.random() * Math.PI * 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.opacity = 0.05 + (this.z * 0.1);

        const shapeKeys = Object.keys(shapes);
        this.shape = new Path2D(shapes[shapeKeys[Math.floor(Math.random() * shapeKeys.length)]]);
      }
      update(mX, mY) {
        // Organic Flow Field (Simplified)
        const flowAngle = Math.sin(this.x * 0.002) * Math.cos(this.y * 0.002) * Math.PI;
        this.angle += (flowAngle - this.angle) * 0.01;

        let vx = Math.cos(this.angle) * this.speed;
        let vy = Math.sin(this.angle) * this.speed;

        // Hydro-Kinetic Wake Effect (Mouse avoidance)
        const dx = mX - this.x;
        const dy = mY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          const force = (1 - dist / 250) * 1.5;
          vx -= (dx / dist) * force;
          vy -= (dy / dist) * force;
        }

        this.x += vx;
        this.y += vy;
        this.rotation += this.rotationSpeed;

        // Wrap around screen
        if (this.x < -100) this.x = canvas.width + 100;
        if (this.x > canvas.width + 100) this.x = -100;
        if (this.y < -100) this.y = canvas.height + 100;
        if (this.y > canvas.height + 100) this.y = -100;
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.size / 40, this.size / 40);

        ctx.strokeStyle = `rgba(16, 185, 129, ${this.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke(this.shape);

        // Subtle detail flow lines
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(5, 0);
        ctx.strokeStyle = `rgba(16, 185, 129, ${this.opacity * 0.5})`;
        ctx.stroke();

        ctx.restore();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new MetabolicParticle());
      }
    };

    let mX = 0, mY = 0;
    const handleMouse = (e) => { mX = e.clientX; mY = e.clientY; };
    window.addEventListener('mousemove', handleMouse);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sort for depth parallax
      particles.sort((a, b) => a.z - b.z);

      particles.forEach(p => {
        p.update(mX, mY);
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;

      // Calculate proximity to center for "Magnetic Blooming"
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const dist = Math.sqrt(Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2));
      const maxDist = Math.max(window.innerWidth, window.innerHeight) / 1.5;
      const proximity = Math.max(0, 1 - dist / maxDist);

      document.documentElement.style.setProperty('--mouse-px', `${clientX}px`);
      document.documentElement.style.setProperty('--mouse-py', `${clientY}px`);
      document.documentElement.style.setProperty('--mouse-y', `${clientY / window.innerHeight}`);
      document.documentElement.style.setProperty('--proximity', proximity.toFixed(2));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <Box className="welcome-page-wrapper">
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />
      <div className="aero-canvas" />

      {/* Hero Section */}
      <Container maxWidth="lg" className="hero-section" sx={{ position: 'relative', zIndex: 2 }}>
        <Typography
          variant="h1"
          className="brand-title animate-hero"
          data-text="NUTRALYZE"
        >
          NUTRA<span>LYZE</span>
        </Typography>

        <Typography
          variant="h5"
          className="hero-subtitle animate-hero stagger-1"
        >
          AI-Powered Nutrition & Food Safety Platform
        </Typography>

        <Box className="animate-hero stagger-2">
          <Button
            component={Link}
            to="/signin"
            variant="contained"
            className="cta-button"
          >
            Get Started
          </Button>
        </Box>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" className="feature-container">
        <Grid container spacing={4} className="animate-hero stagger-3">
          {featureCards.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box className="aero-card">
                <Box className="card-icon-wrapper">
                  {feature.icon}
                </Box>
                <Typography variant="h6" className="card-title">
                  {feature.title}
                </Typography>
                <Typography variant="body1" className="card-desc">
                  {feature.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Welcome;