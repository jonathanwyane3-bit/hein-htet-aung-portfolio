import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

export type SlideId = 'top' | 'network' | 'education' | 'experience' | 'certificates' | 'contact';

export interface SlideDefinition {
  id: SlideId;
  index: string;
  label: string;
}

export const PORTFOLIO_SLIDES: SlideDefinition[] = [
  { id: 'top', index: '01', label: 'Executive Profile' },
  { id: 'network', index: '02', label: 'Network & Evidence' },
  { id: 'education', index: '03', label: 'Education & Skills' },
  { id: 'experience', index: '04', label: 'Experience & Awards' },
  { id: 'certificates', index: '05', label: 'Certificates' },
  { id: 'contact', index: '06', label: 'HR Fast-Track' },
];

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Top Scroll Progress Hairline + Right-Side Floating Slide Progress Dots
 */
export const FloatingSlideProgress: React.FC<{
  activeSlide: SlideId;
  onSelectSlide: (id: SlideId) => void;
}> = ({ activeSlide, onSelectSlide }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  const handleJump = (id: SlideId) => {
    onSelectSlide(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Subtle Top Scroll Progress Hairline */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FBBF24] origin-left z-50 pointer-events-none"
      />

      {/* Floating Right-Hand Slide Progress Dots (Desktop & Tablet) */}
      <aside
        aria-label="Slide Navigation"
        className="fixed right-3 lg:right-5 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-2.5 select-none"
      >
        <div className="bg-[#0B1120]/85 backdrop-blur-md border border-slate-800/90 rounded-2xl py-3 px-2 flex flex-col items-end gap-2 shadow-2xl">
          {PORTFOLIO_SLIDES.map((slide) => {
            const isActive = activeSlide === slide.id;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => handleJump(slide.id)}
                aria-label={`Jump to ${slide.index} ${slide.label}`}
                aria-current={isActive ? 'step' : undefined}
                className="group relative flex items-center justify-end gap-2.5 py-1 px-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] cursor-pointer"
              >
                {/* Hover / Active Slide Tooltip Label */}
                <span
                  className={`pointer-events-none absolute right-9 px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap border transition-all duration-200 ${
                    isActive
                      ? 'opacity-100 translate-x-0 bg-[#111C33] text-[#F8FAFC] border-[#F59E0B]/50 shadow-lg'
                      : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 bg-[#0B1120]/95 text-slate-300 border-slate-800'
                  }`}
                >
                  <span className="text-[#F59E0B] font-bold mr-1.5">{slide.index}</span>
                  <span>{slide.label}</span>
                </span>

                {/* Animated Progress Dot / Pill */}
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-2.5 h-6 bg-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.65)]'
                      : 'w-2 h-2 bg-slate-600 group-hover:bg-slate-300'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};

/**
 * Section-Level Smooth Scroll Reveal with Subtle 3D Depth
 * Animates opacity, vertical offset, scale, and subtle 3D perspective tilt as each slide enters view.
 */
export const SlideRevealSection: React.FC<{
  id?: string;
  className?: string;
  children: React.ReactNode;
  delay?: number;
}> = ({ id, className = '', children, delay = 0 }) => {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 36, scale: 0.975, rotateX: 4 }}
      whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      viewport={{ once: false, amount: 0.14, margin: '-40px 0px -40px 0px' }}
      transition={{
        duration: 0.68,
        delay,
        ease: EASE_OUT_EXPO,
      }}
      style={{ transformPerspective: 1200 }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

/**
 * Staggered Grid Container for Cards inside a Slide
 */
export const StaggerContainer: React.FC<{
  className?: string;
  children: React.ReactNode;
  staggerDelay?: number;
}> = ({ className = '', children, staggerDelay = 0.085 }) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.1 }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.05,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Individual Card Reveal with Subtle 3D Depth & Hover Elevation
 */
export const StaggerCard: React.FC<{
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  hoverLift?: boolean;
}> = ({ className = '', children, onClick, hoverLift = true }) => {
  return (
    <motion.div
      onClick={onClick}
      variants={{
        hidden: { opacity: 0, y: 26, scale: 0.96, rotateX: 5 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          transition: {
            duration: 0.56,
            ease: EASE_OUT_EXPO,
          },
        },
      }}
      whileHover={
        hoverLift
          ? {
              y: -4,
              transition: { duration: 0.18, ease: 'easeOut' },
            }
          : undefined
      }
      style={{ transformPerspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
