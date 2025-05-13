import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import '../assets/scrollbar.css'
import React from "react";

const AnimatedScrollbar = ({ children }) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / windowHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative h-screen overflow-y-scroll animated-scrollbar">
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-purple-500"
        initial={{ width: "0%" }}
        animate={{ width: `${scrollProgress}%` }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />

      {/* Scrollable content */}
      <div className="p-10 space-y-10">{children}</div>
    </div>
  );
};

export default AnimatedScrollbar;
