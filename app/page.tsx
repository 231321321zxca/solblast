"use client"

import React, { useState, useEffect, useRef } from "react"
// ★ Ghost を削除しました
import { Sun, Moon, Sparkles, Rocket, Zap, Globe, X, Wallet, DollarSign, BarChart3, ChevronDown, Calculator, Activity, ArrowRight } from "lucide-react"
import * as web3 from "@solana/web3.js"
import Dashboard from "./components/Dashboard"

// --- Animation Components & Styles ---

// 1. グローバルスタイル (カスタムアニメーション定義)
const AnimationStyles = () => (
  <style jsx global>{`
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    @keyframes shimmer {
      100% { transform: translateX(100%); }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-blob { animation: blob 10s infinite; }
    .animate-shimmer { animation: shimmer 2s infinite; }
    .perspective-1000 { perspective: 1000px; }
    .preserve-3d { transform-style: preserve-3d; }
  `}</style>
)

// 2. スクロールで現れるコンポーネント
const ScrollReveal = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect() } }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} style={{ transitionDelay: `${delay}ms`, transitionDuration: '1000ms' }} className={`transition-all transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>{children}</div>
}

// 3. 数字カウントアップ
const CountUp = ({ end, duration = 2000, prefix = "", suffix = "" }: { end: number, duration?: number, prefix?: string, suffix?: string }) => {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setIsVisible(true) })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!isVisible) return; let startTime: number; const animate = (time: number) => { if (!startTime) startTime = time; const progress = (time - startTime) / duration; if (progress < 1) { setCount(Math.floor(end * progress)); requestAnimationFrame(animate) } else { setCount(end) } }; requestAnimationFrame(animate)
  }, [isVisible, end, duration])
  return <span ref={ref} className="font-bold tracking-tight tabular-nums">{prefix}{count.toLocaleString()}{suffix}</span>
}

// 4. 3D Tilt Card
const TiltCard = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25;
    const y = -(e.clientY - top - height / 2) / 25;
    setRotate({ x, y });
  };

  const handleMouseLeave = () => setRotate({ x: 0, y: 0 });

  return (
    <div 
      className="perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        ref={ref}
        className={`transition-transform duration-200 ease-out ${className}`}
        style={{ transform: `rotateX(${rotate.y}deg) rotateY(${rotate.x}deg)` }}
      >
        {children}
      </div>
    </div>
  );
};

export default function Home() {
  const [showApp, setShowApp] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  // Stats
  const [solPrice, setSolPrice] = useState<number>(0)
  const [txCount, setTxCount] = useState<number>(0)
  const [estCount, setEstCount] = useState(100)

  // Styles
  const styles = {
    dark: {
      bg: "bg-[#222222]",
      text: "text-white",
      textSub: "text-[#999]",
      card: "bg-[#2c2c2c]",
      border: "border-[#333]",
      accentBg: "bg-[#AB9FF2]",
      accentText: "text-[#222]",
      hoverBg: "hover:bg-[#333]",
      input: "bg-[#1a1a1a]"
    },
    light: {
      bg: "bg-[#F0F2F5]",
      text: "text-[#1a1a1a]",
      textSub: "text-[#666]",
      card: "bg-white",
      border: "border-[#E0E0E0]",
      accentBg: "bg-[#5E43F3]",
      accentText: "text-white",
      hoverBg: "hover:bg-[#E5E7EB]",
      input: "bg-[#F7F7F9]"
    }
  }
  const currentStyle = styles[theme]
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll); return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try { const priceRes = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT"); const priceData = await priceRes.json(); setSolPrice(parseFloat(priceData.price)) } catch (e) {}
      try { const countRes = await fetch(`https://api.counterapi.dev/v1/solana-multi-sender-v1/batches_processed/`); const countData = await countRes.json(); if (countData?.count) setTxCount(countData.count) } catch (e) { setTxCount(1204) }
    }
    fetchData()
  }, [])

  const handleConnectAndLaunch = async () => {
    if (window.solana && window.solana.isPhantom) { try { await window.solana.connect(); setShowApp(true) } catch (e) { console.error(e) } } else { alert("Phantom Wallet not found") }
  }

  const serviceFee = 0.01
  const networkFeePerTx = 0.000005
  const totalCostSol = serviceFee + (estCount * networkFeePerTx)
  const totalCostUsd = solPrice ? (totalCostSol * solPrice).toFixed(2) : "..."

  if (showApp) {
    return <Dashboard onBack={() => setShowApp(false)} />
  }

  return (
    <div className={`min-h-screen font-sans ${currentStyle.bg} ${currentStyle.text} selection:bg-[#AB9FF2] selection:text-[#222] overflow-x-hidden`}>
      <AnimationStyles />
      
      {/* --- Background Effects (Animated Blobs) --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[10%] w-[40vw] h-[40vw] bg-[#AB9FF2]/5 rounded-full blur-[80px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[30vw] h-[30vw] bg-purple-500/5 rounded-full blur-[80px] animate-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] bg-blue-500/5 rounded-full blur-[100px] animate-blob" style={{ animationDelay: "4s" }} />
      </div>

      {/* --- Connect Modal --- */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowConnectModal(false)} />
          <div className={`relative w-full max-w-sm ${currentStyle.card} border ${currentStyle.border} rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300`}>
            <button onClick={() => setShowConnectModal(false)} className={`absolute top-4 right-4 p-2 rounded-full ${currentStyle.hoverBg}`}><X className="w-5 h-5 text-[#888]" /></button>
            <div className="text-center mb-8">
              <div className={`${currentStyle.accentBg} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl transform rotate-3`}>
                <Wallet className={`w-8 h-8 ${currentStyle.accentText}`} />
              </div>
              <h3 className="text-xl font-bold mb-2">Connect Wallet</h3>
              <p className={`text-sm ${currentStyle.textSub}`}>Connect your Phantom wallet to access the dashboard.</p>
            </div>
            <div className="space-y-3">
              <button onClick={handleConnectAndLaunch} className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 ${currentStyle.accentBg} ${currentStyle.accentText}`}>
                Connect Phantom
              </button>
              <button onClick={() => setShowApp(true)} className={`w-full py-4 rounded-xl font-bold text-sm border ${currentStyle.border} ${currentStyle.text} hover:bg-black/5 transition-all`}>Skip for now</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Navbar --- */}
      <nav className={`h-20 flex items-center justify-between px-8 fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrollY > 20 ? `${theme === 'dark' ? 'bg-[#222]/80' : 'bg-white/80'} backdrop-blur-xl border-b ${currentStyle.border}` : "bg-transparent border-transparent"}`}>
        {/* ★ アイコンを削除し、テキストのみに変更 */}
        <div className="flex items-center">
          <span className="font-bold text-xl tracking-tight">SolBlast</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${currentStyle.hoverBg}`}>{theme === "dark" ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}</button>
          <button onClick={() => setShowConnectModal(true)} className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${currentStyle.accentBg} ${currentStyle.accentText} hover:opacity-90 hover:shadow-lg`}>Launch App</button>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-7xl mx-auto z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left: Text (Staggered Animation) */}
          <div className="flex-1 space-y-8">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${currentStyle.border} bg-white/5 text-[#AB9FF2] text-xs font-bold uppercase tracking-wide`}>
                <div className="w-1.5 h-1.5 bg-[#AB9FF2] rounded-full animate-pulse"></div> Live on Mainnet
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 fill-mode-forwards">
              Send Crypto. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#AB9FF2] to-purple-400">
                Instantly.
              </span>
            </h1>
            
            <p className={`text-lg ${currentStyle.textSub} max-w-md leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-forwards`}>
              The most reliable way to airdrop SOL. No hidden fees. No complex setup. Just speed.
            </p>
            
            <div className="flex items-center gap-6 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-forwards">
              <button 
                onClick={() => setShowConnectModal(true)}
                className={`group relative overflow-hidden px-8 py-4 rounded-full font-bold text-base transition-all flex items-center gap-3 ${currentStyle.accentBg} ${currentStyle.accentText} hover:opacity-90 shadow-[0_0_30px_rgba(171,159,242,0.3)] hover:scale-[1.02]`}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent z-10" />
                Start Sending <Rocket className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right: 3D Tilt Calculator */}
          <div className="flex-1 w-full relative">
            <TiltCard className={`relative rounded-3xl border ${currentStyle.border} ${currentStyle.card} backdrop-blur-md p-8 shadow-2xl`}>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className={`p-5 rounded-2xl ${currentStyle.input} border border-white/5`}>
                  <div className="text-xs text-[#888] font-bold uppercase mb-2 flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> SOL Price</div>
                  <div className="text-2xl font-bold tracking-tight">$<CountUp end={solPrice || 0} duration={1000} /></div>
                </div>
                <div className={`p-5 rounded-2xl ${currentStyle.input} border border-white/5`}>
                  <div className="text-xs text-[#888] font-bold uppercase mb-2 flex items-center gap-1.5"><BarChart3 className="w-3 h-3" /> Total Batches</div>
                  <div className="text-2xl font-bold tracking-tight"><CountUp end={txCount || 0} duration={1500} /></div>
                </div>
              </div>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <label className="text-xs font-bold text-[#888] uppercase tracking-widest">Receivers Count</label>
                    <span className={`text-3xl font-bold text-[#AB9FF2] tabular-nums`}>{estCount}</span>
                  </div>
                  <input 
                    type="range" min="10" max="1000" step="10" 
                    value={estCount} 
                    onChange={(e) => setEstCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#444] rounded-full appearance-none cursor-pointer accent-[#AB9FF2]" 
                  />
                </div>
                <div className="space-y-4 pt-4 border-t border-[#333]">
                  <div className="flex justify-between items-center text-sm text-[#888]"><span>Service Fee</span><span className="font-bold">{serviceFee} SOL</span></div>
                  <div className="flex justify-between items-center"><span className="font-bold text-base">Total Estimate</span><div className="text-right"><div className="text-xl font-bold text-white">{totalCostSol.toFixed(4)} SOL</div><div className="text-xs font-bold text-[#666]">≈ ${totalCostUsd}</div></div></div>
                </div>
                <button onClick={() => setShowConnectModal(true)} className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest ${currentStyle.accentBg} ${currentStyle.accentText} hover:opacity-90 transition-all shadow-lg shadow-purple-500/20`}>Start Airdrop</button>
              </div>
            </TiltCard>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50 hidden lg:block">
          <ChevronDown className="w-6 h-6" />
        </div>
      </div>

      {/* --- Features (Fade Up) --- */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ScrollReveal delay={0}>
            <div className={`h-full p-8 rounded-3xl border ${currentStyle.border} ${currentStyle.card} hover:border-[#555] transition-all duration-300 group hover:-translate-y-2`}>
              <div className={`w-12 h-12 rounded-xl ${currentStyle.input} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Zap className="w-6 h-6 text-[#AB9FF2]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Turbo Mode</h3>
              <p className={`${currentStyle.textSub} text-sm leading-relaxed`}>Advanced priority fee management ensures your transactions land in the very next block.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <div className={`h-full p-8 rounded-3xl border ${currentStyle.border} ${currentStyle.card} hover:border-[#555] transition-all duration-300 group hover:-translate-y-2`}>
              <div className={`w-12 h-12 rounded-xl ${currentStyle.input} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Globe className="w-6 h-6 text-[#AB9FF2]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Global Scale</h3>
              <p className={`${currentStyle.textSub} text-sm leading-relaxed`}>Scalable infrastructure capable of handling thousands of transfers simultaneously.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className={`h-full p-8 rounded-3xl border ${currentStyle.border} ${currentStyle.card} hover:border-[#555] transition-all duration-300 group hover:-translate-y-2`}>
              <div className={`w-12 h-12 rounded-xl ${currentStyle.input} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Activity className="w-6 h-6 text-[#AB9FF2]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Live Analytics</h3>
              <p className={`${currentStyle.textSub} text-sm leading-relaxed`}>Verify every transaction on-chain instantly with built-in explorer links.</p>
            </div>
          </ScrollReveal>
        </div>
      </div>

      <div className={`border-t ${currentStyle.border} py-12 text-center`}>
        <p className={`text-xs ${currentStyle.textSub} uppercase tracking-widest`}>&copy; 2024 SolBlast. Built for speed.</p>
      </div>
    </div>
  )
}