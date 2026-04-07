import { useState, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { Search, GraduationCap, TrendingUp, Building2, MessageSquare, Loader2, AlertCircle, ExternalLink, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const fetchCollegeImage = async (searchQuery: string) => {
  try {
    const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery + " institute engineering india")}&utf8=&format=json&origin=*`);
    const searchData = await searchRes.json();
    if (searchData.query?.search?.length > 0) {
      const title = searchData.query.search[0].title;
      const imageRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=1000&origin=*`);
      const imageData = await imageRes.json();
      const pages = imageData.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pages[pageId]?.thumbnail?.source) {
          return pages[pageId].thumbnail.source;
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch image", e);
  }
  return null;
};

interface CollegeData {
  content: string;
  sources: { title: string; uri: string }[];
  imageUrl: string | null;
  similarColleges: string[];
  officialWebsite: string | null;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CollegeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const activeQuery = overrideQuery || query;
    if (!activeQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const [response, imageUrl] = await Promise.all([
        ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Provide a deep, data-driven review for the college: ${activeQuery}. 
          Focus on 2025-2026 data for PCM students in India. 
          Follow the exact structure requested: 
          1. 🏛️ [College Full Name & Location]
          2. ✅ Pros & ❌ Cons
          3. 📉 Admission & Cutoffs (2025/26 Expected)
          4. 💰 Placement Data
          5. 📚 Curriculum & Academics
          6. 🗣️ Student Reviews & Vibe
          7. 💡 Expert Advice
          8. 🔗 Similar Colleges`,
          config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: `You are a "College Admission Expert" for 12th-grade PCM (Science A-Group) students in India. 
            Your goal is to provide deep, data-driven reviews of engineering colleges to help them make informed choices during counseling (JoSAA, CSAB, ACPC, etc.).
            
            When a user provides a college name:
            1. Use Google Search to find the most recent (2025-2026) data and the official college website.
            2. Search for: "[College Name] official placement report 2025", "[College Name] JEE Main/GUJCET cutoff", "[College Name] curriculum and academic pressure", and "Student reviews on Quora/YouTube/Reddit".
            3. Synthesize this information into the structured format below.
            
            Output Structure:
            ### 🏛️ [College Full Name & Location]
            **Overview:** A 2-sentence summary of the college's reputation and campus vibe.
            **Official Website:** https://...
            
            ---
            
            ### ✅ Pros & ❌ Cons
            * **Pros:** (List 3 specific strengths)
            * **Cons:** (List 2-3 honest weaknesses)
            
            ---
            
            ### 📉 Admission & Cutoffs (2025/26 Expected)
            * **Entrance Exam:** (e.g., JEE Main, GUJCET, BITSAT)
            * **Closing Ranks:** Provide a small table for Computer Science (CSE) and other top branches for General/OBC categories.
            
            ---
            
            ### 💰 Placement Data
            * **Highest Package:** ₹[Amount] LPA
            * **Average Package:** ₹[Amount] LPA (Focus on CSE/IT specifically if possible)
            * **Top Recruiters:** (List 4-5 major companies)
            
            ---
            
            ### 📚 Curriculum & Academics
            * **Structure:** (Brief overview of the curriculum, e.g., theoretical vs practical focus, updated syllabus)
            * **Academic Pressure:** (Details on grading strictness, attendance policies like 75% rule, and workload)
            
            ---
            
            ### 🗣️ Student Reviews & Vibe
            Summarize what students are saying on YouTube, Quora, and Reddit regarding the faculty, mess food, hostels, and extracurriculars. Include specific sentiments or quotes if available.
            
            ---
            
            ### 💡 Expert Advice
            Provide expert advice for students considering this college. Write this step-by-step with proper spacing between each point (e.g., use bullet points or numbered lists with clear paragraph breaks). Give actionable guidance on whether they should choose it, what alternatives to consider, and how to prepare.
            
            ---
            
            ### 🔗 Similar Colleges
            List 3-5 similar colleges based on rank, cutoff, and location. Provide ONLY the names separated by commas.
            
            Tone: Be objective, helpful, and encouraging. If data is unavailable, state it clearly rather than guessing. Ensure there is a blank line before and after each horizontal rule (---) to maintain proper spacing between topics.`,
          },
        }),
        fetchCollegeImage(activeQuery)
      ]);

      const text = response.text;
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web)
        .filter(Boolean) || [];

      // Parse similar colleges
      const similarSection = text.split("### 🔗 Similar Colleges").pop() || "";
      const similarColleges = similarSection
        .split(",")
        .map(s => s.replace(/[*#\n]/g, "").trim())
        .filter(s => s.length > 0 && s.length < 100)
        .slice(0, 5);

      let mainContent = text.split("### 🔗 Similar Colleges")[0].trim();

      // Parse official website
      let officialWebsite = null;
      const websiteMatch = mainContent.match(/\*\*Official Website:\*\*\s*(?:\[.*?\]\()?(https?:\/\/[^\s\)]+)(?:\))?/);
      if (websiteMatch) {
        officialWebsite = websiteMatch[1];
        mainContent = mainContent.replace(/\*\*Official Website:\*\*.*/g, "").trim();
      }

      setResult({ content: mainContent, sources, imageUrl, similarColleges, officialWebsite });
    } catch (err: any) {
      console.error("Search error:", err);
      setError("Failed to fetch college data. Please try again or check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight"
        >
          Find Your Dream Engineering College
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-600 max-w-2xl mx-auto"
        >
          Get real-time, data-driven reviews for 2025-26 admissions. 
          Placements, cutoffs, and student vibes—all in one place.
        </motion.p>
      </div>

      {/* Search Bar */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative max-w-2xl mx-auto mb-16"
      >
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter college name (e.g., IIT Bombay, DA-IICT)..."
            className="block w-full pl-11 pr-32 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </button>
        </form>
      </motion.div>

      {/* Features Section */}
      {!result && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {[
            { icon: TrendingUp, title: "Latest Cutoffs", desc: "Expected 2025 closing ranks based on recent trends." },
            { icon: Building2, title: "Placement Stats", desc: "Highest and average packages for CSE/IT branches." },
            { icon: MessageSquare, title: "Student Reviews", desc: "Real feedback from Quora, Reddit, and YouTube." }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <feature.icon className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <GraduationCap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">Analyzing 2025 Data...</p>
              <p className="text-sm text-slate-500">Searching official reports and student forums</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 text-red-700"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </motion.div>
        )}

        {result && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
            ref={scrollRef}
          >
            <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
              {result.imageUrl && (
                <div className="w-full h-64 sm:h-80 bg-slate-100 relative">
                  <img 
                    src={result.imageUrl} 
                    alt="College Campus" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
              )}
              <div className="p-8 sm:p-10">
                {result.officialWebsite && (
                  <div className="mb-8">
                    <a 
                      href={result.officialWebsite} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Visit Official Website
                    </a>
                  </div>
                )}
                <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 prose-strong:text-slate-900 prose-ul:list-disc prose-li:marker:text-indigo-400">
                  <ReactMarkdown
                    components={{
                      h3: ({ children }) => (
                        <h3 className="text-2xl font-bold flex items-center gap-2 mt-12 mb-6 text-slate-900 border-b border-slate-100 pb-3">
                          {children}
                        </h3>
                      ),
                      hr: () => <hr className="my-12 border-slate-200" />,
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-6 rounded-xl border border-slate-100">
                          <table className="w-full text-sm text-left">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="bg-slate-50 px-4 py-3 font-semibold text-slate-900 border-b border-slate-100">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-3 border-b border-slate-100 text-slate-600">
                          {children}
                        </td>
                      )
                    }}
                  >
                    {result.content}
                  </ReactMarkdown>
                </div>

                {/* Similar Colleges Section */}
                {result.similarColleges.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <GraduationCap className="w-6 h-6 text-indigo-600" />
                      Explore Similar Alternatives
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.similarColleges.map((college, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setQuery(college);
                            handleSearch(undefined, college);
                          }}
                          className="flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl text-left transition-all group"
                        >
                          <span className="font-medium text-slate-700 group-hover:text-indigo-700 truncate pr-2">
                            {college}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sources Footer */}
              {result.sources.length > 0 && (
                <div className="bg-slate-50 px-8 py-6 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ExternalLink className="w-3 h-3" />
                    Verified Sources
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {result.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                      >
                        {source.title}
                        <ChevronRight className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <p className="text-center text-xs text-slate-400 px-4">
              Disclaimer: Data is synthesized from real-time search results. 
              Always verify with official counseling brochures (JoSAA/ACPC) before making final decisions.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
