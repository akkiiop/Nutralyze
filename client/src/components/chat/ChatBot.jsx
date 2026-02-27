import "regenerator-runtime/runtime";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import {
  Box,
  IconButton,
  TextField,
  Paper,
  CircularProgress,
  Typography,
  Fab,
  Tooltip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const ChatBot = () => {
  const { currentUser } = useAuth();

  // Speech Recognition Hooks
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lang, setLang] = useState("en-US");
  const messagesEndRef = useRef(null);

  const LANGUAGES = [
    { code: "en-US", label: "EN" },
    { code: "hi-IN", label: "HI" },
    { code: "mr-IN", label: "MR" },
  ];

  const TRANSLATIONS = {
    "en-US": {
      placeholder: "Ask anything...",
      greeting: "Hi",
      intro: "I'm your AI Nutrition Assistant. Ask me about calories, ingredients, diet plans or food safety.",
      suggestions: [
        "Scan this food and tell me calories",
        "Is palm oil harmful?",
        "Create a weight gain diet plan",
        "Analyze ingredients from this label"
      ],
      assistantName: "AI Nutrition Assistant"
    },
    "hi-IN": {
      placeholder: "कुछ भी पूछें...",
      greeting: "नमस्ते",
      intro: "मैं आपका AI पोषण सहायक हूं। मुझसे कैलोरी, सामग्री, आहार योजना या खाद्य सुरक्षा के बारे में पूछें।",
      suggestions: [
        "इस भोजन को स्कैन करें और कैलोरी बताएं",
        "क्या पाम तेल हानिकारक है?",
        "वजन बढ़ाने की आहार योजना बनाएं",
        "इस लेबल की सामग्री का विश्लेषण करें"
      ],
      assistantName: "AI पोषण सहायक"
    },
    "mr-IN": {
      placeholder: "काहीही विचारा...",
      greeting: "नमस्कार",
      intro: "मी तुमचा AI पोषण सहाय्यक आहे. मला कॅलरीज, घटक, आहार योजना किंवा अन्न सुरक्षा याबद्दल विचारा.",
      suggestions: [
        "हे अन्न स्कॅन करा आणि मला कॅलरीज सांगा",
        "पाम तेल हानिकारक आहे का?",
        "वजन वाढवण्यासाठी आहार योजना बनवा",
        "या लेबलमधील घटकांचे विश्लेषण करा"
      ],
      assistantName: "AI पोषण सहाय्यक"
    }
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS["en-US"];

  useEffect(() => {
    if (!currentUser || !open) return;

    const token = localStorage.getItem("token");

    api
      .get("/api/chat/messages", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data.messages || []))
      .catch(() => console.log("No chat history found."));
  }, [currentUser, open]);

  // Sync Transcript to Input
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Clean Text for Audio
  const cleanTextForSpeech = (text) => {
    if (!text) return "";
    return text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "") // Remove emojis
      .replace(/[*#_`~>\-]/g, "") // Remove markdown chars
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Links
      .replace(/\n\n/g, ". ")
      .replace(/\n/g, ", ")
      .replace(/\//g, " post ")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Speak Text
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const cleanText = cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Set language-specific voice
      const voices = window.speechSynthesis.getVoices();
      // Try to find exact match first, then language code match
      const preferredVoice = voices.find(v => v.lang === lang) ||
        voices.find(v => v.lang.startsWith(lang.split('-')[0]));

      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.lang = lang;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Stop Speaking
  const handleStopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const sendMessage = async (textOverride = null) => {
    if (listening) SpeechRecognition.stopListening();
    if (isSpeaking) handleStopSpeaking();

    const messageToSend = typeof textOverride === "string" ? textOverride : input;

    if (!messageToSend.trim()) return;

    const userMessage = { role: "user", text: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    resetTranscript();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await api.post(
        "/api/chat/send",
        { message: messageToSend, language: lang },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const botMessage = { role: "assistant", text: res.data.reply };
      setMessages((prev) => [...prev, botMessage]);
      speak(res.data.reply);

    } catch (err) {
      console.error("Chatbot API error:", err);
    }

    setLoading(false);
  };

  const handleMicClick = () => {
    if (isSpeaking) handleStopSpeaking();

    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: lang });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!currentUser) return null;
  if (!browserSupportsSpeechRecognition) {
    console.warn("Browser does not support speech recognition.");
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <Fab
        onClick={() => {
          setOpen(!open);
          if (open) {
            if (listening) SpeechRecognition.stopListening();
            handleStopSpeaking();
          }
        }}
        sx={{
          position: "fixed",
          bottom: { xs: 16, sm: 25 },
          right: { xs: 16, sm: 25 },
          zIndex: 1500,
          width: { xs: 52, sm: 56 },
          height: { xs: 52, sm: 56 },
          bgcolor: open ? "#0f172a" : "#10b981",
          color: "white",
          boxShadow: open ? "0 10px 30px rgba(15, 23, 42, 0.3)" : "0 10px 30px rgba(16, 185, 129, 0.3)",
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          "&:hover": {
            bgcolor: open ? "#1e293b" : "#059669",
            transform: 'scale(1.1) rotate(5deg)',
          }
        }}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {open && (
        <Paper
          elevation={12}
          sx={{
            position: "fixed",
            bottom: { xs: 0, sm: 90 },
            right: { xs: 0, sm: 25 },
            left: { xs: 0, sm: 'auto' },
            top: { xs: 0, sm: 'auto' },
            width: { xs: '100%', sm: 380 },
            height: { xs: '100%', sm: 550 },
            maxHeight: { xs: '100vh', sm: 550 },
            display: "flex",
            flexDirection: "column",
            borderRadius: { xs: 0, sm: '24px' },
            overflow: "hidden",
            zIndex: 1400,
            border: { xs: 'none', sm: '1px solid rgba(16, 185, 129, 0.1)' },
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
          }}
        >
          <Box
            sx={{
              p: 2.5,
              background: "white",
              color: "#1e293b",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', color: '#10b981' }}>
                {t.assistantName}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {LANGUAGES.map((l) => (
                <Typography
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    px: 1,
                    py: 0.4,
                    borderRadius: "6px",
                    bgcolor: lang === l.code ? "#10b981" : "transparent",
                    color: lang === l.code ? "white" : "#64748b",
                    border: lang === l.code ? "1px solid #10b981" : "1px solid #cbd5e1",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: lang === l.code ? "#059669" : "#f1f5f9",
                      borderColor: lang === l.code ? "#059669" : "#94a3b8"
                    }
                  }}
                >
                  {l.label}
                </Typography>
              ))}

              {isSpeaking && (
                <Tooltip title="Stop Speaking">
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: '#fee2e2',
                      color: '#ef4444',
                      border: '1px solid #fecaca',
                      '&:hover': { bgcolor: '#fecaca' }
                    }}
                    onClick={handleStopSpeaking}
                  >
                    <StopCircleIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          <Box sx={{ flex: 1, p: 2, overflowY: "auto", display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: '#fbfdfc' }}>
            {messages.length === 0 && (
              <Box
                sx={{
                  textAlign: "center",
                  p: 4,
                  animation: "fadeIn 0.6s ease-in-out",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%"
                }}
              >
                <Typography variant="h6" sx={{ fontSize: "22px", fontWeight: 600, color: "#059669", mb: 1 }}>
                  {t.greeting} {currentUser?.name || ""} 👋
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "14px", color: "#6B7280", maxWidth: 320, mb: 3, lineHeight: 1.5 }}>
                  {t.intro}
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.2 }}>
                  {t.suggestions.map((text, idx) => (
                    <Box
                      key={idx}
                      onClick={() => sendMessage(text)}
                      sx={{
                        backgroundColor: "#ECFDF5",
                        color: "#065F46",
                        border: "1px solid #A7F3D0",
                        px: 2,
                        py: 1,
                        borderRadius: "20px",
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: "#10B981",
                          color: "white",
                        }
                      }}
                    >
                      {text}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {messages.map((msg, i) => (
              <Box
                key={i}
                sx={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <Box
                  sx={{
                    p: 1.8,
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    bgcolor: msg.role === "user" ? "#0f172a" : "white",
                    color: msg.role === "user" ? "white" : "#1e293b",
                    boxShadow: msg.role === "user" ? "0 4px 15px rgba(15, 23, 42, 0.15)" : "0 2px 10px rgba(0,0,0,0.05)",
                    border: msg.role === "assistant" ? "1px solid rgba(16, 185, 129, 0.1)" : "none",
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.92rem',
                    lineHeight: 1.5,
                    "& p": { m: 0 },
                    "& ul, & ol": { m: 0.5, pl: 2 }
                  }}
                >
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </Box>
              </Box>
            ))}
            {loading && (
              <Box sx={{ alignSelf: 'flex-start', p: 1, bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                <CircularProgress size={16} thickness={5} sx={{ color: '#10b981' }} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ p: 2, borderTop: "1px solid rgba(0,0,0,0.05)", bgcolor: "white" }}>
            <Box sx={{ display: "flex", alignItems: 'center', gap: 1.5 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder={t.placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    "& fieldset": { borderColor: "transparent" },
                    "&:hover fieldset": { borderColor: "rgba(16, 185, 129, 0.3)" },
                    "&.Mui-focused fieldset": { borderColor: "#10b981", borderWidth: '1px' },
                  },
                  "& .MuiOutlinedInput-input": {
                    fontSize: '16px',
                  }
                }}
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={handleMicClick}
                  sx={{
                    bgcolor: listening ? "#ef4444" : "#f1f5f9",
                    color: listening ? "white" : "#64748b",
                    transition: 'all 0.3s ease',
                    "&:hover": { bgcolor: listening ? "#dc2626" : "#e2e8f0" },
                    animation: listening ? 'pulse 1.5s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
                      '70%': { transform: 'scale(1.1)', boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)' },
                      '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' }
                    }
                  }}
                >
                  {listening ? <MicOffIcon /> : <MicIcon />}
                </IconButton>

                <IconButton
                  onClick={sendMessage}
                  sx={{
                    bgcolor: "#10b981",
                    color: "white",
                    "&:hover": { bgcolor: "#059669", transform: 'translateY(-2px)' },
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <SendIcon sx={{ fontSize: '1.2rem' }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default ChatBot;
