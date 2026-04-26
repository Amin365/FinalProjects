import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "../ui/animated-beam";

/*  Circle  */
const Circle = forwardRef(function Circle({ className, children }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative z-10 flex size-14 items-center justify-center rounded-full border-2 border-orange-200 bg-gradient-to-br from-white to-orange-50 p-3 shadow-lg shadow-orange-100/50 backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl hover:shadow-orange-200/60",
        className
      )}
    >
      {children}
    </div>
  );
});

/*  Step Icon  */
function Step({ icon, title, subtitle, stepRef }) {
  return (
    <div ref={stepRef} className="group relative flex flex-col items-center gap-3">
      <Circle>{icon}</Circle>
      <div className="text-center leading-tight">
        <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors group-hover:text-orange-600">
          {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-300">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/*  Main Component  */
export function AnimatedBeamDemo({ clubLogoSrc }) {
  const containerRef = useRef(null);

  const registerRef = useRef(null);
  const activitiesRef = useRef(null);
  const progressRef = useRef(null);
  const growRef = useRef(null);
  const centerRef = useRef(null);

  return (
    <section className="w-full mt-12 mb-20">
      {/* Header */}
      <header className="mb-12 text-center space-y-3">
        <div className="inline-block">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            How Our Club System Works
          </h2>
          <div className="h-1 w-24 mx-auto mt-3 bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"></div>
        </div>
        <p className="mt-3 text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          A simple and modern process that helps members connect and grow together.
        </p>
      </header>

      {/* Diagram */}
      <div
        ref={containerRef}
        className="relative mx-auto flex min-h-[440px] max-w-4xl items-center justify-center px-6 py-8"
      >
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-200/20 dark:bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-300/20 dark:bg-orange-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative flex h-full w-full flex-col justify-between gap-16">
          {/* Top */}
          <div className="flex justify-between">
            <Step
              stepRef={registerRef}
              icon={<Icons.register />}
              title="Register"
              subtitle="Create your account"
            />

            <Step
              stepRef={growRef}
              icon={<Icons.grow />}
              title="Grow Together"
              subtitle="Build skills & connections"
            />
          </div>

          {/* Center */}
          <div className="flex justify-center">
            <div ref={centerRef} className="relative flex flex-col items-center">
              <Circle className="size-20 border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100 shadow-2xl shadow-orange-200/60 ring-4 ring-orange-100/50">
                {clubLogoSrc ? (
                  <img
                    src={clubLogoSrc}
                    alt="Club logo"
                    className="h-12 w-12 rounded-lg object-contain"
                  />
                ) : (
                  <Icons.clubLogo className="h-12 w-12 fill-orange-600" />
                )}
              </Circle>
              <div className="mt-3 text-center">
                <p className="text-base font-bold text-gray-900 dark:text-white">
                  Our Club
                </p>
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                  Community hub
                </p>
              </div>
              {/* Animated pulse ring */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 border-2 border-orange-300/40 rounded-full animate-ping"></div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex justify-between">
            <Step
              stepRef={activitiesRef}
              icon={<Icons.activities />}
              title="Join Activities"
              subtitle="Participate in events"
            />

            <Step
              stepRef={progressRef}
              icon={<Icons.progress />}
              title="Track Progress"
              subtitle="View involvement"
            />
          </div>
        </div>

        {/* Beams with orange gradient */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={registerRef}
          toRef={centerRef}
          curvature={-70}
          endYOffset={-10}
          gradientStartColor="#fb923c"
          gradientStopColor="#f97316"
        />

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={activitiesRef}
          toRef={centerRef}
          gradientStartColor="#fb923c"
          gradientStopColor="#f97316"
        />

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={progressRef}
          toRef={centerRef}
          curvature={70}
          endYOffset={10}
          gradientStartColor="#fb923c"
          gradientStopColor="#f97316"
        />

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={growRef}
          toRef={centerRef}
          curvature={-70}
          endYOffset={-10}
          reverse
          gradientStartColor="#fb923c"
          gradientStopColor="#f97316"
        />
      </div>

      {/* Optional: Feature badges */}
      <div className="mt-12 flex justify-center gap-6 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">Real-time Updates</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">Seamless Integration</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">Member Focused</span>
        </div>
      </div>
    </section>
  );
}

/* - Modern Icons with gradient fills - */
const Icons = {
  clubLogo: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2 20 6v6c0 5-3.2 9.4-8 10-4.8-.6-8-5-8-10V6l8-4z" />
      <circle cx="12" cy="11" r="3" fill="white" opacity="0.3" />
    </svg>
  ),

  register: () => (
    <svg viewBox="0 0 24 24" className="fill-orange-600 dark:fill-orange-500">
      <circle cx="12" cy="8" r="4" />
      <path d="M12 14c-4.42 0-8 2-8 4v2h16v-2c0-2-3.58-4-8-4z" />
    </svg>
  ),

  activities: () => (
    <svg viewBox="0 0 24 24" className="fill-orange-600 dark:fill-orange-500">
      <path d="M13 2v8h8a8 8 0 0 0-8-8z" opacity="0.6" />
      <path d="M11 2a10 10 0 1 0 10 10h-10z" />
    </svg>
  ),

  progress: () => (
    <svg viewBox="0 0 24 24" className="fill-orange-600 dark:fill-orange-500">
      <rect x="4" y="19" width="16" height="2" rx="1" />
      <rect x="6" y="7" width="2" height="10" rx="1" />
      <rect x="11" y="3" width="2" height="14" rx="1" />
      <rect x="16" y="11" width="2" height="6" rx="1" />
    </svg>
  ),

  grow: () => (
    <svg viewBox="0 0 24 24" className="fill-orange-600 dark:fill-orange-500">
      <path d="M12 2l4 7h-3v6h-2V9H8l4-7z" />
      <rect x="5" y="18" width="14" height="2" rx="1" />
    </svg>
  ),
};