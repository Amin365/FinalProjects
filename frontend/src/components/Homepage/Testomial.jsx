import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

/* ---------------- DATA ---------------- */

const testimonials = [
  {
    quote:
      "This platform revolutionized our workflow and improved our productivity.",
    name: "Priya Sharma",
    designation: "Data Scientist",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
  },
  {
    quote:
      "The UI is very intuitive and easy to use. My team loved it instantly.",
    name: "Marcus Johnson",
    designation: "Operations Manager",
    src: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5",
  },
  {
    quote:
      "Customer support is excellent. Fast response and very helpful.",
    name: "Isabella Rossi",
    designation: "Client Manager",
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
  },
];

/* ---------------- COMPONENT ---------------- */

export default function TestimonialSection({
  title = "What Our Users Say",
  description = "Real feedback from people using our platform every day.",
}) {
  const [active, setActive] = useState(0);

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % testimonials.length);
  }, []);

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
  }, [handleNext]);

  const randomRotate = () => `${Math.floor(Math.random() * 16) - 8}deg`;

  return (
    <section className="w-full py-20 bg-white dark:bg-slate-950">

      {/* ✅ HEADER */}
      <div className="mx-auto max-w-4xl px-6 text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-4 text-sm md:text-base text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-5xl px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        {/* IMAGE SECTION */}
        <div className="relative h-80 w-full max-w-sm mx-auto">
          <AnimatePresence>
            {testimonials.map((t, index) => (
              <motion.div
                key={t.src}
                initial={{ opacity: 0, scale: 0.9, y: 50, rotate: randomRotate() }}
                animate={{
                  opacity: index === active ? 1 : 0.5,
                  scale: index === active ? 1 : 0.9,
                  y: index === active ? 0 : 20,
                  rotate: index === active ? "0deg" : randomRotate(),
                  zIndex: index === active ? 10 : 1,
                }}
                exit={{ opacity: 0, scale: 0.9, y: -50 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <img
                  src={t.src}
                  alt={t.name}
                  className="h-full w-full rounded-3xl object-cover shadow-2xl"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/500x500?text=User";
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* TEXT SECTION */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {testimonials[active].name}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                {testimonials[active].designation}
              </p>

              <p className="mt-6 text-lg text-slate-700 dark:text-slate-300">
                "{testimonials[active].quote}"
              </p>
            </motion.div>
          </AnimatePresence>

          {/* ✅ FIXED BUTTONS (DARK MODE SAFE) */}
          <div className="flex gap-4 mt-10">
            <button
              onClick={handlePrev}
              className="flex h-12 w-12 items-center justify-center rounded-full
              bg-slate-100 text-slate-800
              hover:bg-orange-500 hover:text-white
              dark:bg-slate-800 dark:text-white dark:hover:bg-orange-500
              transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <button
              onClick={handleNext}
              className="flex h-12 w-12 items-center justify-center rounded-full
              bg-slate-100 text-slate-800
              hover:bg-orange-500 hover:text-white
              dark:bg-slate-800 dark:text-white dark:hover:bg-orange-500
              transition-all"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}