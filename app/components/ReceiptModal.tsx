"use client"

import React, { useState, useRef } from 'react';
import { X, Twitter, Download, Camera, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  txSignature: string;
  recipientCount: number;
  totalAmount: number;
  tokenSymbol: string;
  senderAddress: string | null;
}

const ReceiptSolIcon = ({ className }: { className?: string }) => (
  <img 
    src="https://cryptologos.cc/logos/solana-sol-logo.svg?v=026" 
    alt="SOL" 
    className={className} 
    crossOrigin="anonymous"
  />
)

export default function ReceiptModal({ 
  isOpen, 
  onClose, 
  txSignature, 
  recipientCount, 
  totalAmount,
  tokenSymbol,
  senderAddress
}: ReceiptModalProps) {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBgImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAsImage = async () => {
    if (cardRef.current) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2
      });
      const link = document.createElement('a');
      link.download = `solblast-receipt.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const tweetText = encodeURIComponent(
    `Just airdropped ${totalAmount} $${tokenSymbol} using SolBlast! 🚀\n\nFast & Secure Bulk Sending on #Solana`
  );
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
  const displayAddress = senderAddress ? `${senderAddress.slice(0, 4)}...${senderAddress.slice(-4)}` : "Anonymous";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
        
        {/* --- Main Receipt Card --- */}
        <div 
          ref={cardRef}
          className="relative w-[380px] h-[580px] rounded-[32px] overflow-hidden shadow-2xl flex flex-col items-center justify-between text-[#1a1a1a] select-none border border-white/40 backdrop-blur-xl"
          style={{
             background: bgImage 
               ? `url(${bgImage}) center/cover no-repeat` 
               : 'rgba(255, 255, 255, 0.85)' 
          }}
        >
          {/* Top */}
          <div className="relative z-10 w-full p-8 flex justify-between items-start">
            <div className="bg-[#AB9FF2]/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-[#AB9FF2]/10 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#AB9FF2] animate-pulse" />
              Success
            </div>
            <div className="text-right text-[#666] text-[10px]">
              <div>{new Date().toLocaleDateString()}</div>
              <div>{new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          {/* Middle: Amount with ICON */}
          <div className="relative z-10 w-full px-6">
            <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-6 text-center shadow-lg">
              <div className="text-xs font-bold text-[#666] uppercase tracking-widest mb-2">Total Airdropped</div>
              <div className="flex items-center justify-center gap-3 mb-1">
                 <ReceiptSolIcon className="w-8 h-8" />
                 <span className="text-5xl font-black tracking-tighter tabular-nums text-[#1a1a1a]">
                   {totalAmount.toLocaleString()}
                 </span>
              </div>
              <div className="text-xl font-bold text-[#1a1a1a]">{tokenSymbol}</div>
              <div className="mt-6 pt-6 border-t border-black/5 flex justify-between items-center text-sm">
                <div className="text-left">
                   <div className="text-[#888] text-xs">Recipients</div>
                   <div className="font-bold text-lg text-[#1a1a1a]">{recipientCount} <span className="text-xs font-normal text-[#666]">Addrs</span></div>
                </div>
                <div className="text-right">
                   <div className="text-[#888] text-xs">Sender</div>
                   <div className="font-bold text-lg text-[#1a1a1a]">{displayAddress}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Footer */}
          <div className="relative z-10 w-full p-8 pb-10 text-center space-y-4">
            <div className="flex flex-col items-center gap-1 text-[#999]">
              <div className="flex items-center gap-1 text-[10px]">
                <CheckCircle2 className="w-3 h-3" /> {txSignature.slice(0, 12)}...
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em]">SolBlast</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2.5 bg-[#333] hover:bg-[#444] text-white rounded-full text-sm font-bold transition-all cursor-pointer shadow-lg active:scale-95 border border-[#444]">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <Camera className="w-4 h-4" /> <span className="hidden sm:inline">BG</span>
          </label>
          <div className="h-8 w-px bg-white/10 mx-1"></div>
          <a href={twitterUrl} target="_blank" className="p-2.5 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-full transition-all shadow-lg active:scale-95">
            <Twitter className="w-5 h-5" />
          </a>
          <button onClick={saveAsImage} className="flex items-center gap-2 px-5 py-2.5 bg-[#AB9FF2] hover:bg-[#9b8ee0] text-[#222] rounded-full text-sm font-bold transition-all shadow-lg active:scale-95">
            <Download className="w-4 h-4" /> Save
          </button>
          <button onClick={onClose} className="p-2.5 bg-[#333] hover:bg-[#444] text-white rounded-full transition-all border border-[#444]">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}