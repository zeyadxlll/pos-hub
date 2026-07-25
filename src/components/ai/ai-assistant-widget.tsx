"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Bot, User, Mic, MicOff, Lightbulb, ShieldCheck, BarChart3, Share2, Megaphone } from "lucide-react";

interface Message {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "🤖 **مرحباً بك! أنا مساعد POS Hub الذكي 🚀**\n\nأنا هنا لمساعدتك في ترشيح أجهزة اللاب توب، كتابة بوستات تسويقية للفيسبوك، تحليل المبيعات، ومساعدتك في فحص ضمان السيريال. اضغط المايك 🎙️ للتحدث صوتاً!",
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const startVoiceInput = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("عذراً، متصفحك لا يدعم الإدخال الصوتي المباشر. ننصح بتجربة متصفح Google Chrome.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "ar-EG";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      sender: "user",
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "عذراً، تعذر الاتصال بالمساعد الذكي.");

      const aiMsg: Message = {
        sender: "ai",
        text: data.reply || "تمت المعالجة بنجاح.",
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `⚠️ ${err.message || "حدث خطأ غير متوقع."}`,
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans" dir="rtl">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs shadow-2xl shadow-blue-500/40 hover:scale-105 transition-all duration-300 border border-white/20"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>المساعد الذكي POS AI</span>
        </button>
      )}

      {/* Slide-Up Chat Window */}
      {isOpen && (
        <div className="glass-panel w-[90vw] sm:w-[380px] h-[530px] rounded-3xl border border-border/60 shadow-2xl bg-card text-card-foreground flex flex-col overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight font-heading flex items-center gap-1.5">
                  <span>مساعد POS Hub الذكي</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                    صوتي ومؤمن 100%
                  </span>
                </h3>
                <p className="text-[10px] text-white/80 font-medium">مساعد المبيعات، التسويق والضمان</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="p-2.5 bg-secondary/30 border-b border-border/40 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
            <button
              onClick={() => handleChipClick("هل توجد فواتير محذوفة أو عجز؟ افحص سجل المحذوفات والمراجعة الأمنيّة")}
              className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 whitespace-nowrap flex items-center gap-1 font-extrabold transition-all shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <span>سجل المحذوفات والأمان 🚨</span>
            </button>
            <button
              onClick={() => handleChipClick("اقترح أجهزة لاب توب بمخزني")}
              className="px-2.5 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 whitespace-nowrap flex items-center gap-1 font-semibold transition-all shrink-0"
            >
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>ترشيح أجهزة</span>
            </button>
            <button
              onClick={() => handleChipClick("اكتب بوست تسويقي جذاب لصفحة الفيسبوك لأحد أجهزة المحل")}
              className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 whitespace-nowrap flex items-center gap-1 font-semibold transition-all shrink-0"
            >
              <Megaphone className="w-3 h-3 text-amber-400" />
              <span>بوست تسويقي ✨</span>
            </button>
            <button
              onClick={() => handleChipClick("ما هي الأجهزة الأكثر مبيعاً وأعلى ربحاً؟")}
              className="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 whitespace-nowrap flex items-center gap-1 font-semibold transition-all shrink-0"
            >
              <BarChart3 className="w-3 h-3" />
              <span>تحليل المبيعات</span>
            </button>
            <button
              onClick={() => handleChipClick("كيف أفحص ضمان السيريال؟")}
              className="px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 whitespace-nowrap flex items-center gap-1 font-semibold transition-all shrink-0"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>فحص الضمان</span>
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-background/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
                  }`}
                >
                  {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-[82%] space-y-1 ${msg.sender === "user" ? "text-left" : "text-right"}`}>
                  <div
                    className={`p-3 rounded-2xl leading-relaxed whitespace-pre-line shadow-sm border ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-tr-none border-blue-500"
                        : "bg-secondary/70 text-foreground rounded-tl-none border-border/50"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-muted-foreground block px-1">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
                <Bot className="w-4 h-4 text-purple-400 animate-spin" />
                <span>جاري المعالجة الذكية لطلبك...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form with Voice Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-card border-t border-border/40 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={startVoiceInput}
              title="تحدث صوتاً للمساعد"
              className={`p-2.5 rounded-2xl border transition-all ${
                isListening
                  ? "bg-rose-600 text-white animate-bounce border-rose-500"
                  : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/50"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-blue-400" />}
            </button>

            <input
              type="text"
              maxLength={300}
              placeholder={isListening ? "جاري الاستماع لصوتك..." : "اكتب أو تحدث صوتاً للمساعد..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-2.5 rounded-2xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-right"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
