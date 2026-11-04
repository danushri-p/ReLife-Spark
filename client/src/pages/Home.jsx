import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  ScanLine,
  CircleCheck,
  ScanEye,
  HeartHandshake,
  Check,
} from 'lucide-react';
import AppDetails from '../components/home/AppDetails';

const scrollToLayers = () =>
  document.getElementById('layers-detail')?.scrollIntoView({ behavior: 'smooth' });

const HeroCard = ({ className = '', children }) => (
  <div className={`hero-card absolute whitespace-nowrap ${className}`}>{children}</div>
);

export const Home = () => {
  return (
    <div>
      {/* ───────────── HERO ───────────── */}
      <section className="relative min-h-[100svh] w-full overflow-hidden bg-[#E3E5E7] lg:h-[clamp(720px,100svh,900px)] lg:min-h-0">
        {/* Phone render — large, cropped at the top, fading into the backdrop on the left */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-[64%]">
          <img
            src="/phone-hero.png"
            alt=""
            aria-hidden="true"
            draggable="false"
            className="hero-render h-full w-full select-none object-cover"
          />

          {/* Thin scan line sweeping up and down across the phone */}
          <span className="scan-line absolute hidden h-[2px] w-[46%] bg-gradient-to-r from-transparent via-[#0d4a3e]/80 to-transparent lg:block" />

          {/* Floating diagnostic cards */}
          <div className="hidden lg:block">
            <HeroCard className="hero-float-a left-[37%] top-[31%]">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                <ScanLine className="h-3.5 w-3.5 text-[#0d4a3e]" /> Device detected
              </p>
              <p className="mt-1.5 text-[15px] font-medium text-slate-900">Samsung Galaxy S23</p>
              <p className="mt-1 text-[11px] text-slate-500">Illustrative diagnostic</p>
            </HeroCard>

            <HeroCard className="hero-float-b right-[5%] top-[45%]">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Damage analysis
              </p>
              <p className="mt-1.5 text-[15px] font-medium text-slate-900">Screen damage detected</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#0d4a3e]">
                <CircleCheck className="h-3.5 w-3.5" /> Analysis complete · demo
              </p>
            </HeroCard>

            <HeroCard className="hero-float-c left-[37.5%] top-[70%]">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Repair estimate</p>
              <p className="mt-1.5 flex items-baseline gap-2.5">
                <span className="text-[26px] font-semibold leading-none text-slate-900">₹6,500</span>
                <span className="text-[11px] text-slate-500">Sample estimate</span>
              </p>
            </HeroCard>
          </div>
        </div>

        {/* Readability wash on small screens, where the render sits behind the copy */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#E3E5E7] via-[#E3E5E7]/85 to-[#E3E5E7]/30 lg:hidden" />

        {/* Copy */}
        <div className="relative z-10 flex min-h-[100svh] items-center lg:h-full lg:min-h-0">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="max-w-[620px] pb-24 pt-32 lg:pt-36">
              <p className="text-[17px] font-medium text-slate-800">ReLife-Spark</p>

              <h1 className="mt-4 text-[2.3rem] font-medium leading-[1.12] tracking-[-0.01em] text-[#16201d] sm:text-[3.25rem] lg:text-[3.6rem]">
                Cracked Screen?
                <br />
                Get Clarity
                <br />
                Before You Pay<span className="text-[#0d4a3e]">.</span>
              </h1>

              <p className="mt-8 max-w-[530px] text-[17px] leading-[2.05] text-slate-600">
                Understand your device damage, analyze repair quotations, and discover whether
                repairing or replacing your smartphone makes more sense with AI.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-8">
                <Link
                  to="/device"
                  className="inline-flex items-center gap-3 rounded-md bg-[#0d5b46] px-6 py-[18px] text-[17px] font-medium text-white shadow-[0_12px_24px_-12px_rgba(13,74,62,0.7)] transition hover:bg-[#0a4a39] active:scale-[0.98]"
                >
                  Analyze My Device
                  <ArrowUpRight className="h-[18px] w-[18px]" />
                </Link>

                <button
                  type="button"
                  onClick={scrollToLayers}
                  className="inline-flex items-center gap-3 text-[15px] font-medium text-slate-800 transition-colors hover:text-[#0d4a3e]"
                >
                  Explore AI Features
                  <ArrowRight className="h-[18px] w-[18px]" />
                </button>
              </div>

              <div className="mt-10 space-y-2.5">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <ScanEye className="h-4 w-4" /> No guesswork
                  </span>
                  <span className="flex items-center gap-1.5">
                    <HeartHandshake className="h-4 w-4" /> No pressure
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Just clarity.
                  </span>
                </div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
                  Smarter for your wallet. Better for the planet.
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={scrollToLayers}
          className="absolute bottom-8 right-6 z-10 hidden items-center gap-3 text-[13px] text-slate-700 transition-colors hover:text-[#0d4a3e] lg:right-10 lg:flex"
        >
          <ScanLine className="h-4 w-4" />
          Explore diagnostic
          <ArrowDown className="h-4 w-4" />
        </button>
      </section>

      <AppDetails />
    </div>
  );
};

export default Home;
