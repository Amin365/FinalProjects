import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "../ui/animated-beam";

/*  Circle  */
const Circle = forwardRef(function Circle({ className, children }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
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
    <div ref={stepRef} className="relative flex flex-col items-center gap-2">
      <Circle>{icon}</Circle>
      <div className="text-center leading-tight">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </p>
        <p className="text-xs text-gray-600 dark:text-white">
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
      <header className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          How Our Club System Works
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-white">
          A simple and modern process that helps members connect and grow.
        </p>
      </header>

      {/* Diagram */}
      <div
        ref={containerRef}
        className="relative mx-auto flex min-h-[420px] max-w-3xl items-center justify-center px-6"
      >
        <div className="flex h-full w-full flex-col justify-between gap-12">
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
              <Circle className="size-16">
                {clubLogoSrc ? (
                  <img
                    src={clubLogoSrc}
                    alt="Club logo"
                    className="h-10 w-10 rounded-lg object-contain"
                  />
                ) : (
                  <Icons.clubLogo className="h-10 w-10" />
                )}
              </Circle>
              <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                Our Club
              </p>
              <p className="text-xs text-gray-600 dark:text-white">
                Community hub
              </p>
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

        {/* Beams */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={registerRef}
          toRef={centerRef}
          curvature={-70}
          endYOffset={-10}
        />

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={activitiesRef}
          toRef={centerRef}
        />

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={progressRef}
          toRef={centerRef}
          curvature={70}
          endYOffset={10}
        />

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={growRef}
          toRef={centerRef}
          curvature={-70}
          endYOffset={-10}
          reverse
        />
      </div>
    </section>
  );
}

/* - Icons - */
const Icons = {
  clubLogo: (props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12 2 20 6v6c0 5-3.2 9.4-8 10-4.8-.6-8-5-8-10V6l8-4z" />
      <path d="M8 10h8v2H8z" />
    </svg>
  ),

  register: () => (
    <svg viewBox="0 0 24 24">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2-8 4v2h16v-2c0-2-3.58-4-8-4z" />
    </svg>
  ),

  activities: () => (
    <svg viewBox="0 0 24 24">
      <path d="M13 2v8h8a8 8 0 0 0-8-8zM11 2a10 10 0 1 0 10 10h-10z" />
    </svg>
  ),

  progress: () => (
    <svg viewBox="0 0 24 24">
      <path d="M4 19h16v2H4zM6 17V7h2v10zm5 0V3h2v14zm5 0V11h2v6z" />
    </svg>
  ),

  grow: () => (
    <svg viewBox="0 0 24 24">
      <path d="M12 2l4 7h-3v6h-2V9H8l4-7zm-7 18h14v2H5z" />
    </svg>
  ),
};
