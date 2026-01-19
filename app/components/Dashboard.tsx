"use client"

import React, { useState, useEffect, useRef } from "react"
// ★ Ghost を削除しました
import { Send, Wallet, AlertCircle, Loader2, Sun, Moon, LogOut, Upload, Trash2, CheckCircle2, TestTube, ExternalLink, Users, Gift, Copy, Zap, Calculator, Lock, Sparkles, BarChart3, ArrowRight } from "lucide-react"
import * as web3 from "@solana/web3.js"

import ReceiptModal from "./ReceiptModal"

declare global {
  interface Window {
    solana?: any
  }
}

// --- 設定 ---
const DEV_WALLET_ADDRESS = "69wEJhcEuMJ4KrfNbZmk7BQdoNpcbiGZ1gJ658kd2em9" 
const BASE_FEE = 0.01
const DISCOUNT_FEE = 0.01
const PRIORITY_RATE = 100000 
const REFERRAL_PERCENT = 30

const COUNTER_NAMESPACE = "solana-multi-sender-v1" 
const COUNTER_KEY = "batches_processed"
const DISCOUNT_PERCENT = Math.round(((BASE_FEE - DISCOUNT_FEE) / BASE_FEE) * 100)

const SolanaIcon = ({ className }: { className?: string }) => (
  <img 
    src="https://cryptologos.cc/logos/solana-sol-logo.svg?v=026" 
    alt="SOL" 
    className={className} 
    crossOrigin="anonymous"
  />
)

interface DashboardProps {
  onBack: () => void;
}

export default function Dashboard({ onBack }: DashboardProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [activeTab, setActiveTab] = useState<"sender" | "referral">("sender")
  
  // Logic States
  const [isTurbo, setIsTurbo] = useState(false)
  const [distMode, setDistMode] = useState<"INDIVIDUAL" | "FIXED">("INDIVIDUAL")
  const [fixedAmount, setFixedAmount] = useState("")

  const [inputText, setInputText] = useState("")
  const [recipients, setRecipients] = useState<{address: string, amount: number}[]>([])
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [txSignature, setTxSignature] = useState("")
  const [txCount, setTxCount] = useState<number | null>(null)
  
  const [solPrice, setSolPrice] = useState<number | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)

  const [invalidCount, setInvalidCount] = useState(0)
  const [isShareOpen, setIsShareOpen] = useState(false)
  
  const [inputReferralCode, setInputReferralCode] = useState("")
  const [activeReferral, setActiveReferral] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Styles ---
  const styles = {
    dark: {
      bg: "bg-[#222222]",
      text: "text-white",
      textSub: "text-[#999]",
      card: "bg-[#2c2c2c]",
      border: "border-[#333]",
      input: "bg-[#1a1a1a]",
      accent: "text-[#AB9FF2]",
      accentBg: "bg-[#AB9FF2]",
      accentText: "text-[#222]",
      hoverBg: "hover:bg-[#333]",
      badge: "bg-[#AB9FF2]/10 text-[#AB9FF2]",
      buttonSec: "bg-[#333] hover:bg-[#444] text-white"
    },
    light: {
      bg: "bg-[#F0F2F5]",
      text: "text-[#1a1a1a]",
      textSub: "text-[#666]",
      card: "bg-white",
      border: "border-[#E0E0E0]",
      input: "bg-[#F7F7F9]",
      accent: "text-[#5E43F3]",
      accentBg: "bg-[#5E43F3]",
      accentText: "text-white",
      hoverBg: "hover:bg-[#E5E7EB]",
      badge: "bg-[#5E43F3]/10 text-[#5E43F3]",
      buttonSec: "bg-white border border-[#E0E0E0] hover:bg-[#F7F7F9] text-[#1a1a1a]"
    }
  }
  const currentStyle = styles[theme]
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  useEffect(() => {
    const initData = async () => {
      try {
        const priceRes = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT")
        const priceData = await priceRes.json()
        setSolPrice(parseFloat(priceData.price))
      } catch (e) { console.error("Price fetch failed") }
      try {
        const countRes = await fetch(`https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${COUNTER_KEY}/`)
        const countData = await countRes.json()
        if (countData?.count) setTxCount(countData.count)
      } catch (e) { setTxCount(1204) }
    }
    initData()
    const savedRef = localStorage.getItem("referralCode")
    if (savedRef) setActiveReferral(savedRef)

    if (window.solana?.isConnected && window.solana?.publicKey) {
        connectWallet()
    }
  }, [])

  const connectWallet = async () => {
    if (!window.solana || !window.solana.isPhantom) return alert("Please install Phantom Wallet")
    try {
      const provider = window.solana
      const resp = await provider.connect()
      setWalletAddress(resp.publicKey.toString())
      const connection = new web3.Connection("https://mainnet.helius-rpc.com/?api-key=" + process.env.NEXT_PUBLIC_HELIUS_API_KEY)
      const balance = await connection.getBalance(resp.publicKey)
      setWalletBalance(balance / web3.LAMPORTS_PER_SOL)
    } catch (e) { console.error(e) }
  }

  const disconnectWallet = () => {
    window.solana?.disconnect()
    setWalletAddress(null)
    setWalletBalance(null)
  }

  const incrementCount = async () => {
    try { await fetch(`https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${COUNTER_KEY}/up`) } catch (e) {}
  }

  const processRawText = (text: string, forceMode?: "INDIVIDUAL" | "FIXED", forceAmount?: string) => {
    setInputText(text)
    const currentMode = forceMode || distMode
    const currentFixed = forceAmount || fixedAmount
    const lines = text.split("\n").filter(line => line.trim() !== "")
    let invalid = 0
    const parsed = lines.map(line => {
      const parts = line.split(/[,\s\t]+/).filter(Boolean)
      const addr = parts[0]?.trim()
      let amt = 0
      if (currentMode === "FIXED") { amt = parseFloat(currentFixed) } else { amt = parseFloat(parts[1]) }
      const isValidAddr = addr && addr.length > 30
      const isValidAmt = !isNaN(amt) && amt > 0
      if (!isValidAddr || (!isValidAmt && currentMode === "INDIVIDUAL")) {
        if (currentMode === "FIXED" && (!currentFixed || isNaN(parseFloat(currentFixed)))) {} else { invalid++; return null }
      }
      if (currentMode === "FIXED" && (isNaN(amt) || amt <= 0)) return null
      return { address: addr, amount: amt }
    }).filter(item => item !== null) as {address: string, amount: number}[]
    setRecipients(parsed)
    setInvalidCount(invalid)
  }

  useEffect(() => { if (distMode === "FIXED") { processRawText(inputText, "FIXED", fixedAmount) } }, [fixedAmount, distMode])
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader(); reader.onload = (event) => { processRawText(event.target?.result as string) }; reader.readAsText(file); e.target.value = ''
  }
  const handleRemoveDuplicates = () => {
    const uniqueMap = new Map(); recipients.forEach(item => uniqueMap.set(item.address, item.amount))
    const uniqueRecipients = Array.from(uniqueMap.entries()).map(([address, amount]) => ({ address, amount }))
    const newText = distMode === "INDIVIDUAL" ? uniqueRecipients.map(r => `${r.address}, ${r.amount}`).join('\n') : uniqueRecipients.map(r => r.address).join('\n')
    processRawText(newText); alert(`Removed duplicates. Count: ${recipients.length} -> ${uniqueRecipients.length}`)
  }
  const handleClear = () => { setInputText(""); setRecipients([]); setInvalidCount(0) }
  const handleApplyReferral = () => {
    if (inputReferralCode.length < 3) return alert("Invalid Code")
    setActiveReferral(inputReferralCode); localStorage.setItem("referralCode", inputReferralCode)
    alert(`Referral Code Applied! ${DISCOUNT_PERCENT}% Fee Discount.`); setInputReferralCode("")
  }

  const currentFee = activeReferral ? DISCOUNT_FEE : BASE_FEE

  const executeAirdrop = async () => {
    if (!walletAddress) return connectWallet(); if (recipients.length === 0) return
    setLoading(true); setStatus("Preparing Transaction...")
    try {
      const provider = window.solana
      const sender = new web3.PublicKey(walletAddress)
      const connection = new web3.Connection("https://mainnet.helius-rpc.com/?api-key=" + process.env.NEXT_PUBLIC_HELIUS_API_KEY)
      const transaction = new web3.Transaction()
      if (isTurbo) { transaction.add(web3.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: PRIORITY_RATE })) }
      transaction.add(web3.SystemProgram.transfer({ fromPubkey: sender, toPubkey: new web3.PublicKey(DEV_WALLET_ADDRESS), lamports: currentFee * web3.LAMPORTS_PER_SOL }))
      setStatus("Packing SOL...")
      recipients.forEach(r => { transaction.add(web3.SystemProgram.transfer({ fromPubkey: sender, toPubkey: new web3.PublicKey(r.address), lamports: Math.floor(r.amount * web3.LAMPORTS_PER_SOL) })) })
      transaction.feePayer = sender; const { blockhash } = await connection.getLatestBlockhash(); transaction.recentBlockhash = blockhash; setStatus("Please Sign...")
      const { signature } = await provider.signAndSendTransaction(transaction); setStatus("Confirming..."); await connection.confirmTransaction(signature); setTxSignature(signature); await incrementCount()
      const newBalance = await connection.getBalance(sender); setWalletBalance(newBalance / web3.LAMPORTS_PER_SOL); setStatus("Sent Successfully!"); setIsShareOpen(true)
    } catch (err: any) { console.error(err); setStatus("Error: " + (err.message || "Transaction failed")) } finally { setLoading(false) }
  }
  const totalAmount = recipients.reduce((acc, curr) => acc + curr.amount, 0)
  const totalCost = totalAmount + currentFee
  const isInsufficientFunds = walletBalance !== null && walletBalance < totalCost
  const myReferralCode = walletAddress ? walletAddress.slice(0, 6) : "---"

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ease-out ${currentStyle.bg} ${currentStyle.text} selection:bg-[#AB9FF2] selection:text-[#222]`}>
      <ReceiptModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} txSignature={txSignature} recipientCount={recipients.length} totalAmount={totalAmount} tokenSymbol="SOL" senderAddress={walletAddress} />
      
      {/* Navbar with smooth transition */}
      <nav className={`h-16 flex items-center justify-between px-6 border-b transition-all duration-300 sticky top-0 z-50 ${theme === 'dark' ? 'bg-[#222]/90' : 'bg-[#F0F2F5]/90'} backdrop-blur-md ${currentStyle.border}`}>
        <div className="flex items-center gap-4 md:gap-8">
          {/* ★ アイコンを削除し、テキストをクリック可能に */}
          <div className="cursor-pointer group" onClick={onBack}>
            <span className="font-bold text-lg tracking-wide transition-opacity group-hover:opacity-80">SolBlast</span>
          </div>
          <div className="flex bg-black/5 rounded-lg p-1 border border-black/5">
            <button onClick={() => setActiveTab("sender")} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === "sender" ? `${currentStyle.card} shadow-sm text-${currentStyle.accent} scale-105` : "text-[#888] hover:text-[#555]"}`}><Send className="w-3 h-3" /> Sender</button>
            <button onClick={() => setActiveTab("referral")} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-2 relative ${activeTab === "referral" ? `${currentStyle.card} shadow-sm text-${currentStyle.accent} scale-105` : "text-[#888] hover:text-[#555]"}`}><Users className="w-3 h-3" /> Referral<span className="absolute -top-2 -right-3 bg-[#AB9FF2] text-[#222] text-[9px] px-1.5 py-0.5 rounded-full border border-[#222] shadow-sm animate-bounce-slow">SOON</span></button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 mr-2 animate-in fade-in duration-700 delay-300">
            <div className="text-right">
              <div className="text-[10px] text-[#888] uppercase font-bold flex items-center justify-end gap-1"><BarChart3 className="w-3 h-3" /> Total Batches</div>
              <div className="text-xs font-bold tabular-nums">{txCount !== null ? txCount.toLocaleString() : "..."}</div>
            </div>
            <div className="w-px h-6 bg-[#333]"></div>
            <div className="text-right">
              <div className="text-[10px] text-[#888] uppercase font-bold flex items-center justify-end gap-1"><SolanaIcon className="w-3 h-3" /> Price</div>
              <div className="text-xs font-bold">${solPrice ? solPrice.toLocaleString() : "..."}</div>
            </div>
          </div>
          {walletAddress && (<a href={`https://solscan.io/account/${walletAddress}`} target="_blank" className={`p-2 rounded-full transition-all duration-300 ${currentStyle.input} ${currentStyle.hoverBg} border ${currentStyle.border} hover:scale-110 active:scale-95`} title="Open in Solscan"><ExternalLink className="w-4 h-4 text-[#888]" /></a>)}
          <button onClick={toggleTheme} className={`p-2 rounded-full transition-all duration-300 ${currentStyle.input} ${currentStyle.hoverBg} hover:scale-110 active:scale-95`}>{theme === "dark" ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-600" />}</button>
          {!walletAddress ? (<button onClick={connectWallet} className={`${currentStyle.input} ${currentStyle.hoverBg} text-sm font-bold px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2 border ${currentStyle.border} hover:scale-105 active:scale-95`}><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>Connect</button>) : (<button onClick={disconnectWallet} className={`${currentStyle.input} ${currentStyle.hoverBg} text-sm font-bold px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-3 border ${currentStyle.border} group hover:border-red-500/50`}><div className="flex items-center gap-2"><SolanaIcon className="w-4 h-4" /><span className="text-white tabular-nums">{walletBalance !== null ? walletBalance.toFixed(2) : "..."}</span></div><LogOut className="w-3 h-3 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" /></button>)}
        </div>
      </nav>

      {/* Main Content with Staggered Animation */}
      <main className="max-w-4xl mx-auto p-6 md:py-12">
        {activeTab === "sender" && (
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Left Column (Input) - Slide Up */}
            <div className="w-full md:w-2/3 flex flex-col gap-6 animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out">
              <div className="flex gap-4">
                <div className={`${currentStyle.input} p-1 rounded-xl flex gap-1 border ${currentStyle.border} flex-1`}>
                  <button className={`w-full py-3 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${currentStyle.card} ${currentStyle.text} shadow-sm border border-black/5`}><Wallet className="w-4 h-4" /> Send SOL</button>
                </div>
                <div className={`${currentStyle.input} p-1 rounded-xl flex gap-1 border ${currentStyle.border} flex-1`}>
                  <button onClick={() => { setDistMode("INDIVIDUAL"); setFixedAmount("") }} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${distMode === "INDIVIDUAL" ? `${currentStyle.card} ${currentStyle.text} shadow-sm border border-black/5 scale-105` : `${currentStyle.textSub} hover:${currentStyle.text}`}`}><Calculator className="w-4 h-4" /> Multi</button>
                  <button onClick={() => setDistMode("FIXED")} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${distMode === "FIXED" ? `${currentStyle.card} ${currentStyle.text} shadow-sm border border-black/5 scale-105` : `${currentStyle.textSub} hover:${currentStyle.text}`}`}><Gift className="w-4 h-4" /> Fixed</button>
                </div>
              </div>
              
              {distMode === "FIXED" && (
                <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                  <div className={`${currentStyle.input} border ${currentStyle.border} rounded-xl px-4 py-3 focus-within:border-[#AB9FF2] focus-within:ring-1 focus-within:ring-[#AB9FF2]/50 transition-all duration-300 flex items-center gap-3`}>
                    <span className="text-xs font-bold text-[#888] uppercase">Amount per person:</span>
                    <input type="number" placeholder="e.g. 0.5" className={`bg-transparent border-none outline-none ${currentStyle.text} w-full font-bold text-lg placeholder-gray-500`} value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} />
                    <span className={`text-xs font-bold ${currentStyle.accent}`}>SOL</span>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col flex-1">
                <div className="flex flex-wrap justify-between items-end mb-2 px-1 gap-2">
                  <div><label className={`text-xs font-bold ${currentStyle.textSub} uppercase`}>Recipients List</label><div className="flex gap-2 text-[10px] mt-1"><span className={`${currentStyle.accent} font-bold tabular-nums`}>{recipients.length} valid</span>{invalidCount > 0 && <span className="text-red-400 font-bold tabular-nums">{invalidCount} invalid</span>}</div></div>
                  <div className="flex gap-2">
                    <input type="file" accept=".csv,.txt" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <button onClick={() => fileInputRef.current?.click()} className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-200 ${currentStyle.buttonSec} hover:scale-105 active:scale-95`}><Upload className="w-3 h-3" /> Upload</button>
                    <button onClick={handleRemoveDuplicates} className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-200 ${currentStyle.buttonSec} hover:scale-105 active:scale-95`} title="Remove Duplicates"><CheckCircle2 className="w-3 h-3" /> Dedup</button>
                    <button onClick={handleClear} className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-200 ${currentStyle.buttonSec} hover:text-red-400 hover:scale-105 active:scale-95`} title="Clear All"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className={`${currentStyle.input} border ${currentStyle.border} rounded-xl p-4 flex-1 min-h-[300px] focus-within:border-[#AB9FF2] focus-within:ring-1 focus-within:ring-[#AB9FF2]/50 transition-all duration-300 flex flex-col`}>
                  <textarea className={`bg-transparent border-none outline-none ${currentStyle.text} w-full h-full font-medium text-xs resize-none placeholder-gray-500 leading-relaxed flex-1 font-mono`} placeholder={distMode === "FIXED" ? `Paste Addresses Only:\nAddr1\nAddr2\n...` : `Paste Address, Amount:\nAddr1, 10\nAddr2, 50\n...`} value={inputText} onChange={(e) => processRawText(e.target.value)}></textarea>
                </div>
              </div>
            </div>

            {/* Right Column (Review) - Slide Up with Delay */}
            <div className="w-full md:w-1/3 flex flex-col gap-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200 ease-out">
              <div className={`${currentStyle.card} rounded-2xl p-6 border ${currentStyle.border} shadow-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] relative overflow-hidden`}>
                <div className="mb-6"><h3 className={`text-lg font-bold ${currentStyle.text} mb-1`}>Review</h3><p className={`text-xs ${currentStyle.textSub}`}>Check details before sending.</p></div>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center group"><span className={`text-sm ${currentStyle.textSub} group-hover:text-white transition-colors`}>Total Amount</span><span className={`${currentStyle.text} font-bold tabular-nums`}>{totalAmount.toLocaleString()} <span className={`text-xs ${currentStyle.textSub}`}>SOL</span></span></div>
                  <div className="flex justify-between items-center group"><span className={`text-sm ${currentStyle.textSub} group-hover:text-white transition-colors`}>Recipients</span><span className={`${currentStyle.text} font-bold tabular-nums`}>{recipients.length}</span></div>
                  <div className="flex justify-between items-center group"><span className={`text-sm ${currentStyle.textSub} group-hover:text-white transition-colors`}>Network Fee</span><span className={`${currentStyle.text} font-bold tabular-nums`}>~0.00001 <span className={`text-xs ${currentStyle.textSub}`}>SOL</span></span></div>
                  <div className={`flex justify-between items-center py-2`}><div className="flex items-center gap-2"><Zap className={`w-4 h-4 ${isTurbo ? "text-yellow-400 fill-yellow-400" : currentStyle.textSub}`} /><span className={`text-sm ${isTurbo ? "text-yellow-400 font-bold" : currentStyle.textSub}`}>Turbo Mode</span></div><button onClick={() => setIsTurbo(!isTurbo)} className={`w-10 h-5 rounded-full transition-colors relative ${isTurbo ? "bg-yellow-400" : "bg-[#444]"}`}><div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${isTurbo ? "left-6" : "left-1"}`}></div></button></div>
                  <div className={`flex justify-between items-center pt-4 border-t ${currentStyle.border}`}><span className={`text-sm ${currentStyle.text} font-bold`}>Service Fee</span><div className="text-right"><span className={`${currentStyle.accent} font-bold tabular-nums`}>{BASE_FEE} SOL</span></div></div>
                  <div className={`flex justify-between items-center pt-2 ${isInsufficientFunds ? 'text-red-500' : ''}`}><span className="text-sm font-bold">Total Cost</span><span className="font-bold tabular-nums">{totalCost.toFixed(4)} SOL</span></div>
                </div>
                {isInsufficientFunds && <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-xs text-red-400 animate-in shake"><AlertCircle className="w-4 h-4 shrink-0" /> Insufficient funds (Bal: {walletBalance?.toFixed(3)})</div>}
                <button onClick={executeAirdrop} disabled={loading || recipients.length === 0 || isInsufficientFunds || !walletAddress} className={`w-full py-3.5 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${loading || recipients.length === 0 || isInsufficientFunds ? `${currentStyle.input} ${currentStyle.textSub} cursor-not-allowed` : `${currentStyle.accentBg} ${currentStyle.accentText} hover:opacity-90 hover:scale-[1.02] hover:shadow-lg active:scale-95`}`}>
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (!walletAddress ? <Wallet className="w-5 h-5" /> : <Send className="w-5 h-5" />)}
                    {loading ? status : (!walletAddress ? "Connect Wallet" : "Send Now")}
                </button>
                {txSignature && (<div className="mt-4 text-center animate-in fade-in slide-in-from-top-2"><a href={`https://solscan.io/tx/${txSignature}`} target="_blank" className={`inline-flex items-center justify-center gap-1 text-xs ${currentStyle.accent} hover:underline`}>View on Solscan <ArrowRight className="w-3 h-3" /></a></div>)}
              </div>
            </div>
          </div>
        )}
        
        {/* Referral Tab (Fade In) */}
        {activeTab === "referral" && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
             <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1 rounded-full mb-6 shadow-2xl shadow-purple-500/20 animate-pulse-slow"><div className="bg-black rounded-full p-6"><Lock className="w-12 h-12 text-white" /></div></div>
             <h2 className={`text-3xl font-black mb-4 ${currentStyle.text}`}>Referral Program <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"></span></h2>
             <p className={`${currentStyle.textSub} max-w-md mx-auto leading-relaxed mb-8`}>We are currently upgrading our affiliate system to bring you real-time earnings. Get ready to earn <span className={`${currentStyle.text} font-bold`}>{REFERRAL_PERCENT}%</span> of all transaction fees generated from your invites.</p>
             <div className="flex flex-col gap-3"><div className="px-6 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold tracking-widest uppercase text-[#888] flex items-center justify-center gap-2"><Sparkles className="w-3 h-3 text-yellow-400" /> Coming Soon z</div><p className="text-[10px] text-[#555]"></p></div>
          </div>
        )}
      </main>
      <script dangerouslySetInnerHTML={{__html: `window.solana = window.solana || {};`}} />
    </div>
  )
}