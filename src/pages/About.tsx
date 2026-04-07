import { motion } from "motion/react";
import { GraduationCap, ShieldCheck, Database, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          About CollegeExpert.in
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          We believe every student deserves transparent, data-driven insights to make the most important decision of their academic career.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {[
          {
            icon: Database,
            title: "Data-Driven Insights",
            desc: "We aggregate the latest placement reports, official cutoffs, and admission data so you don't have to spend hours searching."
          },
          {
            icon: Users,
            title: "Real Student Voices",
            desc: "We synthesize thousands of reviews from Quora, Reddit, and YouTube to give you the unfiltered 'vibe' of the campus."
          },
          {
            icon: ShieldCheck,
            title: "Unbiased & Objective",
            desc: "No sponsored rankings. No hidden agendas. Just raw data and honest pros and cons to help you choose wisely."
          },
          {
            icon: GraduationCap,
            title: "Built for PCM Students",
            desc: "Specifically tailored for 12th-grade Science A-Group students navigating JoSAA, CSAB, and state counseling."
          }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <feature.icon className="w-10 h-10 text-indigo-600 mb-6" />
            <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
            <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-indigo-600 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl"
      >
        <h3 className="text-2xl sm:text-3xl font-bold mb-4">Ready to find your college?</h3>
        <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
          Head back to the home page and search for any engineering college in India to get an instant, comprehensive review.
        </p>
        <Link 
          to="/"
          className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-indigo-600 bg-white rounded-xl hover:bg-indigo-50 transition-colors"
        >
          Start Searching
        </Link>
      </motion.div>
    </div>
  );
}
