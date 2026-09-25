"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface WeatherMotionSceneProps {
  condition: string;
  isNight?: boolean;
}

export function WeatherMotionScene({ condition, isNight = false }: WeatherMotionSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cond = condition.toLowerCase();

  const isThunder = cond.includes("thunder") || cond.includes("storm");
  const isSnow = cond.includes("snow") || cond.includes("ice") || cond.includes("blizzard") || cond.includes("sleet");
  const isRain = !isThunder && !isSnow && (cond.includes("rain") || cond.includes("shower") || cond.includes("drizzle") || cond.includes("monsoon"));
  const isFog = cond.includes("fog") || cond.includes("mist") || cond.includes("haze");
  const isCloudy = !isThunder && !isSnow && !isRain && !isFog && (cond.includes("cloud") || cond.includes("overcast"));
  const isSunny = !isThunder && !isSnow && !isRain && !isFog && !isCloudy;

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Sun / Moon Glowing Aura & Rays
      if (isSunny && !isNight) {
        gsap.to(".motion-sun-rays", {
          rotation: 360,
          duration: 36,
          repeat: -1,
          ease: "none",
          transformOrigin: "center center",
        });

        gsap.to(".motion-sun-glow", {
          scale: 1.15,
          opacity: 0.75,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        gsap.utils.toArray<HTMLElement>(".motion-sun-particle").forEach((particle, idx) => {
          gsap.to(particle, {
            y: "-=30",
            x: "+=15",
            opacity: 0,
            duration: 2.5 + idx * 0.4,
            repeat: -1,
            delay: idx * 0.6,
            ease: "power1.out",
          });
        });
      }

      // 2. Cloud Movement
      if (isCloudy || isRain || isThunder) {
        gsap.to(".motion-cloud-1", {
          x: "140%",
          duration: 30,
          repeat: -1,
          ease: "none",
        });

        gsap.to(".motion-cloud-2", {
          x: "140%",
          duration: 44,
          repeat: -1,
          ease: "none",
          delay: 8,
        });

        gsap.to(".motion-cloud-3", {
          x: "140%",
          duration: 22,
          repeat: -1,
          ease: "none",
          delay: 15,
        });

        gsap.to([".motion-cloud-1", ".motion-cloud-2", ".motion-cloud-3"], {
          y: "+=6",
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.5,
        });
      }

      // 3. Rain Drops Animation
      if (isRain || isThunder) {
        gsap.utils.toArray<HTMLElement>(".motion-raindrop").forEach((drop, idx) => {
          const dur = 0.65 + (idx % 5) * 0.1;
          const delay = (idx * 0.08) % 1.5;
          gsap.fromTo(
            drop,
            { y: -30, opacity: 0.7 },
            {
              y: 260,
              opacity: 0.2,
              duration: dur,
              repeat: -1,
              delay,
              ease: "none",
            }
          );
        });

        gsap.to(".motion-rain-splash", {
          scale: 1.6,
          opacity: 0,
          duration: 0.8,
          repeat: -1,
          stagger: 0.2,
          ease: "power1.out",
        });
      }

      // 4. Thunderstorm Lightning Flash
      if (isThunder) {
        const lightningTl = gsap.timeline({
          repeat: -1,
          repeatDelay: 4.5,
        });

        lightningTl
          .to(".motion-lightning-flash", { opacity: 0.85, duration: 0.06 })
          .to(".motion-lightning-flash", { opacity: 0.15, duration: 0.04 })
          .to(".motion-lightning-flash", { opacity: 0.95, duration: 0.08 })
          .to(".motion-lightning-flash", { opacity: 0, duration: 0.4 })
          .to(".motion-lightning-bolt", { opacity: 1, duration: 0.08 }, "-=0.55")
          .to(".motion-lightning-bolt", { opacity: 0, duration: 0.2 }, "-=0.35");
      }

      // 5. Snow Flakes Animation
      if (isSnow) {
        gsap.utils.toArray<HTMLElement>(".motion-snowflake").forEach((flake, idx) => {
          const fallDur = 3.5 + (idx % 6) * 0.5;
          const swayDur = 1.8 + (idx % 4) * 0.4;
          const delay = (idx * 0.15) % 2.5;

          gsap.fromTo(
            flake,
            { y: -20, opacity: 0.85 },
            {
              y: 270,
              opacity: 0.2,
              duration: fallDur,
              repeat: -1,
              delay,
              ease: "none",
            }
          );

          gsap.to(flake, {
            x: "+=22",
            rotation: 360,
            duration: swayDur,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay,
          });
        });
      }

      // 6. Fog / Mist Drifting
      if (isFog) {
        gsap.to(".motion-fog-1", {
          x: "+=45",
          opacity: 0.6,
          duration: 6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        gsap.to(".motion-fog-2", {
          x: "-=35",
          opacity: 0.45,
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        gsap.to(".motion-fog-3", {
          x: "+=25",
          opacity: 0.5,
          duration: 7,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isSunny, isNight, isCloudy, isRain, isThunder, isSnow, isFog]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0 rounded-2xl select-none"
      aria-hidden="true"
    >
      {/* 1. Sun Motion Graphic */}
      {isSunny && !isNight && (
        <div className="absolute -top-12 -right-12 w-80 h-80 flex items-center justify-center">
          {/* Ambient Glow */}
          <div className="motion-sun-glow absolute w-56 h-56 rounded-full bg-amber-400/20 blur-3xl" />

          {/* Rotating Ray Burst */}
          <svg
            className="motion-sun-rays absolute w-64 h-64 text-amber-400/25"
            viewBox="0 0 200 200"
            fill="none"
          >
            <circle cx="100" cy="100" r="32" fill="currentColor" opacity="0.3" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line
                key={deg}
                x1="100"
                y1="45"
                x2="100"
                y2="20"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                transform={`rotate(${deg} 100 100)`}
              />
            ))}
          </svg>

          {/* Core Sun Disc */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 shadow-[0_0_40px_rgba(251,191,36,0.6)]" />

          {/* Floating Light Shimmers */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="motion-sun-particle absolute w-2 h-2 rounded-full bg-yellow-200 shadow-sm"
              style={{
                top: `${40 + i * 12}%`,
                left: `${30 + i * 14}%`,
              }}
            />
          ))}
        </div>
      )}

      {/* 2. Moon Night Graphic */}
      {isNight && isSunny && (
        <div className="absolute -top-6 -right-6 w-60 h-60 flex items-center justify-center">
          <div className="absolute w-44 h-44 rounded-full bg-indigo-500/15 blur-2xl" />
          <svg className="w-24 h-24 text-sky-200 drop-shadow-[0_0_20px_rgba(186,230,253,0.4)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </div>
      )}

      {/* 3. Drifting Clouds (for Cloudy / Rain / Storm) */}
      {(isCloudy || isRain || isThunder) && (
        <>
          <div className="motion-cloud-1 absolute -top-4 -left-64 w-80 text-white/[0.07]">
            <svg viewBox="0 0 100 45" fill="currentColor">
              <path d="M10,40 Q25,15 45,28 Q60,10 75,25 Q90,20 95,40 Z" />
            </svg>
          </div>
          <div className="motion-cloud-2 absolute top-6 -left-72 w-96 text-sky-200/[0.05]">
            <svg viewBox="0 0 120 50" fill="currentColor">
              <path d="M15,45 Q35,12 60,30 Q80,8 100,28 Q115,22 118,45 Z" />
            </svg>
          </div>
          <div className="motion-cloud-3 absolute -top-8 -left-80 w-[420px] text-white/[0.04]">
            <svg viewBox="0 0 140 55" fill="currentColor">
              <path d="M10,50 Q40,15 75,35 Q100,10 125,32 Q138,25 140,50 Z" />
            </svg>
          </div>
        </>
      )}

      {/* 4. Falling Raindrops */}
      {(isRain || isThunder) && (
        <div className="absolute inset-0">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="motion-raindrop absolute w-[1.5px] h-4.5 bg-gradient-to-b from-sky-400/80 to-transparent rounded-full"
              style={{
                left: `${(i * 3.6 + 2)}%`,
                transform: "rotate(15deg)",
              }}
            />
          ))}
          {/* Surface ripples */}
          {[20, 45, 75].map((pos, idx) => (
            <div
              key={idx}
              className="motion-rain-splash absolute bottom-4 w-5 h-1 rounded-full border border-sky-400/40"
              style={{ left: `${pos}%` }}
            />
          ))}
        </div>
      )}

      {/* 5. Thunderstorm Lightning Layer */}
      {isThunder && (
        <>
          <div className="motion-lightning-flash absolute inset-0 bg-sky-200/25 pointer-events-none opacity-0" />
          <svg
            className="motion-lightning-bolt absolute top-4 right-1/4 w-12 h-32 text-amber-200 opacity-0 drop-shadow-[0_0_12px_rgba(253,230,138,0.9)]"
            viewBox="0 0 24 60"
            fill="currentColor"
          >
            <polygon points="14,0 4,28 12,28 8,60 22,24 14,24" />
          </svg>
        </>
      )}

      {/* 6. Snowflakes */}
      {isSnow && (
        <div className="absolute inset-0">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="motion-snowflake absolute rounded-full bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.8)]"
              style={{
                left: `${(i * 4.1 + 3)}%`,
                width: `${i % 3 === 0 ? 5 : i % 2 === 0 ? 3.5 : 2.5}px`,
                height: `${i % 3 === 0 ? 5 : i % 2 === 0 ? 3.5 : 2.5}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* 7. Undulating Fog / Mist */}
      {isFog && (
        <div className="absolute inset-0 flex flex-col justify-end pb-4 space-y-2 opacity-50">
          <div className="motion-fog-1 w-[120%] h-8 bg-gradient-to-r from-white/5 via-slate-300/20 to-white/5 rounded-full blur-md" />
          <div className="motion-fog-2 w-[115%] h-10 bg-gradient-to-r from-slate-200/5 via-sky-100/15 to-slate-200/5 rounded-full blur-lg -ml-8" />
          <div className="motion-fog-3 w-[125%] h-7 bg-gradient-to-r from-white/10 via-slate-200/25 to-white/10 rounded-full blur-md -ml-4" />
        </div>
      )}
    </div>
  );
}
