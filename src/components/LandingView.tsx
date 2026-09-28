/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  TrendingUp,
  Brain,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Building2,
  Users,
  Target,
  Award,
  ChevronDown,
  BarChart3,
  GraduationCap
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
    <div className="bg-white text-slate-900 min-h-screen overflow-x-hidden font-sans select-none">
      {/* Header Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-purple-100 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onGetStarted}>
          <div className="p-2 rounded-full bg-purple-50 text-[#992e9d] transition-transform group-hover:scale-105 flex items-center justify-center border border-purple-200">
            <AILogo size={24} theme="light" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-slate-900 tracking-tight block leading-none">CAPACITY CONNECT</span>
              <span className="bg-purple-100 text-[#992e9d] text-[10px] font-bold px-2 py-0.5 rounded-full">SIH 2026</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Digital Capacity & Learning Portal</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
          <a href="#features" className="hover:text-[#992e9d] transition-colors">Features</a>
          <a href="#workflow" className="hover:text-[#992e9d] transition-colors">Workflow</a>
          <a href="#analytics" className="hover:text-[#992e9d] transition-colors">Analytics</a>
          <a href="#faq" className="hover:text-[#992e9d] transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onSignIn}
            className="px-4 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-[#992e9d] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Enterprise Capacity Building
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight leading-tight">
            Bridge Organizational Skill Gaps with <span className="text-[#992e9d]">Data-Driven</span> Capacity Building
          </h1>

          <p className="text-slate-600 text-base leading-relaxed">
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
              className="px-7 py-3 rounded-full border border-purple-200 text-[#992e9d] bg-purple-50/50 hover:bg-purple-100/60 font-medium text-sm transition-all"
            >
              View Admin Analytics
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-[11px] bg-slate-50 border border-slate-100">
              <div className="text-2xl font-semibold text-[#992e9d]">94%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Competency Gap Resolution</div>
            </div>
            <div className="p-4 rounded-[11px] bg-slate-50 border border-slate-100">
              <div className="text-2xl font-semibold text-slate-900">120+</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Skill Mapping Frameworks</div>
            </div>
            <div className="p-4 rounded-[11px] bg-slate-50 border border-slate-100">
              <div className="text-2xl font-semibold text-[#992e9d]">Real-time</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Automated Progress Audits</div>
            </div>
            <div className="p-4 rounded-[11px] bg-slate-50 border border-slate-100">
              <div className="text-2xl font-semibold text-slate-900">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Verified Accreditation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-16 bg-slate-50/60 border-y border-purple-100 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">The End-to-End Capacity Lifecycle</h2>
            <p className="text-sm text-slate-500 mt-2">A structured workflow from department requirements to verified competency mastery.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step) => {
              const IconComponent = step.icon;
              return (
                <div key={step.step} className="bg-white p-6 rounded-[11px] border border-slate-200/80 shadow-sm hover:border-purple-300 transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-[#992e9d]">Step {step.step}</span>
                    <IconComponent className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">Built for Enterprise Governance</h2>
          <p className="text-sm text-slate-500 mt-2">Everything required for institutional skill transformation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[11px] border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-[#992e9d]">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Department Hierarchy</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Model complex organizational structures, departments, and specific designation competency baselines with ease.
            </p>
          </div>

          <div className="bg-white p-6 rounded-[11px] border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-[#992e9d]">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Automated Gap Diagnosis</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Instant diagnostic assessment engine identifies critical individual skill deficits and targets exact learning areas.
            </p>
          </div>

          <div className="bg-white p-6 rounded-[11px] border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-[#992e9d]">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Certified Accreditation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Issue tamper-proof certificates with QR validation and detailed skill breakdown upon successful course completion.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-slate-50/60 border-t border-purple-100 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500 mt-1">SIH26075 Prototype Details & Specifications</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[11px] border border-slate-200/80 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left px-5 py-4 font-semibold text-sm text-slate-900 flex items-center justify-between hover:text-[#992e9d] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-purple-100 bg-white text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[#992e9d]">
              <AILogo size={14} theme="light" />
            </div>
            <span className="font-semibold text-slate-800">Capacity Connect</span>
            <span>— SIH 2026 Prototype (SIH26075)</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-slate-800 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-slate-800 transition-colors">Workflow</a>
            <a href="#faq" className="hover:text-slate-800 transition-colors">FAQ</a>
            <button onClick={onGetStarted} className="text-[#992e9d] font-semibold hover:underline">
              Enter Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
