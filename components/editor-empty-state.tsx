'use client';

import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { FileText, FolderOpen, Users, Shield, KeyRound, Command, ChevronRight, FileEdit } from 'lucide-react';

export function EditorEmptyState() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeOrb, setActiveOrb] = useState(0);
  const controls = useAnimation();

  // Generate static particle positions (avoid hydration mismatch)
  const [particles] = useState(() => {
    return [...Array(20)].map((_, i) => ({
      x: (i * 37) % 100, // Deterministic but scattered
      y: (i * 61) % 100,
      size: 1 + (i % 3),
      duration: 4 + (i % 3),
      delay: i * 0.2,
    }));
  });

  const orbIcons = [
    { Icon: FileText, label: 'Config Files', color: '#bb9af7', gradient: 'from-purple-500 to-pink-500' },
    { Icon: Users, label: 'Users', color: '#ff9e64', gradient: 'from-amber-500 to-orange-500' },
    { Icon: Shield, label: 'Clients', color: '#c084fc', gradient: 'from-purple-400 to-violet-500' },
    { Icon: KeyRound, label: 'Certificates', color: '#9ece6a', gradient: 'from-green-500 to-emerald-500' },
  ];

  useEffect(() => {
    setIsMounted(true);

    const interval = setInterval(() => {
      setActiveOrb((prev) => (prev + 1) % orbIcons.length);
    }, 3500);

    controls.start({
      rotate: 360,
      transition: { duration: 20, repeat: Infinity, ease: 'linear' }
    });

    return () => clearInterval(interval);
  }, [controls, orbIcons.length]);

  return (
    <motion.div
      className="h-full w-full flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top, #161b22 0%, #0d1117 50%, #000000 100%)',
      }}
      suppressHydrationWarning
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 opacity-30">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#7aa2f7', stopOpacity: 0.2 }} />
              <stop offset="50%" style={{ stopColor: '#bb9af7', stopOpacity: 0.1 }} />
              <stop offset="100%" style={{ stopColor: '#9ece6a', stopOpacity: 0.2 }} />
            </linearGradient>
            <pattern id="dots" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#7aa2f7" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Orbiting Rings */}
      {isMounted && (
        <>
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={`ring-${ring}`}
              className="absolute top-1/2 left-1/2 pointer-events-none"
              style={{
                width: `${ring * 200}px`,
                height: `${ring * 200}px`,
                border: `1px solid rgba(122, 162, 247, ${0.1 / ring})`,
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                rotate: ring % 2 === 0 ? 360 : -360,
                scale: [1, 1.05, 1],
              }}
              transition={{
                rotate: { duration: 15 + ring * 5, repeat: Infinity, ease: 'linear' },
                scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
          ))}
        </>
      )}

      {/* Floating Particles with Glow */}
      {isMounted && particles.map((particle, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `radial-gradient(circle, rgba(122, 162, 247, 0.8), rgba(187, 154, 247, 0.4))`,
            boxShadow: `0 0 ${particle.size * 8}px rgba(122, 162, 247, 0.6)`,
          }}
          animate={{
            y: [-30, 30, -30],
            x: [-20, 20, -20],
            opacity: [0.3, 0.8, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Central Content - Redesigned */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Main Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 w-full">

          {/* Left: Animated 3D Orb Constellation */}
          <motion.div
            className="relative w-64 h-64 sm:w-80 sm:h-80 flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Central Glowing Orb */}
            <motion.div
              className="absolute top-1/2 left-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full"
              style={{
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle at 30% 30%, ${orbIcons[activeOrb].color}80, ${orbIcons[activeOrb].color}20)`,
                boxShadow: `0 0 60px ${orbIcons[activeOrb].color}60, inset 0 0 30px ${orbIcons[activeOrb].color}40`,
              }}
              animate={{
                boxShadow: [
                  `0 0 60px ${orbIcons[activeOrb].color}60, inset 0 0 30px ${orbIcons[activeOrb].color}40`,
                  `0 0 100px ${orbIcons[activeOrb].color}80, inset 0 0 50px ${orbIcons[activeOrb].color}60`,
                  `0 0 60px ${orbIcons[activeOrb].color}60, inset 0 0 30px ${orbIcons[activeOrb].color}40`,
                ],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  key={activeOrb}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.5 }}
                >
                  {React.createElement(orbIcons[activeOrb].Icon, {
                    className: "w-12 h-12 sm:w-16 sm:h-16",
                    style: { color: '#ffffff', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }
                  })}
                </motion.div>
              </div>
            </motion.div>

            {/* Orbiting Feature Icons - Evenly spaced for 4 icons */}
            {orbIcons.map((orb, index) => {
              const radius = 110; // Orbit radius in pixels
              const totalIcons = orbIcons.length; // 4 icons
              const anglePerIcon = 360 / totalIcons; // 90° for 4 icons
              const startAngle = -90; // Start from top (12 o'clock position)
              const initialRotation = startAngle + (index * anglePerIcon); // Each icon's starting angle

              return (
                <motion.div
                  key={index}
                  className="absolute"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  initial={{
                    rotate: initialRotation,
                  }}
                  animate={{
                    rotate: initialRotation + 360,
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <motion.div
                    className="relative"
                    style={{
                      x: radius,
                      y: 0,
                    }}
                    animate={{
                      scale: activeOrb === index ? [1, 1.2, 1] : 1,
                      rotate: -initialRotation - 360, // Counter-rotate to keep icon upright
                    }}
                    transition={{
                      scale: { duration: 0.8, repeat: activeOrb === index ? Infinity : 0, repeatType: 'reverse' },
                      rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
                    }}
                  >
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center backdrop-blur-xl border-2 transition-all duration-500"
                      style={{
                        background: `linear-gradient(135deg, ${orb.color}30, ${orb.color}10)`,
                        borderColor: activeOrb === index ? orb.color : `${orb.color}40`,
                        boxShadow: activeOrb === index ? `0 0 30px ${orb.color}80` : `0 0 10px ${orb.color}30`,
                      }}
                    >
                      <orb.Icon
                        className="w-6 h-6 sm:w-8 sm:h-8"
                        style={{ color: activeOrb === index ? orb.color : `${orb.color}cc` }}
                      />
                    </div>

                    {/* Orbit Label */}
                    {activeOrb === index && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none"
                      >
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md" style={{
                          color: orb.color,
                          background: `${orb.color}20`,
                          border: `1px solid ${orb.color}60`,
                          boxShadow: `0 0 15px ${orb.color}30`,
                        }}>
                          {orb.label}
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Right: Content & CTA */}
          <motion.div
            className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Headline */}
            <motion.div
              className="mb-6"
              animate={{
                textShadow: [
                  '0 0 20px rgba(122, 162, 247, 0)',
                  '0 0 30px rgba(122, 162, 247, 0.4)',
                  '0 0 20px rgba(122, 162, 247, 0)',
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
                FreeRADIUS Editor
              </h1>
              <motion.div
                className="h-1 w-24 mx-auto lg:mx-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                animate={{
                  scaleX: [0.5, 1, 0.5],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            <p className="text-lg sm:text-xl text-gray-400 mb-8 leading-relaxed">
              Select a configuration file from the <span className="text-blue-400 font-semibold">sidebar</span> to begin editing your FreeRADIUS setup, or use the command palette for quick navigation.
            </p>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
              {[
                { icon: FolderOpen, label: 'Browse Configs', desc: 'Explore configuration files', color: '#7aa2f7' },
                { icon: Command, label: 'Quick Open', desc: 'Ctrl/Cmd + K', color: '#bb9af7' },
                { icon: Users, label: 'Manage Users', desc: 'Edit user configurations', color: '#ff9e64' },
                { icon: FileEdit, label: 'Edit Config', desc: 'Select any file to start', color: '#c084fc' },
              ].map((action, index) => (
                <motion.div
                  key={index}
                  className="group relative overflow-hidden rounded-xl p-4 border backdrop-blur-sm cursor-pointer transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${action.color}10, transparent)`,
                    borderColor: `${action.color}30`,
                  }}
                  whileHover={{
                    scale: 1.05,
                    borderColor: action.color,
                    boxShadow: `0 0 20px ${action.color}40`,
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${action.color}20`,
                        boxShadow: `0 0 15px ${action.color}30`,
                      }}
                    >
                      <action.icon className="w-5 h-5" style={{ color: action.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-200 mb-1">{action.label}</h3>
                      <p className="text-xs text-gray-500">{action.desc}</p>
                    </div>
                  </div>

                  {/* Hover effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle at center, ${action.color}15, transparent)`,
                    }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Keyboard Shortcuts */}
            <motion.div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-blue-400" />
                <span className="text-gray-500">Quick tip:</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-gray-800 text-gray-300 text-xs font-mono border border-gray-700">
                  Ctrl
                </kbd>
                <span className="text-gray-600">+</span>
                <kbd className="px-2 py-1 rounded bg-gray-800 text-gray-300 text-xs font-mono border border-gray-700">
                  K
                </kbd>
                <span className="text-gray-400 text-xs">for quick config search</span>
              </div>
            </motion.div>
          </motion.div>

        </div>

      </div>
    </motion.div>
  );
}
