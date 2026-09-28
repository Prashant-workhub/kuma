/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Play,
  Mic,
  Sparkles,
  BookOpen,
  TrendingUp,
  Brain,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  User,
  Github,
  Linkedin,
  Mail,
  HelpCircle,
  ChevronDown,
  Globe,
  Award,
  Key,
  MessageCircle,
  Headphones,
  Smile
} from 'lucide-react';
import AILogo from './AILogo';
import { Button, Card, Badge } from './bauhaus';

interface LandingViewProps {
  onEnterApp: () => void;
  onLoginSuccess: (user: { fullName: string; emailAddress: string }) => void;
  onNavigateToPricing: () => void;
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingView({
  onEnterApp,
  onLoginSuccess,
  onNavigateToPricing,
  onGetStarted,
  onSignIn
}: LandingViewProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Who is Broot?",
      a: "Broot is Kuma's friendly 3D cognitive companion! Broot listens to your lectures, organizes your research notes, and helps you build flashcards as you study."
    },
    {
      q: "How does Kuma record and transcribe lectures?",
      a: "Kuma uses browser-native WebAudio pipelines combined with custom Whisper and Gemini 2.5 audio processors to capture live spoken lectures or uploaded audio files, generating verbatim transcripts with speaker labels."
    },
    {
      q: "What is Bring Your Own Key (BYOK) mode?",
      a: "BYOK allows scholars to input their personal API keys (Google Gemini, Groq, OpenAI, Anthropic, DeepSeek, OpenRouter, Mistral, xAI, NVIDIA, Notion AI) to run unlimited AI note synthesis and quizzes at 0 extra platform markup."
    },
    {
      q: "Can I export my notes and presentation slides?",
      a: "Yes! All synthesized outlines, flashcard decks, and presentation decks can be exported as structured PDF documents, Markdown files, or raw text directly into Notion or Canvas."
    },
    {
      q: "Is my academic data and recorded audio secure?",
      a: "Absolutely. All audio data processing occurs locally in browser memory or encrypted temp blobs. Your personal study material is private to your authenticated user account."
    }
  ];

  return (
    <div className="bg-[var(--bg-paper)] text-[var(--text-primary)] min-h-screen overflow-x-hidden select-none relative font-sans transition-colors duration-200">

      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[var(--sidebar-bg)] border-b-2 border-[var(--border-main)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onGetStarted}>
          <div className="p-1.5 rounded-[6px] bg-[#FFC400] border-2 border-[var(--border-main)] shadow-paper-sm transition-transform group-hover:scale-105 flex items-center justify-center">
            <AILogo size={28} theme="light" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-lg text-[var(--text-primary)] tracking-tight block leading-none">KUMA</span>
            </div>
            <span className="font-mono text-[9px] text-[var(--text-secondary)] font-bold tracking-[2px] uppercase">COGNITIVE SCHOLAR WORKSPACE</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 font-mono text-xs font-bold uppercase tracking-wider">
          <a href="#broot-showcase" style={{ color: 'var(--text-primary)' }} className="landing-nav-link px-2.5 py-1 rounded-[3px] border border-transparent transition-colors font-bold flex items-center gap-1 text-[#FFC400]">
            <Sparkles className="w-3.5 h-3.5" /> Broot AI
          </a>
          <a href="#features" style={{ color: 'var(--text-primary)' }} className="landing-nav-link px-2.5 py-1 rounded-[3px] border border-transparent transition-colors font-bold">Features</a>
          <a href="#workflow" style={{ color: 'var(--text-primary)' }} className="landing-nav-link px-2.5 py-1 rounded-[3px] border border-transparent transition-colors font-bold">Workflow</a>
          <a href="#pricing" style={{ color: 'var(--text-primary)' }} className="landing-nav-link px-2.5 py-1 rounded-[3px] border border-transparent transition-colors font-bold">Pricing</a>
          <a href="#faq" style={{ color: 'var(--text-primary)' }} className="landing-nav-link px-2.5 py-1 rounded-[3px] border border-transparent transition-colors font-bold">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="tertiary"
            size="sm"
            onClick={onSignIn}
            className="border-2 border-[var(--border-main)] text-[var(--text-primary)] bg-[var(--card-bg)]"
          >
            Sign In
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onGetStarted}
            className="bg-[#FFC400] text-[#111111] border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-[#ffe066] font-bold"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* 2. Hero Presentation Area featuring Mascot Broot */}
      <section className="max-w-7xl mx-auto px-6 pt-10 md:pt-16 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-grid-paper relative">

        {/* Left Side Copy */}
        <div className="lg:col-span-7 space-y-6 text-left relative z-10">
          <h1 className="font-heading font-extrabold text-4xl sm:text-6xl md:text-7xl text-[var(--text-primary)] tracking-tight leading-none uppercase">
            LEARN SMARTER <br />
            WITH <span className="bg-[#FFC400] text-[#111111] px-3 py-0.5 border-2 border-[var(--border-main)] shadow-paper-md inline-block mt-2 transform -rotate-1">
              BROOT & KUMA
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] font-mono font-medium leading-relaxed max-w-xl border-l-4 border-[#FFC400] pl-4 py-1">
            Kuma captures live lectures, extracts structured notes, generates quizzes, and diagnoses weak topics alongside Broot!
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <Button
              variant="primary"
              size="lg"
              onClick={onGetStarted}
              className="bg-[#2F6BFF] text-white hover:bg-[#255cd9] border-2 border-[var(--border-main)] shadow-paper-md font-bold px-7"
              icon={<Play className="h-4 w-4 fill-current text-white" />}
            >
              Start Free with Broot
            </Button>

            <Button
              variant="tertiary"
              size="lg"
              onClick={onSignIn}
              className="bg-[var(--card-bg)] text-[var(--text-primary)] border-2 border-[var(--border-main)] shadow-paper-md hover:bg-[var(--hover-bg)] font-bold"
              icon={<BookOpen className="h-4 w-4 text-[var(--text-primary)]" />}
            >
              Workspace Sign In
            </Button>
          </div>
        </div>

        {/* Right Side Broot Hero Showcase */}
        <div className="lg:col-span-5 relative w-full flex flex-col items-center justify-center pt-6 lg:pt-0">

          {/* Broot Mascot Image with Speech Bubble */}
          <div className="relative group">
            {/* Speech Bubble */}
            <div className="absolute -top-10 -left-6 z-20 bg-[#FFC400] text-[#111111] font-mono text-xs font-extrabold px-3 py-1.5 rounded-[8px] border-2 border-[var(--border-main)] shadow-paper-sm animate-bounce">
              "Hi! I'm Broot! Ready to study?"
              <div className="absolute -bottom-2 left-6 w-3 h-3 bg-[#FFC400] border-r-2 border-b-2 border-[var(--border-main)] transform rotate-45" />
            </div>

            {/* Giant Mascot Broot Thinking (No Box Container) */}
            <div className="relative z-10 flex items-center justify-center">
              <img
                src="/mascots/broot-hero-thinking.png"
                alt="Broot Thinking Mascot"
                className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)]"
              />
            </div>

            {/* Decorative Floating Mini Badges */}
            <div className="absolute -bottom-4 -left-4 z-20 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] p-2.5 rounded-[8px] shadow-paper-sm flex items-center gap-2 font-mono text-xs font-bold text-[var(--text-primary)]">
              <Headphones className="w-4 h-4 text-[#38BDF8]" />
              <span>Live Listening</span>
            </div>

            <div className="absolute -top-4 -right-4 z-20 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] p-2.5 rounded-[8px] shadow-paper-sm flex items-center gap-2 font-mono text-xs font-bold text-[#FFC400]">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Notes</span>
            </div>
          </div>

        </div>
      </section>

      {/* NEW SECTION: BROOT MASCOT SHOWCASE BANNER */}
      <section id="broot-showcase" className="border-y-2 border-[var(--border-main)] bg-[#FFC400] text-[#111111] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <img
              src="/mascots/broot-listening-headphones.png"
              alt="Broot Listening"
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain filter drop-shadow-md animate-pulse"
            />
            <div className="space-y-1">
              <div className="inline-block px-2.5 py-0.5 bg-[#111111] text-[#FFC400] font-mono text-xs font-extrabold rounded-[4px] uppercase tracking-wider">
                ALWAYS BY YOUR SIDE
              </div>
              <h2 className="font-heading font-extrabold text-2xl md:text-4xl tracking-tight uppercase">
                Meet Broot, Your Cognitive AI Companion
              </h2>
              <p className="font-mono text-xs md:text-sm font-semibold max-w-xl opacity-90">
                Broot pops up at key study moments to guide lecture processing and highlight areas that need revision.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <img
              src="/mascots/broot-thinking.png"
              alt="Broot Thinking"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain bg-white/40 p-2 rounded-[12px] border-2 border-[#111111] shadow-paper-sm"
            />
            <img
              src="/mascots/broot-peace-wink.png"
              alt="Broot Wink"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain bg-white/40 p-2 rounded-[12px] border-2 border-[#111111] shadow-paper-sm"
            />
            <img
              src="/mascots/broot-celebrating-confetti.png"
              alt="Broot Celebrating"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain bg-white/40 p-2 rounded-[12px] border-2 border-[#111111] shadow-paper-sm"
            />
          </div>
        </div>
      </section>

      {/* 3. PRICING SECTION ON LANDING PAGE */}
      <section id="pricing" className="border-t-2 border-[var(--border-main)] bg-[var(--bg-paper)] py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="yellow" size="md">TRANSPARENT PRICING</Badge>
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl uppercase text-[var(--text-primary)] tracking-tight">
              SELECT YOUR PLAN
            </h2>
            <p className="text-xs md:text-sm font-mono text-[var(--text-secondary)]">
              Start free with your own API keys, or upgrade for managed AI infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* BYOK FREE PLAN */}
            <Card shadow="md" className="p-6 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <Badge variant="yellow" size="sm">FREE FOREVER</Badge>
                <div>
                  <h3 className="font-heading font-extrabold text-xl uppercase text-[var(--text-primary)]">BYOK PLAN</h3>
                  <div className="text-3xl font-heading font-extrabold text-[var(--text-primary)] mt-1">₹0 <span className="text-xs font-mono text-[var(--text-secondary)]">/ month</span></div>
                </div>
                <p className="text-xs font-mono text-[var(--text-secondary)]">Bring Your Own Key for 9+ AI providers with zero platform fee.</p>
                <div className="space-y-2 font-mono text-xs text-[var(--text-primary)] border-t-2 border-[var(--border-main)] pt-3">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#34D399]" /><span>Unlimited Live Audio Recording</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#34D399]" /><span>Connect Gemini, Groq, OpenAI, Anthropic</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#34D399]" /><span>Academic Library & Broot AI Companion</span></div>
                </div>
              </div>
              <Button variant="tertiary" size="md" onClick={onGetStarted} className="w-full justify-center border-2 border-[var(--border-main)] text-[var(--text-primary)]">
                Get Started Free
              </Button>
            </Card>

            {/* FEATURED SCHOLAR PRO PLAN */}
            <Card shadow="lg" className="p-6 bg-[var(--card-bg)] border-2 border-[#FFC400] space-y-6 flex flex-col justify-between relative shadow-paper-yellow">
              <div className="space-y-4">
                <span className="px-2.5 py-1 rounded-[4px] bg-[#FFC400] text-[#111111] font-mono text-[10px] font-extrabold uppercase border border-[#FFC400] inline-block shadow-paper-sm">
                  RECOMMENDED SCHOLAR
                </span>
                <div>
                  <h3 className="font-heading font-extrabold text-xl uppercase text-[var(--text-primary)]">SCHOLAR PRO</h3>
                  <div className="text-3xl font-heading font-extrabold text-[var(--text-primary)] mt-1">₹399 <span className="text-xs font-mono text-[var(--text-secondary)]">/ month</span></div>
                </div>
                <p className="text-xs font-mono text-[var(--text-secondary)] font-bold">Managed AI infrastructure with high-speed API quota included.</p>
                <div className="space-y-2 font-mono text-xs text-[var(--text-primary)] border-t-2 border-[var(--border-main)] pt-3">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#FFC400] stroke-[3]" /><span className="text-[var(--text-primary)] font-medium">Managed AI Run Quota (No API keys needed)</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#FFC400] stroke-[3]" /><span className="text-[var(--text-primary)] font-medium">100 GB Cloud Storage</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#FFC400] stroke-[3]" /><span className="text-[var(--text-primary)] font-medium">Weak Topic Radar & Broot AI Presentations</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#FFC400] stroke-[3]" /><span className="text-[var(--text-primary)] font-medium">Priority Support</span></div>
                </div>
              </div>
              <Button variant="secondary" size="md" onClick={onGetStarted} className="w-full justify-center bg-[#FFC400] text-[#111111] hover:bg-[#ffe066] font-extrabold border-2 border-[var(--border-main)] shadow-paper-sm">
                Upgrade to Scholar Pro →
              </Button>
            </Card>

            {/* INSTITUTION PLAN - LOCKED */}
            <Card shadow="md" className="p-6 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] space-y-6 flex flex-col justify-between opacity-80 border-dashed">
              <div className="space-y-4">
                <Badge variant="blue" size="sm">🔒 UNDER DEVELOPMENT</Badge>
                <div>
                  <h3 className="font-heading font-extrabold text-xl uppercase text-[var(--text-primary)]">INSTITUTION</h3>
                  <div className="text-2xl font-heading font-extrabold text-[var(--text-secondary)] mt-1">UNDER WORK</div>
                </div>
                <p className="text-xs font-mono text-[var(--text-secondary)]">Multi-user seat licenses and campus LMS sync under active engineering.</p>
                <div className="space-y-2 font-mono text-xs text-[var(--text-secondary)] border-t-2 border-[var(--border-main)] pt-3">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--text-secondary)]" /><span>Canvas & Blackboard LMS Sync (In Progress)</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--text-secondary)]" /><span>Department-wide Knowledge Base</span></div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--text-secondary)]" /><span>Dedicated Account Manager</span></div>
                </div>
              </div>
              <button disabled className="w-full py-3 px-4 font-mono text-xs font-bold uppercase rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--panel-bg)] text-[var(--text-secondary)] cursor-not-allowed">
                🔒 UNDER DEVELOPMENT
              </button>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION WITH BROOT INTEGRATION */}
      <section id="features" className="border-t-2 border-[var(--border-main)] bg-[var(--card-bg)] py-16 px-6 relative">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="yellow" size="md">ENGINEERED FOR SCHOLARS</Badge>
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl uppercase text-[var(--text-primary)] tracking-tight">
              PRECISION KNOWLEDGE TOOLS
            </h2>
            <p className="text-xs md:text-sm font-mono text-[var(--text-secondary)]">
              A complete cognitive stack designed to streamline high-level academic research and study retention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 with Broot Listening */}
            <Card shadow="md" className="p-6 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] space-y-4 flex flex-col justify-between relative overflow-hidden group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-[6px] bg-[#38BDF8]/20 border-2 border-[var(--border-main)] shadow-paper-sm flex items-center justify-center text-[#38BDF8]">
                    <Mic className="w-6 h-6" />
                  </div>
                  <img src="/mascots/broot-listening-headphones.png" alt="Broot Listening" className="w-14 h-14 object-contain filter drop-shadow group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">
                  LIVE LECTURE CAPTURE
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed">
                  Real-time audio recording with live waveform display, multi-speaker segmentation, and verbatim transcripts while Broot listens alongside you.
                </p>
              </div>
            </Card>

            {/* Feature 2 with Broot Thinking */}
            <Card shadow="md" className="p-6 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] space-y-4 flex flex-col justify-between relative overflow-hidden group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-[6px] bg-[#FFC400] border-2 border-[var(--border-main)] shadow-paper-sm flex items-center justify-center text-[#111111]">
                    <Layers className="w-6 h-6" />
                  </div>
                  <img src="/mascots/broot-thinking.png" alt="Broot Thinking" className="w-14 h-14 object-contain filter drop-shadow group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">
                  CAPACITY CONNECT ENGINE
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed">
                  Competency analysis and multi-document synthesis. Upload PDFs, PPTs, or training resources to generate structured outlines and flashcard decks as Kuma processes key concepts.
                </p>
              </div>
            </Card>

            {/* Feature 3 with Broot Peace Wink */}
            <Card shadow="md" className="p-6 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] space-y-4 flex flex-col justify-between relative overflow-hidden group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-[6px] bg-[#FF5353]/20 border-2 border-[var(--border-main)] shadow-paper-sm flex items-center justify-center text-[#FF5353]">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <img src="/mascots/broot-peace-wink.png" alt="Broot Wink" className="w-14 h-14 object-contain filter drop-shadow group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">
                  WEAK TOPIC RADAR
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed">
                  Automated diagnosis of knowledge gaps based on interactive quiz performance, offering customized remediation study steps.
                </p>
              </div>
            </Card>

            {/* Feature 4 with Broot Celebrating */}
            <Card shadow="md" className="p-6 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] space-y-4 flex flex-col justify-between relative overflow-hidden group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-[6px] bg-[#34D399]/20 border-2 border-[var(--border-main)] shadow-paper-sm flex items-center justify-center text-[#34D399]">
                    <Brain className="w-6 h-6" />
                  </div>
                  <img src="/mascots/broot-celebrating-confetti.png" alt="Broot Celebrating" className="w-14 h-14 object-contain filter drop-shadow group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">
                  BYOK MULTI-LLM ARCHITECTURE
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed">
                  Connect personal keys for 9+ providers including Gemini 2.5, Groq, OpenAI, Anthropic, DeepSeek, and OpenRouter with 0 platform markup.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. WORKFLOW STEP-BY-STEP */}
      <section id="workflow" className="border-t-2 border-[var(--border-main)] bg-[var(--bg-paper)] py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl uppercase text-[var(--text-primary)]">
              HOW KUMA WORKS
            </h2>
            <p className="text-xs font-mono text-[var(--text-secondary)]">
              From raw acoustic soundwaves to structured academic mastery in 4 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '01', title: 'CAPTURE', desc: 'Record live lectures or upload audio, PDF, and text study materials.' },
              { num: '02', title: 'INDEX', desc: 'Semantic OCR and acoustic speech indexing extract key definitions.' },
              { num: '03', title: 'SYNTHESIZE', desc: 'Generate multi-level outlines, flashcards, mind maps, and quiz decks.' },
              { num: '04', title: 'MASTER', desc: 'Review weak topics, practice interactive quizzes, and export presentation decks.' }
            ].map((step, i) => (
              <Card key={i} shadow="sm" className="p-6 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-3 relative overflow-hidden">
                <span className="font-mono text-2xl font-extrabold bg-[#FFC400] text-[#111111] px-2 py-0.5 border border-[var(--border-main)] inline-block shadow-paper-sm">
                  {step.num}
                </span>
                <h4 className="font-heading font-bold text-base uppercase text-[var(--text-primary)]">{step.title}</h4>
                <p className="text-xs font-mono text-[var(--text-secondary)]">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-t-2 border-[var(--border-main)] bg-[var(--card-bg)] py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl uppercase text-[var(--text-primary)]">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <p className="text-xs font-mono text-[var(--text-secondary)]">Everything you need to know about Kuma & Broot.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <Card
                key={i}
                shadow="sm"
                className="p-5 bg-[var(--panel-bg)] border-2 border-[var(--border-main)] cursor-pointer transition-all hover:bg-[var(--hover-bg)]"
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-heading font-bold text-base text-[var(--text-primary)] uppercase">{faq.q}</h4>
                  <ChevronDown className={`h-5 w-5 text-[var(--text-primary)] transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                </div>
                {activeFaq === i && (
                  <p className="text-xs font-mono text-[var(--text-secondary)] pt-3 border-t border-[var(--border-main)] mt-3 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 8. SOLID BAUHAUS FOOTER */}
      <footer className="bg-[var(--sidebar-bg)] text-[var(--text-primary)] border-t-2 border-[var(--border-main)] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-[6px] bg-[#FFC400] text-[#111111] flex items-center justify-center">
              <AILogo size={22} theme="light" />
            </div>
            <p className="text-[var(--text-secondary)]">
              © 2026 Kuma Scholar. Precision in knowledge synthesis.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 font-bold uppercase tracking-wider text-[var(--text-primary)]">
            <a href="#broot-showcase" className="hover:text-[#FFC400] transition-colors">BROOT AI</a>
            <a href="#features" className="hover:text-[#FFC400] transition-colors">FEATURES</a>
            <a href="#workflow" className="hover:text-[#FFC400] transition-colors">WORKFLOW</a>
            <a href="#pricing" className="hover:text-[#FFC400] transition-colors">PRICING</a>
            <a href="#faq" className="hover:text-[#FFC400] transition-colors">FAQ</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

