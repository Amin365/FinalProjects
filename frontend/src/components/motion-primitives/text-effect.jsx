import React from "react";
import { motion } from "framer-motion";

// Simple text effect helper. Supports per-line or whole block animation with fade/blur.
export function TextEffect({
  as: Component = "div",
  children,
  preset = "fade-in-blur",
  speedSegment = 0.15,
  delay = 0,
  per = "block", // "block" or "line"
  className = "",
}) {
  const variants = {
    hidden: { opacity: 0, filter: "blur(8px)", y: 8 },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { duration: speedSegment, delay },
    },
  };

  if (per === "line" && typeof children === "string") {
    const lines = children.split("\n");
    return (
      <div className={className}>
        {lines.map((line, idx) => (
          <motion.div
            key={idx}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-16%" }}
            transition={{ delay: delay + idx * speedSegment }}
            variants={variants}
          >
            <Component>{line}</Component>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-16%" }}
      variants={variants}
      className={className}
    >
      <Component>{children}</Component>
    </motion.div>
  );
}
