"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useInView, AnimatePresence, type Variants } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Check, ChevronDown, Zap, BarChart2, Shield, Clock, Users, Trophy } from "lucide-react";

const KIWIFY_URL = process.env.NEXT_PUBLIC_KIWIFY_URL ?? "#";

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const springIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1 },
};

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
      >
        <Image src="/icons/icon-192.png" alt="RadarWC" width={200} height={200} className="object-contain" />
      </motion.div>
    </motion.div>
  );
}

function RevealSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={revealVariants}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    title: "Análise completa por jogo",
    desc: "Análise detalhada de histórico, forma recente e confronto direto para cada partida da Copa.",
    color: "border-yellow-500/20 bg-yellow-500/5",
  },
  {
    icon: <BarChart2 className="w-5 h-5 text-blue-400" />,
    title: "Risco calculado",
    desc: "Cada mercado é classificado como Baixo, Médio ou Alto risco. Você sabe exatamente onde pisar.",
    color: "border-blue-500/20 bg-blue-500/5",
  },
  {
    icon: <Shield className="w-5 h-5 text-green-400" />,
    title: "Placar ao vivo",
    desc: "Acompanhe os jogos em tempo real direto no app, sem precisar sair ou abrir outra aba.",
    color: "border-green-500/20 bg-green-500/5",
  },
  {
    icon: <Clock className="w-5 h-5 text-purple-400" />,
    title: "H2H e forma recente",
    desc: "Confronto direto completo e aproveitamento dos últimos jogos de cada seleção.",
    color: "border-purple-500/20 bg-purple-500/5",
  },
];

const FAQ_ITEMS = [
  {
    q: "O que está incluso no acesso?",
    a: "Todos os jogos da Copa 2026 com análise completa, risco por mercado (gols, cartões, escanteios, resultado), placar ao vivo e confronto direto (H2H) de cada seleção.",
  },
  {
    q: "Funciona no iPhone?",
    a: "Sim. O RadarWC é um PWA — você adiciona na tela inicial pelo Safari e funciona como um app nativo, sem precisar baixar nada na App Store.",
  },
  {
    q: "Preciso pagar todo mês?",
    a: "Não. É um pagamento único de R$17,90 com acesso válido até o final da Copa do Mundo 2026.",
  },
  {
    q: "Como acesso após comprar?",
    a: "Crie sua conta no RadarWC com seu e-mail, vá ao checkout e finalize a compra usando o mesmo e-mail de cadastro. O acesso é liberado automaticamente assim que o pagamento é confirmado.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-zinc-200 hover:bg-zinc-800/40 transition-colors"
      >
        {q}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        <p className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      </AnimatePresence>

      <div className="field-bg min-h-screen text-white">
        {/* Overlays */}
        <div className="pointer-events-none fixed inset-0 bg-zinc-950/70" />
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-5%] right-[-10%] w-[400px] h-[400px] bg-green-700/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-lg mx-auto px-5 pb-20">

          {/* ── HERO ─────────────────────────────────────────────────── */}
          <div className="pt-16 pb-12 flex flex-col items-center text-center space-y-6">

            {/* Badge ao vivo */}
            <motion.div
              variants={springIn}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.5, ease: "backOut" }}
              className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5"
            >
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Copa 2026 ao vivo</span>
            </motion.div>

            {/* Logo */}
            <motion.div
              variants={springIn}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.6, delay: 0.1, ease: "backOut" }}
            >
              <Image src="/icons/icon-512.png" alt="RadarWC" width={140} height={140} className="object-contain drop-shadow-2xl" />
            </motion.div>

            {/* Headline */}
            <motion.div
              variants={revealVariants}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
              className="space-y-3"
            >
              <h1 className="text-3xl font-black leading-tight tracking-tight">
                Pare de apostar<br />
                <span className="text-green-400">no escuro.</span>
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed max-w-xs mx-auto">
                Análise completa para cada jogo da Copa 2026. Tendências, riscos e estatísticas na palma da mão.
              </p>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={revealVariants}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.55, delay: 0.3, ease: "easeOut" }}
              className="flex items-center gap-2"
            >
              <div className="flex -space-x-2">
                {["🇧🇷", "🇦🇷", "🇵🇹"].map((flag, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-sm">
                    {flag}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-green-400" />
                <span className="text-sm text-zinc-300 font-semibold">115 apostadores ativos</span>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              variants={revealVariants}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.55, delay: 0.4, ease: "easeOut" }}
              className="w-full space-y-3 pt-2"
            >
              <Link
                href="/cadastro"
                className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-900/50 text-base transition-colors relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-500 skew-x-12" />
                <Trophy className="w-4 h-4" />
                Quero acesso — R$17,90
              </Link>
              <Link
                href="/login"
                className="w-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 font-semibold py-3.5 rounded-xl flex items-center justify-center text-sm border border-zinc-700/60 transition-colors"
              >
                Já tenho conta
              </Link>
            </motion.div>
          </div>

          {/* ── STATS BAR ────────────────────────────────────────────── */}
          <RevealSection>
            <div className="grid grid-cols-3 gap-3 mb-14">
              {[
                { value: "115+", label: "apostadores" },
                { value: "104", label: "jogos" },
                { value: "R$17,90", label: "acesso total" },
              ].map((s) => (
                <div key={s.label} className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-green-400">{s.value}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </RevealSection>

          {/* ── FEATURES ─────────────────────────────────────────────── */}
          <div className="mb-14 space-y-3">
            <RevealSection>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest text-center mb-6">O que você recebe</p>
            </RevealSection>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={revealVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                className={`flex items-start gap-4 p-4 rounded-xl border ${f.color}`}
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{f.title}</p>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── INCLUSO ──────────────────────────────────────────────── */}
          <RevealSection className="mb-14">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-800 to-green-700 px-5 py-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-green-200" />
                <span className="text-sm font-black text-white">Tudo incluso no acesso</span>
              </div>
              <ul className="p-5 space-y-3">
                {[
                  "Análise completa de todos os jogos da Copa 2026",
                  "Mercados: gols, cartões, escanteios e resultado",
                  "Risco classificado: baixo, médio e alto",
                  "Confronto direto (H2H) completo",
                  "Placar ao vivo com atualização automática",
                  "Funciona no celular como app (iOS e Android)",
                  "Acesso válido até o fim da Copa",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                    <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-green-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </RevealSection>

          {/* ── PREÇO ────────────────────────────────────────────────── */}
          <RevealSection className="mb-14">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Investimento único</p>
              <div>
                <span className="text-5xl font-black text-white">R$17,90</span>
                <p className="text-zinc-500 text-sm mt-1">pagamento único · sem mensalidade</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <p className="text-sm text-green-300 font-medium">
                  Menos que uma aposta — análise de todos os jogos da Copa.
                </p>
              </div>
              <Link
                href="/cadastro"
                className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-900/40 text-base transition-colors"
              >
                <Trophy className="w-4 h-4" />
                Garantir acesso agora
              </Link>
              <p className="text-xs text-zinc-600">Pagamento seguro via Kiwify · Acesso imediato</p>
            </div>
          </RevealSection>

          {/* ── FAQ ──────────────────────────────────────────────────── */}
          <RevealSection className="mb-14">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest text-center mb-6">Perguntas frequentes</p>
            <div className="space-y-2">
              {FAQ_ITEMS.map((item) => (
                <FAQItem key={item.q} {...item} />
              ))}
            </div>
          </RevealSection>

          {/* ── FINAL CTA ────────────────────────────────────────────── */}
          <RevealSection>
            <div className="text-center space-y-4">
              <p className="text-xl font-black text-white">
                Pronto para apostar com<br />
                <span className="text-green-400">inteligência?</span>
              </p>
              <p className="text-sm text-zinc-500">Copa 2026 acontecendo agora. Cada jogo perdido é uma oportunidade a menos.</p>
              <Link
                href="/cadastro"
                className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-900/40 text-base transition-colors"
              >
                Começar agora — R$17,90
              </Link>
              <Link href="/login" className="block text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
                Já tenho conta → Entrar
              </Link>
            </div>
          </RevealSection>

        </div>
      </div>
    </>
  );
}
