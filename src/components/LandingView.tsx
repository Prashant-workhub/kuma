/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  Building2,
  Target,
  GraduationCap,
  BarChart3,
  Award
} from 'lucide-react';
import AILogo from './AILogo';

interface LandingViewProps {
  onEnterApp: () => void;
  onLoginSuccess: (user: { fullName: string; emailAddress: string }) => void;
  onNavigateToPricing: () => void;
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingView({
  onEnterApp,
  onGetStarted,
  onSignIn
}: LandingViewProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is Capacity Connect?",
      a: "Capacity Connect (SIH26075) is a Digital Capacity Building and Learning Management Portal designed to bridge organizational skill gaps, automate training recommendations, and provide real-time capacity analytics."
    },
    {
      q: "How does Skill Gap Diagnosis work?",
      a: "The platform maps department designations to required competency levels, compares them against individual employee profiles, and automatically calculates skill gap scores with AI-driven training recommendations."
    },
    {
      q: "Can administrators track real-time capacity analytics?",
      a: "Yes. Executive dashboards provide department-level competency heatmaps, course completion tracking, assessment scores, and budget allocation metrics."
    },
    {
      q: "Does Capacity Connect support AI-powered learning paths?",
      a: "Integrated AI models evaluate employee performance and generate adaptive learning modules, interactive flashcards, and competency assessments tailored to each role."
    },
    {
      q: "How are certificates verified?",
      a: "Every course completion issues an authenticated digital certificate with verifiable competency codes and metadata hash for audit compliance."
    }
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Organization Setup",
      desc: "Administrators define departments, designations, and required baseline competency scores.",
      icon: Building2
    },
    {
      step: "02",
      title: "Skill Gap Analysis",
      desc: "System evaluates employee performance against role metrics to detect precise capability gaps.",
      icon: Target
    },
    {
      step: "03",
      title: "AI Course Recommendation",
      desc: "Tailored training programs are automatically assigned to employees to target identified deficits.",
      icon: GraduationCap
    },
    {
      step: "04",
      title: "Capacity Analytics",
      desc: "Real-time management dashboards display competency growth, completion metrics, and ROI.",
      icon: BarChart3
    }
  ];

  return (
    <div className="bg-white dark:bg-[#030610] text-slate-900 dark:text-slate-100 min-h-screen overflow-x-hidden font-sans select-none transition-colors duration-200">
      {/* Header Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#050814]/90 backdrop-blur-md border-b border-purple-100 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onGetStarted}>
          <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-950/40 text-[#992e9d] dark:text-purple-300 transition-transform group-hover:scale-105 flex items-center justify-center border border-purple-200 dark:border-purple-800">
            <AILogo size={24} theme="light" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-slate-900 dark:text-white tracking-tight block leading-none">CAPACITY CONNECT</span>
              <span className="bg-purple-100 dark:bg-purple-950/60 text-[#992e9d] dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200/50 dark:border-purple-800/50">SIH 2026</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">Digital Capacity & Learning Portal</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-[#992e9d] dark:hover:text-purple-400 transition-colors">Features</a>
          <a href="#workflow" className="hover:text-[#992e9d] dark:hover:text-purple-400 transition-colors">Workflow</a>
          <a href="#analytics" className="hover:text-[#992e9d] dark:hover:text-purple-400 transition-colors">Analytics</a>
          <a href="#faq" className="hover:text-[#992e9d] dark:hover:text-purple-400 transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onSignIn}
            className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            className="px-5 py-2 rounded-full bg-[#992e9d] hover:bg-[#832687] text-white text-xs font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
          >
            Launch Portal <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[#992e9d] dark:text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Enterprise Capacity Building
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 dark:text-white tracking-tight leading-tight">
            Bridge Organizational Skill Gaps with <span className="text-[#992e9d] dark:text-purple-400">Data-Driven</span> Capacity Building
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
            Capacity Connect empowers enterprise organizations and government bodies to map competency requirements, measure individual skill gaps, deploy AI-recommended learning paths, and audit real-time capability growth.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="px-7 py-3 rounded-full bg-[#992e9d] hover:bg-[#832687] text-white font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              Explore Dashboard Demo <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onEnterApp}
              className="px-7 py-3 rounded-full border border-purple-200 dark:border-purple-800 text-[#992e9d] dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 font-medium text-sm transition-all"
            >
              View Admin Analytics
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-[11px] bg-slate-50 dark:bg-[#0C1220] border border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-semibold text-[#992e9d] dark:text-purple-400">94%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Competency Gap Resolution</div>
            </div>
            <div className="p-4 rounded-[11px] bg-slate-50 dark:bg-[#0C1220] border border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-semibold text-slate-900 dark:text-white">120+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Skill Mapping Frameworks</div>
            </div>
            <div className="p-4 rounded-[11px] bg-slate-50 dark:bg-[#0C1220] border border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-semibold text-[#992e9d] dark:text-purple-400">Real-time</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Automated Progress Audits</div>
            </div>
            <div className="p-4 rounded-[11px] bg-slate-50 dark:bg-[#0C1220] border border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-semibold text-slate-900 dark:text-white">100%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Verified Accreditation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-16 bg-slate-50/60 dark:bg-[#060A17] border-y border-purple-100 dark:border-slate-800 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">The End-to-End Capacity Lifecycle</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">A structured workflow from department requirements to verified competency mastery.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step) => {
              const IconComponent = step.icon;
              return (
                <div key={step.step} className="bg-white dark:bg-[#0C1220] p-6 rounded-[11px] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-600 transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 text-[#992e9d] dark:text-purple-300 border border-purple-100 dark:border-purple-800">Step {step.step}</span>
                    <IconComponent className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">Built for Enterprise Governance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Everything required for institutional skill transformation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#0C1220] p-6 rounded-[11px] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800 flex items-center justify-center text-[#992e9d] dark:text-purple-300">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Department Hierarchy</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Model complex organizational structures, departments, and specific designation competency baselines with ease.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0C1220] p-6 rounded-[11px] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800 flex items-center justify-center text-[#992e9d] dark:text-purple-300">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Automated Gap Diagnosis</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Instant diagnostic assessment engine identifies critical individual skill deficits and targets exact learning areas.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0C1220] p-6 rounded-[11px] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800 flex items-center justify-center text-[#992e9d] dark:text-purple-300">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Certified Accreditation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Issue tamper-proof certificates with QR validation and detailed skill breakdown upon successful course completion.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-slate-50/60 dark:bg-[#060A17] border-t border-purple-100 dark:border-slate-800 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">SIH26075 Prototype Details & Specifications</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#0C1220] rounded-[11px] border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left px-5 py-4 font-semibold text-sm text-slate-900 dark:text-white flex items-center justify-between hover:text-[#992e9d] dark:hover:text-purple-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-purple-100 dark:border-slate-800 bg-white dark:bg-[#030610] text-slate-500 dark:text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-[#992e9d] dark:text-purple-300">
              <AILogo size={14} theme="light" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Capacity Connect</span>
            <span>— SIH 2026 Prototype (SIH26075)</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-slate-800 dark:hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-slate-800 dark:hover:text-white transition-colors">Workflow</a>
            <a href="#faq" className="hover:text-slate-800 dark:hover:text-white transition-colors">FAQ</a>
            <button onClick={onGetStarted} className="text-[#992e9d] dark:text-purple-400 font-semibold hover:underline">
              Enter Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
