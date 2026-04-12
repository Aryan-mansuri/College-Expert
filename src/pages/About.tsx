import { motion } from "motion/react";
import { ShieldCheck, BookOpen, Award, HeartHandshake, ArrowRight, CheckCircle2, Users, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-blue-100 dark:selection:bg-blue-900/30 font-sans">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950 z-0" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8 border border-blue-200 dark:border-blue-800/50">
              <ShieldCheck className="w-4 h-4" />
              Your Trusted Admissions Companion
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 leading-tight">
              Making the right college choice <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                shouldn't be a guessing game.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
              We believe transparency is the foundation of a great career choice. CollegeExpert.in provides verified data, authentic student reviews, and unbiased insights to help you build your future with absolute confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/"
                className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Start Exploring
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Metrics */}
      <section className="py-10 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center justify-center p-4">
              <Building2 className="w-8 h-8 text-blue-500 mb-3" />
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">1,000+</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Colleges Indexed</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <Users className="w-8 h-8 text-indigo-500 mb-3" />
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">50,000+</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Students Guided</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-3" />
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">100%</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unbiased & Verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars of Trust */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">The Pillars of Our Platform</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              We've built our platform on unwavering principles to ensure you get the most accurate and helpful information possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Verified Placement Data",
                desc: "We look past the marketing brochures. Our data is sourced from official NIRF reports, RTI responses, and verified alumni networks to give you the real picture of ROI.",
                color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
              },
              {
                icon: HeartHandshake,
                title: "Authentic Student Voices",
                desc: "Every college has a unique culture. We aggregate and synthesize thousands of real student reviews to help you understand the true campus environment and daily life.",
                color: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
              },
              {
                icon: BookOpen,
                title: "Comprehensive Cutoffs",
                desc: "Navigating JoSAA and state counseling is stressful. We provide accurate, historical opening and closing ranks to help you make realistic and strategic choices.",
                color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
              },
              {
                icon: Award,
                title: "Zero Sponsored Bias",
                desc: "Our loyalty is exclusively to the students. We do not accept payments from institutions to inflate their rankings or hide negative reviews. You get the unvarnished truth.",
                color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.color}`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-blue-600 dark:bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Our Commitment to You</h2>
          <p className="text-lg sm:text-xl text-blue-100 leading-relaxed mb-10 font-medium">
            "Choosing an engineering college is one of the most significant investments of time and money in a student's life. We are committed to leveling the playing field by democratizing access to high-quality, trustworthy educational data. Your success is our ultimate metric."
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            Find Your Dream College
          </Link>
        </div>
      </section>
    </div>
  );
}
