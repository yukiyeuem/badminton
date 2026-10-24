import React from 'react';

interface BadmintonCourtSvgProps {
  className?: string;
  teamANames?: [string, string];
  teamBNames?: [string, string];
  scoreA?: number;
  scoreB?: number;
  activeServe?: 'A' | 'B';
}

export const BadmintonCourtSvg: React.FC<BadmintonCourtSvgProps> = ({
  className = 'w-full h-48',
  teamANames,
  teamBNames,
  scoreA = 0,
  scoreB = 0,
  activeServe,
}) => {
  return (
    <div className={`relative rounded-xl overflow-hidden shadow-inner bg-emerald-950/60 border border-emerald-500/30 p-2 ${className}`}>
      <svg
        viewBox="0 0 600 320"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="courtMat" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="50%" stopColor="#065f46" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <filter id="courtShadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Court Mat Surface */}
        <rect
          x="20"
          y="20"
          width="560"
          height="280"
          rx="8"
          fill="url(#courtMat)"
          stroke="#10b981"
          strokeWidth="3"
        />

        {/* Outer boundary lines (Doubles Court: 13.4m x 6.1m proportion) */}
        <rect
          x="35"
          y="35"
          width="530"
          height="250"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          opacity="0.9"
        />

        {/* Singles Sidelines (0.46m from doubles sideline) */}
        <line x1="35" y1="52" x2="565" y2="52" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.65" />
        <line x1="35" y1="268" x2="565" y2="268" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.65" />

        {/* Doubles Long Service Lines (0.76m inside baseline) */}
        <line x1="55" y1="35" x2="55" y2="285" stroke="#ffffff" strokeWidth="1.5" opacity="0.75" />
        <line x1="545" y1="35" x2="545" y2="285" stroke="#ffffff" strokeWidth="1.5" opacity="0.75" />

        {/* Short Service Lines (1.98m from net) */}
        <line x1="225" y1="35" x2="225" y2="285" stroke="#ffffff" strokeWidth="2" opacity="0.85" />
        <line x1="375" y1="35" x2="375" y2="285" stroke="#ffffff" strokeWidth="2" opacity="0.85" />

        {/* Center Lines (from short service line to back boundary) */}
        <line x1="35" y1="160" x2="225" y2="160" stroke="#ffffff" strokeWidth="1.8" opacity="0.8" />
        <line x1="375" y1="160" x2="565" y2="160" stroke="#ffffff" strokeWidth="1.8" opacity="0.8" />

        {/* NET (Center 300) */}
        <line x1="300" y1="25" x2="300" y2="295" stroke="#f8fafc" strokeWidth="4.5" />
        {/* Net mesh pattern */}
        <line x1="298" y1="25" x2="298" y2="295" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="302" y1="25" x2="302" y2="295" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />

        {/* Net Posts */}
        <circle cx="300" cy="25" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="300" cy="295" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />

        {/* Side Labels */}
        <text x="130" y="25" fill="#a7f3d0" fontSize="12" fontWeight="700" letterSpacing="2" opacity="0.8" textAnchor="middle">
          TEAM A (ĐỘI 1)
        </text>
        <text x="470" y="25" fill="#bae6fd" fontSize="12" fontWeight="700" letterSpacing="2" opacity="0.8" textAnchor="middle">
          TEAM B (ĐỘI 2)
        </text>

        {/* Player indicators Team A */}
        {teamANames && (
          <g>
            <circle cx="120" cy="100" r="14" fill="#047857" stroke="#34d399" strokeWidth="2" />
            <text x="120" y="104" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">A1</text>
            <circle cx="120" cy="220" r="14" fill="#047857" stroke="#34d399" strokeWidth="2" />
            <text x="120" y="224" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">A2</text>
          </g>
        )}

        {/* Player indicators Team B */}
        {teamBNames && (
          <g>
            <circle cx="480" cy="100" r="14" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
            <text x="480" y="104" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">B1</text>
            <circle cx="480" cy="220" r="14" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
            <text x="480" y="224" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">B2</text>
          </g>
        )}

        {/* Serve Shuttlecock Icon */}
        {activeServe === 'A' && (
          <g transform="translate(145, 150)">
            <circle cx="0" cy="0" r="6" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M-6 -2 L-12 -6 L-10 0 L-12 6 Z" fill="#ffffff" opacity="0.8" />
          </g>
        )}
        {activeServe === 'B' && (
          <g transform="translate(455, 150)">
            <circle cx="0" cy="0" r="6" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M6 -2 L12 -6 L10 0 L12 6 Z" fill="#ffffff" opacity="0.8" />
          </g>
        )}
      </svg>

      {/* Floating score pill */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/40 text-xs font-mono font-bold text-white shadow-lg">
        <span className="text-emerald-400">{scoreA}</span>
        <span className="text-slate-500">:</span>
        <span className="text-sky-400">{scoreB}</span>
      </div>
    </div>
  );
};
