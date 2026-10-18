import React, { useState } from 'react';
import { CertificateItem } from './portfolioData';

/**
 * Safe Cutout & White-Background Remover via HTML5 Canvas
 * - If the uploaded PNG ALREADY has a transparent background (e.g. Untitled design.png),
 *   it preserves 100% of the subject pixels untouched and only auto-crops empty margins!
 * - If the uploaded image has a solid white/light wall background, it flood-fills ONLY light
 *   border pixels (luma >= 140) so dark hair, eyes, and black blazer are NEVER erased.
 */
export function removePortraitBackground(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const maxDim = 960;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Check corner pixels first to see if the image is ALREADY a transparent cutout PNG!
        const cornerCoords = [
          [4, 4],
          [w - 5, 4],
          [4, Math.floor(h * 0.25)],
          [w - 5, Math.floor(h * 0.25)],
        ];
        let transparentCorners = 0;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let opaqueCount = 0;

        for (const [cx, cy] of cornerCoords) {
          if (cx >= 0 && cx < w && cy >= 0 && cy < h) {
            const idx = (cy * w + cx) * 4;
            if (data[idx + 3] < 128) {
              transparentCorners++;
            } else {
              sumR += data[idx];
              sumG += data[idx + 1];
              sumB += data[idx + 2];
              opaqueCount++;
            }
          }
        }

        // Only run background flood-fill if corners are OPAQUE and LIGHT-COLORED
        if (transparentCorners < 2 && opaqueCount > 0) {
          const wallR = sumR / opaqueCount;
          const wallG = sumG / opaqueCount;
          const wallB = sumB / opaqueCount;
          const wallLuma = 0.299 * wallR + 0.587 * wallG + 0.114 * wallB;

          if (wallLuma > 135) {
            const isWallPixel = (idx: number): boolean => {
              const a = data[idx + 3];
              if (a < 30) return true;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const luma = 0.299 * r + 0.587 * g + 0.114 * b;
              // Never erase dark pixels (hair, black blazer, eyes)
              if (luma < 140) return false;
              const chroma = Math.max(r, g, b) - Math.min(r, g, b);
              const distToWall = Math.hypot(r - wallR, g - wallG, b - wallB);
              return (
                (r > 235 && g > 235 && b > 235) ||
                (distToWall < 45 && chroma < 32 && luma >= 140)
              );
            };

            const visited = new Uint8Array(w * h);
            const isBg = new Uint8Array(w * h);
            const queue = new Int32Array(w * h);
            let head = 0;
            let tail = 0;

            const enqueue = (x: number, y: number) => {
              if (x < 0 || x >= w || y < 0 || y >= h) return;
              const pos = y * w + x;
              if (visited[pos]) return;
              visited[pos] = 1;
              const idx = pos * 4;
              if (isWallPixel(idx)) {
                isBg[pos] = 1;
                queue[tail++] = pos;
              }
            };

            for (let x = 0; x < w; x++) {
              enqueue(x, 0);
              enqueue(x, 1);
            }
            for (let y = 0; y < h; y++) {
              enqueue(0, y);
              enqueue(1, y);
              enqueue(w - 1, y);
              enqueue(w - 2, y);
            }

            while (head < tail) {
              const pos = queue[head++];
              const x = pos % w;
              const y = (pos - x) / w;
              enqueue(x + 1, y);
              enqueue(x - 1, y);
              enqueue(x, y + 1);
              enqueue(x, y - 1);
            }

            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const pos = y * w + x;
                const idx = pos * 4;
                if (isBg[pos]) {
                  data[idx + 3] = 0;
                } else {
                  let bgNeighbors = 0;
                  if (x > 0 && isBg[pos - 1]) bgNeighbors++;
                  if (x < w - 1 && isBg[pos + 1]) bgNeighbors++;
                  if (y > 0 && isBg[pos - w]) bgNeighbors++;
                  if (y < h - 1 && isBg[pos + w]) bgNeighbors++;
                  if (bgNeighbors > 0) {
                    data[idx + 3] = Math.round(255 * (1 - bgNeighbors * 0.18));
                  }
                }
              }
            }

            ctx.putImageData(imgData, 0, 0);
          }
        }

        // Measure non-transparent foreground bounding box to trim excess empty padding
        const colCounts = new Int32Array(w);
        const rowCounts = new Int32Array(h);
        let totalVisiblePixels = 0;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const alpha = data[(y * w + x) * 4 + 3];
            if (alpha > 40) {
              colCounts[x]++;
              rowCounts[y]++;
              totalVisiblePixels++;
            }
          }
        }

        // Safety fallback: if something unexpected happened and too few pixels remain, return original image untouched!
        if (totalVisiblePixels < w * h * 0.03) {
          resolve(dataUrl);
          return;
        }

        let minX = 0;
        let maxX = w - 1;
        let minY = 0;
        let maxY = h - 1;

        while (minX < w && colCounts[minX] < 2) minX++;
        while (maxX > minX && colCounts[maxX] < 2) maxX--;
        while (minY < h && rowCounts[minY] < 2) minY++;
        while (maxY > minY && rowCounts[maxY] < 2) maxY--;

        if (maxX > minX + 20 && maxY > minY + 20) {
          const subjectW = maxX - minX;
          const subjectH = maxY - minY;
          const padX = Math.round(subjectW * 0.05);
          const padTop = Math.round(subjectH * 0.04);
          const cropX = Math.max(0, minX - padX);
          const cropY = Math.max(0, minY - padTop);
          const cropW = Math.min(w - cropX, subjectW + padX * 2);
          const cropH = Math.min(h - cropY, maxY - cropY + 2);

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const cropCtx = cropCanvas.getContext('2d');
          if (cropCtx) {
            cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            resolve(cropCanvas.toDataURL('image/png'));
            return;
          }
        }

        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Animated Global Supply Chain Route Map & Node Network Background
 */
export const SupplyChainBackground: React.FC = () => {
  const hubs = [
    { id: 'BKK', name: 'BANGKOK HUB (TH)', x: 550, y: 270, primary: true },
    { id: 'SIN', name: 'SINGAPORE PORT (SG)', x: 585, y: 390, primary: false },
    { id: 'RGN', name: 'YANGON CORRIDOR (MM)', x: 465, y: 245, primary: false },
    { id: 'SHA', name: 'SHANGHAI FREIGHT (CN)', x: 760, y: 175, primary: true },
    { id: 'RTM', name: 'ROTTERDAM EUROPORT (NL)', x: 260, y: 135, primary: false },
    { id: 'NBO', name: 'NAIROBI HUB (KE)', x: 340, y: 365, primary: false },
    { id: 'WLG', name: 'WELLINGTON PORT (NZ)', x: 890, y: 495, primary: true },
    { id: 'SUV', name: 'SUVA PACIFIC (FJ)', x: 945, y: 395, primary: false },
    { id: 'LAX', name: 'TRANS-PACIFIC GATE', x: 115, y: 225, primary: false },
  ];

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(248, 250, 252, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(248, 250, 252, 0.05) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(217, 119, 6, 0.16), transparent 48%), radial-gradient(circle at 20% 70%, rgba(56, 189, 248, 0.06), transparent 50%)',
        }}
      />

      <svg
        viewBox="0 0 1100 600"
        className="w-full h-full object-cover opacity-40"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="amberGlowRoute" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="whiteGlowRoute" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D97706" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        <line x1="0" y1="150" x2="1100" y2="150" stroke="#F8FAFC" strokeOpacity="0.06" strokeDasharray="4 8" />
        <line x1="0" y1="270" x2="1100" y2="270" stroke="#D97706" strokeOpacity="0.14" strokeDasharray="4 8" />
        <line x1="0" y1="450" x2="1100" y2="450" stroke="#F8FAFC" strokeOpacity="0.06" strokeDasharray="4 8" />
        <line x1="550" y1="0" x2="550" y2="600" stroke="#D97706" strokeOpacity="0.16" strokeDasharray="3 6" />

        <path d="M 260 135 Q 410 165 550 270" fill="none" stroke="#F8FAFC" strokeWidth="1" strokeOpacity="0.12" />
        <path d="M 550 270 Q 660 215 760 175" fill="none" stroke="#F8FAFC" strokeWidth="1" strokeOpacity="0.12" />
        <path d="M 550 270 Q 730 375 890 495" fill="none" stroke="#F8FAFC" strokeWidth="1" strokeOpacity="0.12" />
        <path d="M 340 365 Q 450 320 550 270" fill="none" stroke="#F8FAFC" strokeWidth="1" strokeOpacity="0.12" />
        <path d="M 115 225 Q 430 70 760 175" fill="none" stroke="#F8FAFC" strokeWidth="1" strokeOpacity="0.1" />

        <path d="M 260 135 Q 410 165 550 270" fill="none" stroke="url(#amberGlowRoute)" strokeWidth="2.4" className="animate-route-flow" />
        <path d="M 550 270 Q 660 215 760 175" fill="none" stroke="url(#whiteGlowRoute)" strokeWidth="2.4" className="animate-route-flow" />
        <path d="M 550 270 L 585 390 Q 745 445 890 495" fill="none" stroke="url(#amberGlowRoute)" strokeWidth="2.4" className="animate-route-flow" />
        <path d="M 340 365 Q 450 320 550 270 Q 750 320 945 395" fill="none" stroke="url(#whiteGlowRoute)" strokeWidth="1.8" className="animate-route-flow-reverse" />
        <path d="M 465 245 L 550 270" fill="none" stroke="#F59E0B" strokeWidth="2.8" className="animate-route-flow" />
        <path d="M 760 175 Q 430 70 115 225" fill="none" stroke="url(#amberGlowRoute)" strokeWidth="1.8" className="animate-route-flow-reverse" />

        {hubs.map((hub) => (
          <g key={hub.id} transform={`translate(${hub.x}, ${hub.y})`}>
            {hub.primary && (
              <circle r="16" fill="none" stroke="#F59E0B" strokeWidth="1.2" strokeOpacity="0.55" strokeDasharray="3 3" />
            )}
            <circle r={hub.primary ? '5.5' : '4'} fill={hub.primary ? '#F59E0B' : '#F8FAFC'} />
            <text
              x="10"
              y="3.5"
              fill={hub.primary ? '#FBBF24' : '#CBD5E1'}
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
              letterSpacing="0.06em"
            >
              {hub.id} · {hub.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

/**
 * Hero Center-Stage Cutout Portrait — Scaled to 40% Center Stage
 * Locked for public presentation (no public edit/upload controls).
 */
export const HeroCutoutPortrait: React.FC<{
  rawImageUrl?: string;
  cutoutImageUrl?: string;
}> = ({ rawImageUrl, cutoutImageUrl }) => {
  const [loadFailed, setLoadFailed] = useState<boolean>(false);
  const displayImage = cutoutImageUrl || rawImageUrl;

  return (
    <div className="relative w-full flex flex-col items-center justify-end select-none">
      {/* Balanced 40% Center-Stage Radial Glow & Orbit Ring */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(217, 119, 6, 0.28) 0%, rgba(30, 41, 59, 0.55) 46%, rgba(11, 17, 32, 0) 74%)',
        }}
      />

      <svg
        viewBox="0 0 440 440"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] lg:w-[400px] lg:h-[400px] opacity-40 pointer-events-none"
      >
        <circle cx="220" cy="220" r="200" fill="none" stroke="#F59E0B" strokeWidth="1.4" strokeDasharray="8 10" />
        <circle cx="220" cy="220" r="158" fill="none" stroke="#F8FAFC" strokeWidth="1" strokeOpacity="0.35" />
        <circle cx="220" cy="20" r="5" fill="#F59E0B" />
        <circle cx="420" cy="220" r="4.5" fill="#F8FAFC" />
        <circle cx="20" cy="220" r="4.5" fill="#F59E0B" />
      </svg>

      {/* Proportional 40% Portrait Container (380px–450px height) */}
      <div className="relative z-10 w-full max-w-[360px] sm:max-w-[400px] h-[380px] sm:h-[420px] lg:h-[450px] flex items-end justify-center">
        {displayImage && !loadFailed ? (
          <img
            src={displayImage}
            alt="Hein Htet Aung — Executive Portrait"
            className="h-full w-auto max-w-full object-contain object-bottom drop-shadow-[0_24px_48px_rgba(0,0,0,0.88)]"
            style={{
              WebkitMaskImage:
                'linear-gradient(to bottom, rgba(0,0,0,1) 90%, rgba(0,0,0,0) 100%)',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 90%, rgba(0,0,0,0) 100%)',
            }}
            onError={() => setLoadFailed(true)}
          />
        ) : (
          /* High-Precision Portrait Illustration Matching Untitled design.png (Black Blazer, Open White Collar, Arms Crossed) */
          <svg
            viewBox="0 0 360 440"
            className="h-full w-auto max-w-full object-contain object-bottom drop-shadow-[0_24px_48px_rgba(0,0,0,0.88)]"
          >
            {/* Neck & Warm Skin Tone */}
            <path d="M 152 152 L 152 208 L 202 215 L 200 152 Z" fill="#E6C2A6" />
            <path d="M 152 168 Q 176 184 200 165 L 200 152 L 152 152 Z" fill="#D4AC8E" />

            {/* Head & Facial Contour (3/4 Slight Left Angle Matching Untitled design.png) */}
            <ellipse cx="176" cy="112" rx="44" ry="56" fill="#ECCBB0" />
            {/* Ears */}
            <ellipse cx="132" cy="116" rx="7" ry="14" fill="#DFAF8E" />
            <ellipse cx="218" cy="116" rx="6" ry="13" fill="#DFAF8E" />

            {/* Eyebrows & Eyes Looking Forward */}
            <path d="M 150 96 Q 162 91 171 95" fill="none" stroke="#1E1B18" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 186 95 Q 197 91 207 96" fill="none" stroke="#1E1B18" strokeWidth="3.2" strokeLinecap="round" />
            <ellipse cx="161" cy="105" rx="5.5" ry="3.2" fill="#181512" />
            <ellipse cx="196" cy="105" rx="5.5" ry="3.2" fill="#181512" />
            <circle cx="162.5" cy="104" r="1.2" fill="#FFFFFF" />
            <circle cx="197.5" cy="104" r="1.2" fill="#FFFFFF" />

            {/* Subtle Nose & Confident Composed Expression */}
            <path d="M 178 104 L 176 124 Q 180 127 184 125" fill="none" stroke="#C89B7B" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 166 138 Q 178 142 191 138" fill="none" stroke="#B97D60" strokeWidth="2.6" strokeLinecap="round" />

            {/* Parted Dark Hair Volume Matching Untitled design.png */}
            <path
              d="M 130 112 C 124 72 145 44 182 44 C 212 44 228 66 224 108 C 220 86 208 72 192 68 C 176 64 156 78 144 96 C 138 104 134 110 130 112 Z"
              fill="#141210"
            />
            <path
              d="M 142 62 C 162 46 202 48 216 72 C 194 62 168 68 150 88 Z"
              fill="#211D1A"
            />

            {/* Torso & Black Blazer Base (3/4 Turn to Left with Crossed Arms) */}
            <path
              d="M 76 440 L 72 252 C 72 222 106 202 146 192 L 208 202 C 244 214 268 238 282 282 L 298 358 L 266 440 Z"
              fill="#0D111A"
            />

            {/* Crisp White Collared Shirt (Open Collar, No Tie — Exact Match to Untitled design.png) */}
            <path
              d="M 146 184 L 154 224 L 198 292 L 208 222 L 202 188 L 182 212 L 160 198 Z"
              fill="#F4F6F8"
            />
            {/* Shirt Collar Lapels & Top Button */}
            <polygon points="146,182 176,214 156,228 138,196" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
            <polygon points="202,186 182,216 202,232 212,198" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
            <circle cx="182" cy="232" r="2.2" fill="#64748B" />

            {/* Black Blazer Shawl Lapels */}
            <path
              d="M 136 192 L 196 312 L 174 320 L 122 212 Z"
              fill="#161C28"
              stroke="#263042"
              strokeWidth="1.2"
            />
            <path
              d="M 210 198 L 224 298 L 198 308 L 200 214 Z"
              fill="#121722"
              stroke="#263042"
              strokeWidth="1.2"
            />

            {/* Crossed Arms & Forearms Across Chest */}
            <path
              d="M 74 252 C 70 310 78 368 98 386 L 254 378 C 276 376 286 356 276 336 L 138 326 L 128 256 Z"
              fill="#111622"
              stroke="#222B3B"
              strokeWidth="1.5"
            />
            {/* Crossed Hand & White Shirt Cuff Peeking Out in Center */}
            <path d="M 176 316 L 198 310 L 204 342 L 184 344 Z" fill="#ECCBB0" />
            <path d="M 194 308 L 208 306 C 214 320 214 334 208 346 L 196 344 Z" fill="#F8FAFC" />

            {/* Right Arm Crossing Under/Over */}
            <path
              d="M 206 306 L 288 328 C 300 344 296 372 276 382 L 146 392 C 132 388 128 368 140 356 Z"
              fill="#0B0F17"
              stroke="#1E2636"
              strokeWidth="1.5"
            />
            {/* 4 Subtle Cuff Buttons on Lower Sleeve */}
            <circle cx="232" cy="378" r="2.2" fill="#475569" />
            <circle cx="240" cy="379" r="2.2" fill="#475569" />
            <circle cx="248" cy="380" r="2.2" fill="#475569" />
            <circle cx="256" cy="381" r="2.2" fill="#475569" />
          </svg>
        )}
      </div>
    </div>
  );
};

/**
 * Uncropped Portrait-Friendly Evidence Photo Frame
 * Uses object-contain over a blurred ambient backdrop so standing portraits (3:4) never crop out people's faces!
 * Locked for public view (no Change/Attach Photo button).
 */
export const EvidenceUncroppedFrame: React.FC<{
  slotKey: string;
  imageUrl?: string;
  badgeText: string;
  variant: 'shell-director' | 'ib-head';
}> = ({ imageUrl, badgeText, variant }) => {
  const [loadFailed, setLoadFailed] = useState<boolean>(false);

  return (
    <div className="relative w-full h-[430px] sm:h-[460px] bg-[#0B1120] overflow-hidden flex flex-col justify-between select-none">
      {/* Top Bar inside frame: Kicker only (Read-Only for Public) */}
      <div className="relative z-20 px-4 py-3 flex items-center justify-between gap-2 bg-[#0B1120]/90 border-b border-slate-800">
        <span className="text-[11px] font-mono tracking-wider uppercase text-[#F59E0B] font-semibold truncate">
          {badgeText}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 shrink-0">
          Verified Endorsement
        </span>
      </div>

      {/* Main Photo Viewport — FULL UNCROPPED VISIBILITY */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-[#080D1A]">
        {imageUrl && !loadFailed ? (
          <>
            <img
              src={imageUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110"
            />
            <img
              src={imageUrl}
              alt={badgeText}
              className="relative z-10 max-h-full max-w-full w-auto h-full object-contain"
              referrerPolicy="no-referrer"
              onError={() => setLoadFailed(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#080D1A]">
            {variant === 'shell-director' ? (
              /* High-Precision Built-In Portrait Matching viber_image_2026-10-18_00-57-56-027.jpg (Hein Htet Aung & Mr. Thanet Puwapiromkwan at Stamford Backdrop) */
              <svg viewBox="0 0 360 460" className="w-full h-full object-contain">
                {/* Top Acoustic Ceiling Strip */}
                <rect x="0" y="0" width="360" height="36" fill="#A5894B" />
                <line x1="0" y1="36" x2="360" y2="36" stroke="#18181B" strokeWidth="3.5" />

                {/* Stamford Press Backdrop Wall Base */}
                <rect x="0" y="38" width="360" height="422" fill="#F4F6F9" />
                {/* Vertical Banner Panel Seam Lines */}
                <line x1="34" y1="38" x2="26" y2="460" stroke="#94A3B8" strokeWidth="1" />
                <line x1="205" y1="38" x2="198" y2="460" stroke="#94A3B8" strokeWidth="1" />

                {/* Checkered Blue Backdrop Squares (Exact Stamford Backdrop Layout) */}
                <rect x="60" y="220" width="66" height="86" fill="#2A7EC4" fillOpacity="0.88" />
                <rect x="272" y="224" width="68" height="86" fill="#2A7EC4" fillOpacity="0.88" />
                <rect x="0" y="310" width="58" height="88" fill="#2A7EC4" fillOpacity="0.85" />
                <rect x="58" y="398" width="66" height="62" fill="#2A7EC4" fillOpacity="0.9" />
                <rect x="272" y="398" width="68" height="62" fill="#2A7EC4" fillOpacity="0.9" />

                {/* Top-Left Stamford Blue Diagonal-S Square Logo */}
                <g transform="translate(8, 72)">
                  <rect x="0" y="0" width="96" height="106" rx="6" fill="#2B7EC2" />
                  <path
                    d="M 14 76 L 68 18 C 76 10 88 22 80 30 L 36 78 C 28 86 16 74 24 66 L 62 26"
                    fill="none"
                    stroke="#F4F6F9"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                </g>

                {/* Large Upper STAMFORD INTERNATIONAL UNIVERSITY Typography */}
                <text
                  x="126"
                  y="134"
                  fill="#23272E"
                  fontSize="54"
                  fontWeight="800"
                  letterSpacing="0.04em"
                  fontFamily="Oswald, Plus Jakarta Sans, sans-serif"
                >
                  STAMFO
                </text>
                <text
                  x="126"
                  y="156"
                  fill="#2B7EC2"
                  fontSize="16"
                  fontWeight="700"
                  letterSpacing="0.34em"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  INTERNATIO
                </text>
                <text
                  x="156"
                  y="194"
                  fill="#23272E"
                  fontSize="36"
                  fontWeight="800"
                  letterSpacing="0.14em"
                  fontFamily="Oswald, Plus Jakarta Sans, sans-serif"
                >
                  NIVERSI
                </text>

                {/* Smaller Checkered Wall Logos on Left & Bottom */}
                <text x="4" y="264" fill="#23272E" fontSize="15" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
                  AMFORD
                </text>
                <text x="4" y="278" fill="#23272E" fontSize="10" fontWeight="600" letterSpacing="0.12em">
                  VERSITY
                </text>
                <text x="4" y="440" fill="#23272E" fontSize="15" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
                  MFORD
                </text>
                <text x="4" y="454" fill="#23272E" fontSize="10" fontWeight="600" letterSpacing="0.12em">
                  VERSITY
                </text>

                {/* LEFT FIGURE: Hein Htet Aung (Charcoal Ribbed T-Shirt, Khaki Pants, Smartwatch, Hands Clasped) */}
                <g>
                  {/* Khaki / Olive-Beige Trousers */}
                  <path d="M 66 396 L 166 396 L 172 460 L 62 460 Z" fill="#B5AE76" />
                  <line x1="118" y1="414" x2="118" y2="460" stroke="#8C8552" strokeWidth="2" />
                  <path d="M 134 398 Q 136 422 133 434" fill="none" stroke="#8C8552" strokeWidth="2.2" />

                  {/* Forearms & Clasped Hands + Black Smartwatch on Left Wrist */}
                  <path d="M 56 292 L 72 372 L 116 394 L 118 374 L 84 352 L 76 292 Z" fill="#C99266" />
                  <path d="M 176 292 L 168 366 L 126 392 L 116 376 L 150 352 L 158 292 Z" fill="#C48C60" />
                  {/* Black Smartwatch */}
                  <rect x="142" y="366" width="16" height="18" rx="4" fill="#111827" stroke="#475569" strokeWidth="1.2" transform="rotate(-24 150 375)" />

                  {/* Charcoal Grey Ribbed Crew-Neck T-Shirt */}
                  <path
                    d="M 56 294 C 58 252 76 236 96 232 L 138 232 C 158 236 176 252 178 294 L 162 298 L 158 402 L 70 402 L 68 298 Z"
                    fill="#464E51"
                  />
                  {/* Subtle Vertical Ribbing Lines on T-Shirt */}
                  <line x1="84" y1="240" x2="82" y2="398" stroke="#373E40" strokeWidth="1.2" />
                  <line x1="98" y1="238" x2="96" y2="398" stroke="#373E40" strokeWidth="1.2" />
                  <line x1="114" y1="238" x2="114" y2="398" stroke="#373E40" strokeWidth="1.2" />
                  <line x1="130" y1="238" x2="130" y2="398" stroke="#373E40" strokeWidth="1.2" />
                  <line x1="144" y1="240" x2="146" y2="398" stroke="#373E40" strokeWidth="1.2" />

                  {/* Clasped Hands in Front */}
                  <ellipse cx="118" cy="386" rx="22" ry="13" fill="#D19A6E" />
                  <path d="M 104 382 Q 118 390 132 382" fill="none" stroke="#B0794E" strokeWidth="1.6" />

                  {/* Neck & Head */}
                  <path d="M 102 206 L 102 236 C 110 244 124 244 132 236 L 132 206 Z" fill="#D7A175" />
                  <ellipse cx="117" cy="186" rx="24" ry="30" fill="#DFAD82" />
                  {/* Full Layered Dark Hair */}
                  <path
                    d="M 90 182 C 88 154 102 144 118 144 C 136 144 148 156 144 182 C 138 170 128 166 117 168 C 104 166 96 172 90 182 Z"
                    fill="#18181B"
                  />
                  {/* Eyes & Warm Smile */}
                  <ellipse cx="108" cy="182" rx="3" ry="1.8" fill="#18181B" />
                  <ellipse cx="126" cy="182" rx="3" ry="1.8" fill="#18181B" />
                  <path d="M 109 198 Q 117 203 125 198" fill="none" stroke="#9A5B3E" strokeWidth="2" strokeLinecap="round" />
                </g>

                {/* RIGHT FIGURE: Mr. Thanet Puwapiromkwan — Director of Shell Company Limited */}
                <g>
                  {/* Dark Suit Trousers */}
                  <path d="M 192 410 L 306 410 L 304 460 L 194 460 Z" fill="#14171C" />

                  {/* Tailored Black Suit Jacket */}
                  <path
                    d="M 176 340 C 180 266 196 242 222 234 L 278 234 C 306 242 322 268 326 340 L 304 402 L 288 424 L 206 424 L 192 402 Z"
                    fill="#181B20"
                  />

                  {/* Crisp White Collared Shirt with Vertical Pinstripes & Dark Buttons (No Tie) */}
                  <path
                    d="M 226 230 L 234 328 L 250 356 L 266 328 L 272 230 Z"
                    fill="#F8FAFC"
                  />
                  <polygon points="224,228 242,256 230,264 218,238" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
                  <polygon points="274,228 256,256 268,264 280,238" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
                  <circle cx="249" cy="274" r="2" fill="#1E293B" />
                  <circle cx="249" cy="298" r="2" fill="#1E293B" />
                  <circle cx="249" cy="322" r="2" fill="#1E293B" />

                  {/* Suit Lapels & Jacket Buttons */}
                  <path d="M 218 236 L 248 354 L 234 358 L 208 258 Z" fill="#20242B" />
                  <path d="M 280 236 L 250 354 L 264 358 L 290 258 Z" fill="#20242B" />

                  {/* Jacket Sleeves Folding Inward & Clasped Hands in Front */}
                  <path d="M 176 336 L 218 398 L 234 382 L 200 326 Z" fill="#1D2128" />
                  <path d="M 326 336 L 280 398 L 264 382 L 300 326 Z" fill="#1D2128" />
                  <ellipse cx="249" cy="396" rx="24" ry="15" fill="#D59B70" />
                  <path d="M 234 392 Q 249 402 264 392" fill="none" stroke="#A66B44" strokeWidth="1.8" />

                  {/* Neck & Distinguished Senior Executive Portrait */}
                  <path d="M 232 212 L 234 242 C 244 252 256 252 264 242 L 266 212 Z" fill="#D3996E" />
                  <ellipse cx="249" cy="190" rx="27" ry="33" fill="#DCAA80" />
                  {/* Executive Parted Dark Hair */}
                  <path
                    d="M 220 184 C 218 152 234 144 252 144 C 270 144 280 156 278 184 C 272 168 258 160 242 162 C 230 164 224 174 220 184 Z"
                    fill="#23201E"
                  />
                  {/* Eyebrows, Eyes & Composed Smile */}
                  <path d="M 232 176 Q 239 173 244 176" fill="none" stroke="#272422" strokeWidth="2.2" />
                  <path d="M 255 176 Q 262 173 268 176" fill="none" stroke="#272422" strokeWidth="2.2" />
                  <ellipse cx="238" cy="183" rx="3.2" ry="1.8" fill="#18181B" />
                  <ellipse cx="261" cy="183" rx="3.2" ry="1.8" fill="#18181B" />
                  <path d="M 239 202 Q 249 207 260 202" fill="none" stroke="#9C5D41" strokeWidth="2.2" strokeLinecap="round" />
                </g>
              </svg>
            ) : (
              /* High-Precision Built-In Portrait Matching viber_image_2026-10-18_01-03-16-195.jpg (Hein Htet Aung & Asst. Prof. Dr. Phanrajit Havarangsi in front of Yellow Wall) */
              <svg viewBox="0 0 360 460" className="w-full h-full object-contain">
                {/* Top Perforated Acoustic Ceiling Tiles */}
                <rect x="0" y="0" width="360" height="106" fill="#DDD7C8" />
                <line x1="205" y1="0" x2="198" y2="106" stroke="#78716C" strokeWidth="1.5" />
                <line x1="0" y1="62" x2="200" y2="62" stroke="#78716C" strokeWidth="1.5" />
                {/* Ceiling Track Divider */}
                <rect x="0" y="106" width="360" height="4" fill="#1E293B" />

                {/* 4 Bright Yellow Vertical Partition Wall Panels with Silver Trim */}
                <rect x="0" y="110" width="32" height="322" fill="#CC9204" />
                <rect x="34" y="110" width="144" height="322" fill="#DDA006" />
                <rect x="180" y="110" width="146" height="322" fill="#E3A507" />
                <rect x="328" y="110" width="32" height="322" fill="#D59A06" />
                {/* Silver Aluminum Vertical Partition Strips */}
                <rect x="31" y="110" width="3" height="322" fill="#94A3B8" />
                <rect x="178" y="110" width="3" height="322" fill="#94A3B8" />
                <rect x="326" y="110" width="3" height="322" fill="#94A3B8" />
                {/* Horizontal Lower Skirting Line on Yellow Panels */}
                <line x1="0" y1="414" x2="360" y2="414" stroke="#785402" strokeWidth="1.5" />

                {/* Dark Floor */}
                <rect x="0" y="432" width="360" height="28" fill="#1C1B1A" />

                {/* LEFT FIGURE: Hein Htet Aung (Full-Length Dark Navy Business Suit, Striped Tie, Blue Pocket Square) */}
                <g>
                  {/* Dress Shoes */}
                  <ellipse cx="132" cy="452" rx="10" ry="5" fill="#292524" />
                  <ellipse cx="162" cy="448" rx="14" ry="5" fill="#3F3228" />

                  {/* Navy Suit Trousers */}
                  <path d="M 118 338 L 168 338 L 160 446 L 144 446 L 143 372 L 138 450 L 122 450 Z" fill="#0B1328" />

                  {/* Tailored Dark Navy Suit Jacket */}
                  <path
                    d="M 108 268 C 110 248 122 242 134 240 L 156 240 C 168 242 178 250 180 272 L 176 318 L 168 342 L 116 342 L 110 318 Z"
                    fill="#101E3D"
                  />

                  {/* White Shirt, Blue-and-White Diagonal Striped Tie & Blue Pocket Square */}
                  <polygon points="136,238 154,238 145,286" fill="#F8FAFC" />
                  <polygon points="143,246 148,246 147,284 142,284" fill="#1D4ED8" />
                  <line x1="142" y1="254" x2="148" y2="258" stroke="#F8FAFC" strokeWidth="1.5" />
                  <line x1="142" y1="262" x2="148" y2="266" stroke="#F8FAFC" strokeWidth="1.5" />
                  <line x1="142" y1="270" x2="148" y2="274" stroke="#F8FAFC" strokeWidth="1.5" />
                  {/* Blue Pocket Square */}
                  <polygon points="160,268 168,266 168,273 160,273" fill="#2563EB" />

                  {/* Suit Sleeves & Clasped Hands */}
                  <path d="M 108 268 L 112 316 L 138 332 L 142 322 L 122 308 Z" fill="#0D1934" />
                  <path d="M 180 268 L 176 316 L 150 332 L 146 322 L 166 308 Z" fill="#0D1934" />
                  <ellipse cx="145" cy="330" rx="11" ry="7" fill="#DEA882" />

                  {/* Head & Smiling Expression */}
                  <ellipse cx="145" cy="222" rx="13" ry="16" fill="#E2AE86" />
                  <path
                    d="M 131 220 C 130 204 138 198 146 198 C 155 198 160 205 159 220 C 155 212 148 208 140 210 C 135 212 133 216 131 220 Z"
                    fill="#141417"
                  />
                  <circle cx="140" cy="220" r="1.4" fill="#18181B" />
                  <circle cx="150" cy="220" r="1.4" fill="#18181B" />
                  <path d="M 141 228 Q 145 231 150 228" fill="none" stroke="#9A5B3E" strokeWidth="1.4" strokeLinecap="round" />
                </g>

                {/* RIGHT FIGURE: Asst. Prof. Dr. Phanrajit Havarangsi (Full-Length Dark Navy Dress with Gold Waist Button) */}
                <g>
                  {/* Cream Pointed Flats */}
                  <ellipse cx="206" cy="452" rx="8" ry="4" fill="#E7E5E4" />
                  <ellipse cx="218" cy="450" rx="8" ry="4" fill="#D6D3D1" />

                  {/* Long Straight Dark Hair Over Shoulders */}
                  <path
                    d="M 196 236 C 194 214 202 206 213 206 C 224 206 232 214 230 236 L 232 276 L 194 276 Z"
                    fill="#141418"
                  />

                  {/* Full-Length Dark Navy Collared Dress */}
                  <path
                    d="M 190 266 C 192 254 200 248 213 248 C 226 248 234 254 238 268 L 242 308 L 228 326 L 244 442 L 184 440 L 196 326 L 184 308 Z"
                    fill="#101B34"
                  />
                  {/* Gold Button / Belt Accent at Waist */}
                  <circle cx="207" cy="316" r="3.2" fill="#EAB308" stroke="#FEF08A" strokeWidth="0.8" />
                  {/* Clasped Hands */}
                  <ellipse cx="209" cy="332" rx="9" ry="6" fill="#ECC09E" />

                  {/* Face & Warm Smile */}
                  <ellipse cx="213" cy="230" rx="12" ry="15" fill="#F1C7A6" />
                  <path
                    d="M 200 228 C 200 212 208 208 214 208 C 222 208 226 214 226 228 C 222 218 215 214 208 216 Z"
                    fill="#141418"
                  />
                  <circle cx="208" cy="229" r="1.3" fill="#18181B" />
                  <circle cx="218" cy="229" r="1.3" fill="#18181B" />
                  <path d="M 209 237 Q 213 240 218 237" fill="none" stroke="#B45309" strokeWidth="1.3" strokeLinecap="round" />
                </g>
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Built-In High-Precision Organization Logos for Work & Academic Tutoring Experience
 * Matches the 5 uploaded logos:
 * 1. John's Navigator (exp_photo_tutor)
 * 2. AIM Construction & Decoration Co., Ltd. (exp_photo_aim)
 * 3. NextChapter Abroad (exp_photo_nca)
 * 4. Helix International School (exp_photo_helix & lead_photo_council)
 * 5. Cypress Education Academy (exp_photo_cypress)
 */
const BuiltInExperienceLogo: React.FC<{
  slotKey: string;
  visualCode: string;
  categoryLabel: string;
}> = ({ slotKey, visualCode, categoryLabel }) => {
  switch (slotKey) {
    case 'exp_photo_tutor':
      // 1. JOHN'S NAVIGATOR — Green Arrow Mascot in Graduation Cap with Book, Dollar & Bar Chart
      return (
        <div className="w-full h-full bg-white flex items-center justify-center p-2">
          <svg viewBox="0 0 220 220" className="w-full h-full max-h-40">
            {/* Green Circular Ring */}
            <circle cx="110" cy="96" r="68" fill="none" stroke="#289E32" strokeWidth="3.5" />
            {/* Open Book on Left */}
            <path d="M 52 106 L 66 102 L 66 122 L 52 126 Z" fill="#FFFFFF" stroke="#1E9E30" strokeWidth="2.5" />
            <path d="M 66 102 L 80 106 L 80 126 L 66 122 Z" fill="#FFFFFF" stroke="#1E9E30" strokeWidth="2.5" />
            {/* Rising Bar Chart & Dollar Coin on Right */}
            <rect x="144" y="106" width="8" height="24" fill="#32A838" />
            <rect x="156" y="96" width="8" height="34" fill="#32A838" />
            <rect x="168" y="84" width="8" height="46" fill="#32A838" />
            <polyline points="134,112 146,98 158,102 174,78" fill="none" stroke="#0B5D1E" strokeWidth="3" />
            <circle cx="138" cy="122" r="11" fill="#32A838" stroke="#FFFFFF" strokeWidth="2" />
            <text x="138" y="126" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="800">
              $
            </text>
            {/* Green Cursor Arrow Mascot Body */}
            <polygon
              points="74,64 148,38 114,132 102,102 76,122"
              fill="#22B238"
              stroke="#073B16"
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
            {/* Graduation Mortarboard Cap on Mascot */}
            <polygon points="56,48 92,32 114,44 78,60" fill="#073B16" />
            <path d="M 70 54 L 74 66 C 84 62 96 56 102 48 L 98 38 Z" fill="#0B521F" />
            <line x1="64" y1="50" x2="58" y2="72" stroke="#1E9E30" strokeWidth="2.5" />
            <circle cx="58" cy="73" r="3" fill="#1E9E30" />
            {/* Mascot Eyes & Smile */}
            <ellipse cx="98" cy="68" rx="6" ry="7" fill="#FFFFFF" stroke="#073B16" strokeWidth="2" />
            <ellipse cx="116" cy="68" rx="6" ry="7" fill="#FFFFFF" stroke="#073B16" strokeWidth="2" />
            <circle cx="99" cy="69" r="3" fill="#073B16" />
            <circle cx="115" cy="69" r="3" fill="#073B16" />
            <path d="M 98 80 Q 108 90 118 80 Z" fill="#FFFFFF" stroke="#073B16" strokeWidth="2" />
            {/* Stacked "John's Navigator" Typography */}
            <text
              x="110"
              y="162"
              textAnchor="middle"
              fill="#073B16"
              fontSize="30"
              fontWeight="900"
              fontStyle="italic"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              John&apos;s
            </text>
            <text
              x="110"
              y="188"
              textAnchor="middle"
              fill="#129A32"
              fontSize="25"
              fontWeight="900"
              fontStyle="italic"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              Navigator
            </text>
            <path d="M 55 198 Q 110 190 165 198" fill="none" stroke="#0B5D1E" strokeWidth="2.5" />
            <polygon points="110,192 113,198 119,200 113,202 110,208 107,202 101,200 107,198" fill="#129A32" />
          </svg>
        </div>
      );

    case 'exp_photo_aim':
      // 2. AIM CONSTRUCTION & DECORATION CO., LTD — Gold Circle Roof Arches + Gold "AIM" on White
      return (
        <div className="w-full h-full bg-white flex items-center justify-center p-2">
          <svg viewBox="0 0 220 220" className="w-full h-full max-h-40">
            {/* Gold Outer Circle with Nested House/Chevron Cutouts */}
            <circle cx="110" cy="76" r="52" fill="#E6CA72" stroke="#C5A952" strokeWidth="1.5" />
            {/* Outer White Arch Cutout */}
            <path d="M 70 114 L 70 74 L 110 42 L 150 74 L 150 114" fill="#FFFFFF" />
            {/* Silver-Grey Middle Arch */}
            <path
              d="M 78 118 L 78 78 L 110 52 L 142 78 L 142 118 L 132 112 L 132 82 L 110 64 L 88 82 L 88 112 Z"
              fill="#A5A49A"
              stroke="#78776E"
              strokeWidth="1"
            />
            {/* Inner Gold Arch Pillar */}
            <path
              d="M 90 124 L 90 86 L 110 70 L 130 86 L 130 124 L 116 124 L 116 96 L 110 91 L 104 96 L 104 124 Z"
              fill="#E6CA72"
              stroke="#B79B46"
              strokeWidth="1"
            />
            {/* Bold Gold "AIM" Letters */}
            <text
              x="110"
              y="168"
              textAnchor="middle"
              fill="#E6CA72"
              stroke="#9E8438"
              strokeWidth="1.2"
              fontSize="42"
              fontWeight="900"
              letterSpacing="0.06em"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              AIM
            </text>
            {/* Subtitle */}
            <text
              x="110"
              y="186"
              textAnchor="middle"
              fill="#646464"
              fontSize="8.5"
              fontWeight="800"
              letterSpacing="0.02em"
              fontFamily="JetBrains Mono, monospace"
            >
              CONSTRUCTION &amp; DECORATION CO.,LTD
            </text>
          </svg>
        </div>
      );

    case 'exp_photo_nca':
      // 3. NEXTCHAPTER ABROAD — White Bridge/Sail Calligraphy Mark on Deep Navy (#0A083A)
      return (
        <div className="w-full h-full bg-[#0A083A] flex items-center justify-center p-2">
          <svg viewBox="0 0 240 200" className="w-full h-full max-h-40">
            {/* Minimalist White Suspension Bridge / Sail Spire */}
            <path
              d="M 94 40 L 94 114 L 91 114 L 90 40 Z"
              fill="#F8FAFC"
            />
            {/* Left Sweeping Cable */}
            <path
              d="M 92 44 C 88 64 78 76 62 82 C 74 80 86 72 92 58 Z"
              fill="#F8FAFC"
            />
            {/* Right Sweeping Cable */}
            <path
              d="M 93 40 C 106 68 134 82 184 84 C 142 86 110 74 93 52 Z"
              fill="#F8FAFC"
            />
            {/* Horizontal Bridge Deck Arc */}
            <path
              d="M 52 98 C 82 88 138 90 196 98 C 142 94 84 94 52 98 Z"
              fill="#F8FAFC"
            />
            {/* Serif Typography: NEXTCHAPTER ABROAD */}
            <text
              x="120"
              y="142"
              textAnchor="middle"
              fill="#F8FAFC"
              fontSize="13.5"
              fontWeight="500"
              letterSpacing="0.08em"
              fontFamily="Georgia, serif"
            >
              NEXTCHAPTER ABROAD
            </text>
          </svg>
        </div>
      );

    case 'exp_photo_helix':
    case 'lead_photo_council':
      // 4. HELIX INTERNATIONAL SCHOOL — Royal Navy Crest Shield with Laurel Wreaths, Gothic H, Book, Atom & DNA
      return (
        <div className="w-full h-full bg-white flex items-center justify-center p-2">
          <svg viewBox="0 0 220 220" className="w-full h-full max-h-40">
            {/* Outer Shield Outline */}
            <path
              d="M 78 24 L 142 24 C 146 38 156 44 162 46 L 162 110 C 162 136 138 152 110 162 C 82 152 58 136 58 110 L 58 46 C 64 44 74 38 78 24 Z"
              fill="#FFFFFF"
              stroke="#001B48"
              strokeWidth="4"
            />
            {/* Top-Right Navy Quadrant */}
            <path d="M 110 28 L 139 28 C 143 40 152 46 158 48 L 158 76 L 110 76 Z" fill="#001B48" />
            {/* Top-Left Gothic "H" */}
            <text x="84" y="64" textAnchor="middle" fill="#001B48" fontSize="28" fontWeight="900" fontFamily="Georgia, serif">
              H
            </text>
            {/* Top-Right Open Book */}
            <rect x="120" y="44" width="26" height="20" fill="#FFFFFF" stroke="#001B48" strokeWidth="1.5" />
            <line x1="133" y1="44" x2="133" y2="64" stroke="#001B48" strokeWidth="1.5" />
            {/* Center Navy Bar with "H E L I X" */}
            <rect x="56" y="78" width="108" height="20" rx="4" fill="#001B48" />
            <text x="110" y="92" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="800" letterSpacing="0.32em" fontFamily="Georgia, serif">
              HELIX
            </text>
            {/* Bottom-Left Navy Quadrant with White Atom */}
            <path d="M 62 100 L 110 100 L 110 156 C 86 148 62 132 62 110 Z" fill="#001B48" />
            <ellipse cx="86" cy="124" rx="14" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="1.4" transform="rotate(30 86 124)" />
            <ellipse cx="86" cy="124" rx="14" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="1.4" transform="rotate(-30 86 124)" />
            <ellipse cx="86" cy="124" rx="6" ry="14" fill="none" stroke="#FFFFFF" strokeWidth="1.4" />
            {/* Bottom-Right DNA Helix */}
            <path d="M 124 106 Q 134 114 124 122 Q 114 130 124 138 Q 134 146 124 152" fill="none" stroke="#001B48" strokeWidth="2" />
            <path d="M 134 106 Q 124 114 134 122 Q 144 130 134 138 Q 124 146 134 152" fill="none" stroke="#001B48" strokeWidth="2" />
            {/* Left & Right Laurel Wreaths */}
            <path d="M 48 26 C 38 62 38 102 52 130" fill="none" stroke="#001B48" strokeWidth="3.5" strokeDasharray="6 4" />
            <path d="M 172 26 C 182 62 182 102 168 130" fill="none" stroke="#001B48" strokeWidth="3.5" strokeDasharray="6 4" />
            {/* Bottom "HELIX INTERNATIONAL SCHOOL" Typography */}
            <text x="110" y="190" textAnchor="middle" fill="#001B48" fontSize="28" fontWeight="900" letterSpacing="0.06em" fontFamily="Georgia, serif">
              HELIX
            </text>
            <text x="110" y="206" textAnchor="middle" fill="#001B48" fontSize="8.5" fontWeight="700" letterSpacing="0.16em" fontFamily="Georgia, serif">
              INTERNATIONAL SCHOOL
            </text>
          </svg>
        </div>
      );

    case 'exp_photo_cypress':
      // 5. CYPRESS EDUCATION ACADEMY — White "C" with Orange & Navy Pine Tree on Deep Navy (#1E2B58)
      return (
        <div className="w-full h-full bg-[#1E2B58] flex items-center justify-center p-2">
          <svg viewBox="0 0 220 220" className="w-full h-full max-h-40">
            {/* Outer White "C" Ring */}
            <path
              d="M 144 64 C 132 46 104 44 86 60 C 68 76 68 108 86 124 C 104 140 132 138 146 118"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Orange Right Half of Pine Tree Inside the "C" */}
            <path
              d="M 108 58 C 110 70 114 78 120 82 L 112 82 C 116 92 122 98 130 100 L 118 102 C 124 110 134 114 144 110 C 142 124 128 132 112 130 C 104 114 104 82 108 58 Z"
              fill="#F28C28"
            />
            {/* "Cypress" Display Wordmark */}
            <text
              x="110"
              y="174"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="32"
              fontWeight="800"
              fontFamily="Georgia, serif"
            >
              Cypress
            </text>
            <text
              x="130"
              y="192"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="10.5"
              fontWeight="700"
              fontFamily="Georgia, serif"
            >
              Education Academy
            </text>
          </svg>
        </div>
      );

    case 'lead_photo_tt_president':
      // 6. STAMFORD TABLE TENNIS CLUB POSTER — Exact Match to e195c0f6-0f95-457b-83bf-cccdc2291467.png
      return (
        <div className="w-full h-full bg-white flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 240 240" className="w-full h-full object-cover">
            {/* White & Diagonal Geometric Blue Background */}
            <rect x="0" y="0" width="240" height="240" fill="#F8FAFC" />
            <polygon points="0,165 168,0 205,0 0,202" fill="#E0F2FE" />
            <polygon points="36,220 240,22 240,145 142,220" fill="#0369A1" />
            <polygon points="62,190 220,38 220,98 118,190" fill="#0284C7" fillOpacity="0.65" />

            {/* Top-Right Stamford Logo & Wordmark */}
            <g transform="translate(164, 12)">
              <rect x="0" y="0" width="20" height="20" rx="2.5" fill="#0284C7" />
              <path d="M 4 15 L 15 4 M 6 17 L 17 6" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <text x="23" y="8" fill="#0F172A" fontSize="8.5" fontWeight="900" fontFamily="Oswald, Plus Jakarta Sans, sans-serif">
                STAMFORD
              </text>
              <text x="23" y="13.5" fill="#0284C7" fontSize="3.8" fontWeight="700" letterSpacing="0.14em">
                INTERNATIONAL
              </text>
              <text x="23" y="20" fill="#0F172A" fontSize="7.5" fontWeight="800" fontFamily="Oswald, Plus Jakarta Sans, sans-serif">
                UNIVERSITY
              </text>
            </g>

            {/* Top-Left Bold Navy Typography: HEIN HTET AUNG · VICE PRESIDENT */}
            <text
              x="12"
              y="32"
              fill="#06213E"
              fontSize="22"
              fontWeight="900"
              fontFamily="Oswald, Plus Jakarta Sans, sans-serif"
            >
              HEIN HTET
            </text>
            <text
              x="12"
              y="54"
              fill="#06213E"
              fontSize="22"
              fontWeight="900"
              fontFamily="Oswald, Plus Jakarta Sans, sans-serif"
            >
              AUNG
            </text>
            <text
              x="12"
              y="69"
              fill="#06213E"
              fontSize="10.5"
              fontWeight="800"
              letterSpacing="0.04em"
              fontFamily="Oswald, Plus Jakarta Sans, sans-serif"
            >
              VICE PRESIDENT
            </text>

            {/* Center Figure: Hein Htet Aung in Purple Geometric V-Neck Jersey with Arms Crossed */}
            <g>
              {/* Purple Geometric V-Neck Sports Jersey */}
              <path
                d="M 66 236 L 62 156 C 64 130 82 118 106 112 L 146 112 C 166 120 176 138 176 172 L 166 236 Z"
                fill="#4C2896"
              />
              {/* Geometric Triangle Pattern on Purple Jersey */}
              <polygon points="74,142 92,130 88,154" fill="#67B7E8" fillOpacity="0.85" />
              <polygon points="66,162 84,152 80,174" fill="#E0F2FE" fillOpacity="0.9" />
              <polygon points="96,138 118,126 114,154" fill="#3B1D7A" fillOpacity="0.7" />
              <polygon points="122,140 146,128 140,158" fill="#5D35B0" fillOpacity="0.75" />
              {/* Black V-Neck Collar */}
              <polygon points="106,108 124,132 146,108 140,104 124,122 112,104" fill="#18181B" />

              {/* Crossed Arms Across Chest */}
              <path
                d="M 64 176 C 72 198 116 204 156 196 C 164 190 162 178 148 176 L 84 172 Z"
                fill="#D69E72"
              />
              <path
                d="M 80 184 C 106 188 136 186 156 180"
                fill="none"
                stroke="#B57B50"
                strokeWidth="2"
              />

              {/* Neck & Head */}
              <path d="M 114 88 L 114 114 L 138 114 L 136 88 Z" fill="#DEAD82" />
              <ellipse cx="126" cy="66" rx="22" ry="28" fill="#E6B891" />
              {/* Parted Dark Hair */}
              <path
                d="M 102 62 C 100 38 114 28 130 28 C 146 28 154 40 150 64 C 144 48 132 42 118 46 C 110 48 106 56 102 62 Z"
                fill="#18181B"
              />
              {/* Eyes & Confident Expression */}
              <ellipse cx="117" cy="62" rx="3" ry="1.7" fill="#18181B" />
              <ellipse cx="135" cy="62" rx="3" ry="1.7" fill="#18181B" />
              <path d="M 119 78 Q 126 81 133 78" fill="none" stroke="#9A5B3E" strokeWidth="1.8" strokeLinecap="round" />
            </g>

            {/* Bottom White Fade & Social Icons */}
            <rect x="0" y="216" width="240" height="24" fill="#F8FAFC" fillOpacity="0.82" />
            <circle cx="204" cy="228" r="4.5" fill="#06213E" />
            <circle cx="216" cy="228" r="4.5" fill="#06213E" />
            <circle cx="228" cy="228" r="4.5" fill="#06213E" />
          </svg>
        </div>
      );

    default:
      return (
        <div className="w-full h-full p-3 flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#0F172A] via-[#16223B] to-[#0B1120]">
          <div className="w-9 h-9 rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B] font-mono text-xs font-bold mb-1.5">
            {visualCode.slice(0, 3)}
          </div>
          <div className="text-[10px] font-mono font-bold text-[#F8FAFC] tracking-wider uppercase leading-tight">
            {visualCode}
          </div>
          <div className="text-[9px] font-mono text-slate-400 mt-0.5">{categoryLabel}</div>
        </div>
      );
  }
};

/**
 * Visual Thumbnail Slot for Experience, Tutoring & Extracurricular Award Cards
 * Locked for public presentation (no Replace/Change Photo button).
 */
export const ExperienceMediaThumb: React.FC<{
  slotKey: string;
  visualCode: string;
  categoryLabel: string;
  imageUrl?: string;
}> = ({ slotKey, visualCode, categoryLabel, imageUrl }) => {
  const [loadFailed, setLoadFailed] = useState<boolean>(false);

  return (
    <div className="relative w-full sm:w-44 h-40 sm:h-auto shrink-0 bg-[#0B1120] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
      {imageUrl && !loadFailed ? (
        <div className="absolute inset-0 w-full h-full bg-white flex items-center justify-center overflow-hidden">
          <img
            src={imageUrl}
            alt={visualCode}
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
            onError={() => setLoadFailed(true)}
          />
        </div>
      ) : (
        <div className="absolute inset-0 w-full h-full">
          <BuiltInExperienceLogo
            slotKey={slotKey}
            visualCode={visualCode}
            categoryLabel={categoryLabel}
          />
        </div>
      )}
    </div>
  );
};

/**
 * High-Resolution Replica Renderer for Hein Htet Aung's Uploaded Certificates
 */
export const CertificateDocumentReplica: React.FC<{
  cert: CertificateItem;
  customImageUrl?: string;
  compact?: boolean;
}> = ({ cert, customImageUrl, compact = false }) => {
  const [loadFailed, setLoadFailed] = useState<boolean>(false);

  if (customImageUrl && !loadFailed) {
    return (
      <img
        src={customImageUrl}
        alt={cert.title}
        className="w-full h-full object-contain bg-white"
        referrerPolicy="no-referrer"
        onError={() => setLoadFailed(true)}
      />
    );
  }

  switch (cert.badgeType) {
    case 'unilever':
      return (
        <div className="w-full h-full bg-white text-[#0F172A] p-5 flex justify-between border border-slate-200 relative overflow-hidden select-none">
          <div className="flex flex-col justify-between z-10 pr-3 flex-1">
            <div>
              <div className="text-[#1F36C7] font-extrabold tracking-tight text-sm sm:text-base mb-1">
                Unilever
              </div>
              <div className="text-[9px] font-mono text-slate-500">Sep 18, 2026</div>
              <div className={`${compact ? 'text-sm' : 'text-xl'} font-bold tracking-wide text-slate-900 mt-0.5`}>
                HEIN HTET AUNG
              </div>
              <div className={`${compact ? 'text-xs' : 'text-base'} font-serif font-semibold text-slate-900 mt-1`}>
                Supply Chain Management and Analytics
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                Authorized by Unilever · Offered through Coursera
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-end justify-between gap-2">
              <div className="text-[#1F36C7] font-serif italic font-bold text-sm">Unilever</div>
              <div className="text-[8px] font-mono text-slate-500">ID: XPNC5K3X30FC</div>
            </div>
          </div>
          <div className="w-16 sm:w-20 bg-slate-100 border-l border-slate-200 flex flex-col items-center justify-between py-3 px-1.5 shrink-0">
            <div className="text-[8px] font-mono uppercase tracking-wider text-slate-700 text-center font-semibold">
              CERTIFICATE
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-slate-800 flex items-center justify-center bg-white">
              <span className="text-[8px] font-bold text-slate-900">coursera</span>
            </div>
          </div>
        </div>
      );

    case 'thekap':
      return (
        <div className="w-full h-full bg-[#FAF9F6] text-[#0F172A] p-5 flex flex-col justify-between border border-slate-200 relative overflow-hidden select-none">
          <div className="flex items-center justify-between border-b border-slate-300 pb-2">
            <div>
              <span className="text-[#D97706] font-display font-bold text-base">Certificate</span>
              <span className="text-[9px] font-mono uppercase text-slate-600 ml-1.5">of Completion</span>
            </div>
            <div className="text-right">
              <span className="font-display font-extrabold text-xs text-slate-900">The Kap</span>
            </div>
          </div>
          <div className="text-center my-auto py-1">
            <div className={`${compact ? 'text-base' : 'text-xl'} font-display font-bold text-[#115E59]`}>
              Hein Htet Aung
            </div>
            <div className="text-[10px] text-slate-700 mt-1 leading-snug">
              <strong>Logistics and Supply Chain Management Training for NGO Professionals</strong>
            </div>
          </div>
          <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-2 border-t border-slate-200">
            <span>Awarded Sep 27, 2025</span>
            <span className="px-1.5 py-0.5 border border-slate-300 bg-white text-slate-800 font-semibold">QR Verified</span>
          </div>
        </div>
      );

    case 'gee':
      return (
        <div className="w-full h-full bg-white text-[#0F172A] p-5 flex flex-col justify-between border border-slate-200 relative overflow-hidden select-none">
          <div className="flex items-center justify-between">
            <div className="text-[#0F5132] font-serif italic font-bold text-sm">
              Global Enterprise Experience
            </div>
            <div className="text-[8px] font-mono uppercase px-1.5 py-0.5 bg-[#0F5132] text-white">
              Wellington, NZ
            </div>
          </div>
          <div className="text-center my-auto py-1">
            <div className="text-sm font-bold text-slate-900">Hein Htet Aung</div>
            <div className="text-[9px] font-semibold text-slate-600">Stamford International University</div>
            <div className={`${compact ? 'text-[11px]' : 'text-sm'} font-serif font-bold text-[#0F172A] mt-1`}>
              Highly Commended New Zealand Police Be Safe, Feel Safe Award
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">
              Team 20 · Fiji, Kenya, Netherlands, New Zealand & Thailand
            </div>
          </div>
          <div className="text-[8px] font-mono text-slate-500 text-center border-t border-slate-200 pt-1.5">
            Victoria University of Wellington · June 18, 2026
          </div>
        </div>
      );

    case 'simplilearn':
      return (
        <div className="w-full h-full bg-white text-[#0F172A] p-5 flex justify-between border border-slate-200 relative overflow-hidden select-none">
          <div className="flex flex-col justify-between pr-3 flex-1">
            <div>
              <div className="font-display font-bold text-sm text-[#F59E0B]">
                simpl<span className="text-[#0284C7]">;learn</span>
              </div>
              <div className="text-sm font-serif font-bold text-slate-900 mt-1">Hein Aung</div>
              <div className="text-xs font-bold text-slate-800 mt-1">Content Strategy</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Simplilearn · Coursera</div>
            </div>
            <div className="text-[8px] font-mono text-slate-500 pt-2 border-t border-slate-200">
              ID: W0LH0G2CZIOE · Apr 21, 2025
            </div>
          </div>
          <div className="w-16 bg-slate-100 border-l border-slate-200 flex items-center justify-center p-1.5 shrink-0">
            <div className="w-11 h-11 rounded-full border-2 border-slate-800 flex items-center justify-center bg-white">
              <span className="text-[7px] font-bold">coursera</span>
            </div>
          </div>
        </div>
      );

    case 'nlp':
      return (
        <div className="w-full h-full bg-[#FCFBF8] text-[#1E1B18] p-5 flex flex-col justify-between border-2 border-[#B45309]/30 relative overflow-hidden select-none shadow-sm">
          <div className="flex items-center justify-between border-b border-[#B45309]/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#B45309] text-white flex items-center justify-center text-[9px] font-bold">
                ★
              </div>
              <div>
                <div className="text-[10px] font-display font-black tracking-wider uppercase text-[#B45309]">
                  Kyaw Thu & Associates
                </div>
                <div className="text-[8px] font-mono text-slate-500">NLP Centre · Life Skills & Leadership</div>
              </div>
            </div>
            <div className="text-[8px] font-mono bg-[#B45309]/10 text-[#B45309] px-1.5 py-0.5 rounded font-bold">
              30-HR PROGRAM
            </div>
          </div>
          <div className="text-center my-auto py-2">
            <div className="text-[9px] font-mono uppercase text-slate-500 tracking-widest">
              CERTIFICATE OF RECOGNITION
            </div>
            <div className={`${compact ? 'text-base' : 'text-xl'} font-serif font-black text-slate-900 mt-0.5`}>
              Hein Htet Aung
            </div>
            <div className={`${compact ? 'text-[11px]' : 'text-xs'} font-bold text-[#92400E] mt-1`}>
              I-Am-Gifted Program for Dynamic Personal Breakthrough
            </div>
            <div className="text-[9px] text-slate-600 mt-0.5">
              4Cs Leadership · Mind Mapping · Critical Thinking Frameworks
            </div>
          </div>
          <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-2 border-t border-slate-200">
            <span>Date: Apr 1, 2016</span>
            <span className="font-semibold text-slate-800">Verified Completion</span>
          </div>
        </div>
      );

    case 'hypen':
      return (
        <div className="w-full h-full bg-white text-[#0F172A] p-5 flex flex-col justify-between border-2 border-[#EA580C]/25 relative overflow-hidden select-none">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tighter text-[#EA580C]">HYPEN</span>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Organization</span>
            </div>
            <div className="text-[8px] font-mono text-slate-500">Jan – Apr 2024</div>
          </div>
          <div className="text-center my-auto py-2">
            <div className="text-[9px] font-mono uppercase text-[#EA580C] tracking-widest font-bold">
              Certificate of Appreciation
            </div>
            <div className={`${compact ? 'text-base' : 'text-lg'} font-display font-bold text-slate-900 mt-1`}>
              Hein Htet Aung
            </div>
            <div className="text-[10px] text-slate-700 mt-0.5">
              In recognition of exceptional dedication as <strong>Volunteer Content Writer</strong>
            </div>
          </div>
          <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-2 border-t border-slate-200">
            <span>Min Khant Thway, Head</span>
            <span className="text-[#EA580C] font-semibold">Community Outreach</span>
          </div>
        </div>
      );

    case 'adcamp':
      return (
        <div className="w-full h-full bg-[#0A0F1D] text-slate-100 p-5 flex flex-col justify-between border border-cyan-500/30 relative overflow-hidden select-none">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-cyan-400">CREATE INFLUENCE</span>
              <span className="text-[8px] font-mono text-slate-400 uppercase">Academy</span>
            </div>
            <span className="text-[8px] font-mono px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 font-bold rounded">
              Batch (2)
            </span>
          </div>
          <div className="text-center my-auto py-2">
            <div className="text-[9px] font-mono uppercase tracking-widest text-cyan-300">PROFESSIONAL ACCREDITATION</div>
            <div className={`${compact ? 'text-base' : 'text-lg'} font-display font-bold text-white mt-1`}>
              Hein Htet Aung
            </div>
            <div className="text-xs font-bold text-cyan-400 mt-0.5">
              Facebook AdCamp Training
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              Media Buying · Performance Analytics · High-ROAS Campaign Strategy
            </div>
          </div>
          <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            <span>Aung Mon Chan, Founder</span>
            <span className="text-cyan-400 font-semibold">2024 Verified</span>
          </div>
        </div>
      );

    case 'yaymal-adv':
      return (
        <div className="w-full h-full bg-[#FAF7F2] text-[#1A1815] p-5 flex flex-col justify-between border-2 border-[#0D9488]/30 relative overflow-hidden select-none">
          <div className="flex items-center justify-between border-b border-[#0D9488]/20 pb-2">
            <div>
              <div className="text-xs font-serif font-black tracking-wider text-[#0D9488]">YAY MAL ACADEMY</div>
              <div className="text-[8px] font-mono text-slate-500">Commercial Writing & Creative Strategy</div>
            </div>
            <span className="text-[8px] font-mono bg-[#0D9488]/10 text-[#0D9488] px-1.5 py-0.5 rounded font-bold">
              ADVANCED · BATCH 4
            </span>
          </div>
          <div className="text-center my-auto py-2">
            <div className="text-[8px] font-mono uppercase tracking-widest text-[#0D9488] font-bold">
              CERTIFICATE OF COMPLETION
            </div>
            <div className={`${compact ? 'text-base' : 'text-lg'} font-serif font-bold text-slate-900 mt-0.5`}>
              Hein Htet Aung
            </div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">
              Professional Copywriting Course (Advanced)
            </div>
            <div className="text-[9px] text-slate-600 mt-0.5">
              Commercial Briefings · Audience Psychology · Persuasive Copy
            </div>
          </div>
          <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-2 border-t border-slate-200">
            <span>Saung Hnin Phyu, Founder</span>
            <span className="font-semibold text-slate-800">Mar 31, 2024</span>
          </div>
        </div>
      );

    case 'yaymal-basic':
      return (
        <div className="w-full h-full bg-[#FFFDF9] text-[#1A1815] p-5 flex flex-col justify-between border border-[#F59E0B]/40 relative overflow-hidden select-none">
          <div className="flex items-center justify-between border-b border-[#F59E0B]/20 pb-2">
            <div className="text-xs font-serif font-bold text-[#B45309]">YAY MAL ACADEMY</div>
            <span className="text-[8px] font-mono bg-[#F59E0B]/10 text-[#B45309] px-1.5 py-0.5 rounded font-bold">
              BATCH 27
            </span>
          </div>
          <div className="text-center my-auto py-2">
            <div className="text-[8px] font-mono uppercase tracking-widest text-slate-500">
              FOUNDATIONAL CERTIFICATE
            </div>
            <div className={`${compact ? 'text-base' : 'text-lg'} font-display font-bold text-slate-900 mt-0.5`}>
              Hein Htet Aung
            </div>
            <div className="text-xs font-semibold text-slate-800 mt-0.5">
              Basic Content & Copywriting Course
            </div>
            <div className="text-[9px] text-slate-600 mt-0.5">
              Editorial Foundations · Brand Tone · Structured Business Writing
            </div>
          </div>
          <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-2 border-t border-slate-200">
            <span>Saung Hnin Phyu, Founder</span>
            <span className="font-semibold text-slate-800">Jan 12, 2024</span>
          </div>
        </div>
      );

    default:
      return (
        <div className="w-full h-full bg-[#FFFDF9] text-[#0F172A] p-5 flex flex-col justify-between border border-[#D97706]/40 relative overflow-hidden select-none">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#D97706] font-semibold truncate">
              {cert.issuer}
            </span>
            <span className="text-[9px] font-mono text-slate-500 shrink-0">{cert.date}</span>
          </div>
          <div className="text-center my-auto py-2">
            <div className="text-base font-display font-bold text-[#0F172A]">Hein Htet Aung</div>
            <div className="text-xs font-semibold text-slate-800 mt-1 line-clamp-2">{cert.title}</div>
          </div>
          <div className="text-[8px] font-mono text-slate-500 flex items-center justify-between border-t border-slate-200 pt-1.5">
            <span className="truncate">{cert.authority}</span>
            <span className="text-[#0F172A] font-semibold shrink-0 ml-2">Verified</span>
          </div>
        </div>
      );
  }
};
