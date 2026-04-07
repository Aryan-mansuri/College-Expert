import { motion } from "motion/react";
import { Mail, Phone } from "lucide-react";

export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Contact Us
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Have questions or need personalized admission advice? Reach out directly.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center"
        >
          <div className="bg-indigo-50 p-4 rounded-full mb-6">
            <Phone className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Phone</h3>
          <p className="text-slate-600 mb-4">Call or WhatsApp us</p>
          <a href="tel:+919427017076" className="text-lg font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            +91 94270 17076
          </a>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center"
        >
          <div className="bg-indigo-50 p-4 rounded-full mb-6">
            <Mail className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Email</h3>
          <p className="text-slate-600 mb-4">Drop us a line anytime</p>
          <a href="mailto:am6112008@gmail.com" className="text-lg font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            am6112008@gmail.com
          </a>
        </motion.div>
      </div>
    </div>
  );
}
