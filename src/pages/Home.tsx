import { useState, useRef, useEffect } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { Search, GraduationCap, TrendingUp, Building2, MessageSquare, Loader2, AlertCircle, ExternalLink, ChevronRight, Newspaper, Mic, MicOff, Scale, X, Plus, Trophy, Banknote, Target, Map, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface CompareData {
  colleges: {
    name: string;
    nirfRanking: string;
    highestPlacement: string;
    averagePlacement: string;
    csCutoff: string;
    campusSize: string;
    fees: string;
    pros: string[];
    cons: string[];
  }[];
  summary: string;
}

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

interface TrendingCollege {
  name: string;
}

interface NewsItem {
  title: string;
  summary: string;
  url: string;
  date: string;
}

const POPULAR_COLLEGES = [
  // IITs
  "IIT Bombay - Indian Institute of Technology",
  "IIT Delhi - Indian Institute of Technology",
  "IIT Madras - Indian Institute of Technology",
  "IIT Kanpur - Indian Institute of Technology",
  "IIT Kharagpur - Indian Institute of Technology",
  "IIT Roorkee - Indian Institute of Technology",
  "IIT Guwahati - Indian Institute of Technology",
  "IIT Hyderabad - Indian Institute of Technology",
  "IIT BHU Varanasi - Indian Institute of Technology",
  "IIT Indore - Indian Institute of Technology",
  "IIT Mandi - Indian Institute of Technology",
  "IIT Patna - Indian Institute of Technology",
  "IIT Gandhinagar - Indian Institute of Technology",
  "IIT Ropar - Indian Institute of Technology",
  "IIT Jodhpur - Indian Institute of Technology",
  "IIT Bhubaneswar - Indian Institute of Technology",
  "IIT Dhanbad (ISM) - Indian Institute of Technology",
  // NITs
  "NIT Trichy - National Institute of Technology",
  "NIT Surathkal - National Institute of Technology",
  "NIT Warangal - National Institute of Technology",
  "NIT Calicut - National Institute of Technology",
  "NIT Rourkela - National Institute of Technology",
  "MNNIT Allahabad - Motilal Nehru National Institute of Technology",
  "MNIT Jaipur - Malaviya National Institute of Technology",
  "NIT Kurukshetra - National Institute of Technology",
  "NIT Silchar - National Institute of Technology",
  "NIT Durgapur - National Institute of Technology",
  "NIT Jalandhar - Dr. B. R. Ambedkar National Institute of Technology",
  "MANIT Bhopal - Maulana Azad National Institute of Technology",
  "VNIT Nagpur - Visvesvaraya National Institute of Technology",
  "SVNIT Surat - Sardar Vallabhbhai National Institute of Technology",
  "NIT Raipur - National Institute of Technology",
  "NIT Jamshedpur - National Institute of Technology",
  // IIITs
  "IIIT Hyderabad - International Institute of Information Technology",
  "IIIT Bangalore - International Institute of Information Technology",
  "IIIT Allahabad - Indian Institute of Information Technology",
  "IIIT Delhi - Indraprastha Institute of Information Technology",
  "ABV-IIITM Gwalior - Atal Bihari Vajpayee Indian Institute of Information Technology",
  "IIITDM Kancheepuram - Indian Institute of Information Technology Design & Manufacturing",
  "IIIT Pune - Indian Institute of Information Technology",
  "IIIT Guwahati - Indian Institute of Information Technology",
  "IIIT Lucknow - Indian Institute of Information Technology",
  // Top State & Private
  "BITS Pilani - Birla Institute of Technology and Science",
  "BITS Goa - Birla Institute of Technology and Science",
  "BITS Hyderabad - Birla Institute of Technology and Science",
  "VIT Vellore - Vellore Institute of Technology",
  "VIT Chennai - Vellore Institute of Technology",
  "Delhi Technological University (DTU)",
  "NSUT Delhi - Netaji Subhas University of Technology",
  "Jadavpur University, Kolkata",
  "College of Engineering, Pune (COEP)",
  "VJTI Mumbai - Veermata Jijabai Technological Institute",
  "SPIT Mumbai - Sardar Patel Institute of Technology",
  "RV College of Engineering (RVCE), Bangalore",
  "BMS College of Engineering, Bangalore",
  "Ramaiah Institute of Technology (MSRIT), Bangalore",
  "PES University, Bangalore",
  "DA-IICT Gandhinagar",
  "Nirma University, Ahmedabad",
  "LD College of Engineering, Ahmedabad",
  "Thapar Institute of Engineering and Technology (TIET), Patiala",
  "Manipal Institute of Technology (MIT)",
  "SRM Institute of Science and Technology, Chennai",
  "Amrita School of Engineering, Coimbatore",
  "PSG College of Technology, Coimbatore",
  "PEC Chandigarh - Punjab Engineering College",
  "BIT Mesra - Birla Institute of Technology",
  "KIIT Bhubaneswar - Kalinga Institute of Industrial Technology",
  "Jaypee Institute of Information Technology (JIIT), Noida"
];

const INITIAL_TRENDING: TrendingCollege[] = [
  { name: POPULAR_COLLEGES[0] }, // IIT Bombay
  { name: POPULAR_COLLEGES[1] }, // IIT Delhi
  { name: POPULAR_COLLEGES[2] }, // IIT Madras
  { name: POPULAR_COLLEGES[3] }, // IIT Kanpur
  { name: POPULAR_COLLEGES[4] }, // IIT Kharagpur
  { name: "NIT Trichy - National Institute of Technology" },
  { name: "NIT Surathkal - National Institute of Technology" },
  { name: "NIT Warangal - National Institute of Technology" },
  { name: "IIIT Hyderabad - International Institute of Information Technology" },
  { name: "BITS Pilani - Birla Institute of Technology and Science" },
  { name: "VIT Vellore - Vellore Institute of Technology" },
  { name: "Delhi Technological University (DTU)" },
  { name: "Jadavpur University, Kolkata" },
  { name: "College of Engineering, Pune (COEP)" },
  { name: "SRM Institute of Science and Technology, Chennai" }
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CollegeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trendingColleges, setTrendingColleges] = useState<TrendingCollege[]>(INITIAL_TRENDING);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  // Compare Feature State
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareData | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setQuestion(transcript);
      };
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === 'network') {
          setSpeechError("Network error: Your browser may block speech recognition in embedded frames. Please type your question.");
        } else if (event.error === 'not-allowed') {
          setSpeechError("Microphone access denied. Please allow microphone permissions.");
        } else {
          setSpeechError(`Speech recognition failed (${event.error}). Please type your question.`);
        }
        
        // Clear error after 5 seconds
        setTimeout(() => setSpeechError(null), 5000);
      };
    }
  }, []);

  const toggleListening = () => {
    setSpeechError(null);
    if (!recognitionRef.current) {
      setSpeechError("Speech recognition is not supported in your browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setQuestion(""); // Clear previous text before listening
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchNews = async () => {
      const cachedNews = sessionStorage.getItem('latestNews');
      if (cachedNews) {
        setNews(JSON.parse(cachedNews));
        setLoadingNews(false);
        return;
      }

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: "Find the top 3 latest news articles related to college admissions in India, JEE Main, CLAT, or government education announcements for April 2026. Return the result strictly as a JSON array of objects with 'title', 'summary', 'url', and 'date' fields. Do not include markdown formatting like ```json.",
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  url: { type: Type.STRING },
                  date: { type: Type.STRING }
                },
                required: ["title", "summary", "url", "date"]
              }
            }
          }
        });
        
        if (isMounted) {
          const data = JSON.parse(response.text);
          setNews(data);
          sessionStorage.setItem('latestNews', JSON.stringify(data));
        }
      } catch (err) {
        console.error("Failed to fetch news:", err);
      } finally {
        if (isMounted) setLoadingNews(false);
      }
    };
    fetchNews();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (query.trim()) {
      const queryTerms = query.toLowerCase().split(' ').filter(Boolean);
      const filtered = POPULAR_COLLEGES.filter(college => {
        const collegeLower = college.toLowerCase();
        return queryTerms.every(term => collegeLower.includes(term));
      }).slice(0, 8);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !result) return;

    setAsking(true);
    setAnswer(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `The user is asking a question about the college: ${query}. 
        Question: ${question}
        
        Please provide a helpful, accurate, and concise answer based on the latest available information.`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      
      setAnswer(response.text);
    } catch (err) {
      console.error("Failed to answer question:", err);
      setAnswer("Sorry, I couldn't find an answer to that question right now. Please try again.");
    } finally {
      setAsking(false);
    }
  };

  const toggleCompare = (college: string) => {
    setCompareList(prev => {
      if (prev.includes(college)) {
        return prev.filter(c => c !== college);
      }
      if (prev.length >= 3) {
        alert("You can compare up to 3 colleges at a time.");
        return prev;
      }
      return [...prev, college];
    });
  };

  const handleCompare = async () => {
    if (compareList.length < 2) return;
    setIsComparing(true);
    setCompareError(null);
    setCompareResult(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Compare the following engineering colleges in India: ${compareList.join(", ")}. 
        Provide a detailed side-by-side comparison based on key metrics like NIRF Rankings, Highest Placement, Average Placement, CS Cutoff (approx), Campus Size, and Fees. 
        Also provide a brief summary of which college is better for what.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              colleges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    nirfRanking: { type: Type.STRING },
                    highestPlacement: { type: Type.STRING },
                    averagePlacement: { type: Type.STRING },
                    csCutoff: { type: Type.STRING },
                    campusSize: { type: Type.STRING },
                    fees: { type: Type.STRING },
                    pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                    cons: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["name", "nirfRanking", "highestPlacement", "averagePlacement", "csCutoff", "campusSize", "fees", "pros", "cons"]
                }
              },
              summary: { type: Type.STRING }
            },
            required: ["colleges", "summary"]
          }
        }
      });
      
      if (response.text) {
        setCompareResult(JSON.parse(response.text) as CompareData);
      } else {
        throw new Error("Empty response");
      }
    } catch (err) {
      console.error("Failed to compare colleges:", err);
      setCompareError("Failed to generate comparison. Please try again.");
    } finally {
      setIsComparing(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const activeQuery = overrideQuery || query;
    if (!activeQuery.trim()) return;

    setShowSuggestions(false);
    setLoading(true);
    setError(null);
    setResult(null);
    setQuestion("");
    setAnswer(null);

    try {
      let currentImageUrl: string | null = null;
      fetchCollegeImage(activeQuery).then(url => {
        currentImageUrl = url;
        setResult(prev => prev ? { ...prev, imageUrl: url } : null);
      });

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: `Provide a deep, data-driven review for the college: ${activeQuery}. 
        Focus on the latest 2026 data for PCM students in India. 
        Follow the exact structure requested: 
        1. 🏛️ [College Full Name & Location]
        2. ✅ Pros & ❌ Cons
        3. 📅 Important Dates (Entrance Exams)
        4. 📉 Admission & Cutoffs (2026 Expected/Latest)
        5. 💰 Placement Data (Latest 2026)
        6. 📚 Curriculum & Academics
        7. 🗣️ Student Reviews & Vibe
        8. 💡 Expert Advice
        9. 🔗 Similar Colleges`,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: `You are a "College Admission Expert" for 12th-grade PCM (Science A-Group) students in India. 
          Your goal is to provide deep, data-driven reviews of engineering colleges to help them make informed choices during counseling (JoSAA, CSAB, ACPC, etc.).
          
          When a user provides a college name:
          1. Use Google Search to find the absolute latest (2026) data and the official college website.
          2. Search for: "[College Name] official placement report 2026", "[College Name] JEE Main/GUJCET cutoff 2026", "[College Name] entrance exam application deadline dates 2026", "[College Name] curriculum and academic pressure", and "Student reviews on Quora/YouTube/Reddit".
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
          
          ### 📅 Important Dates (Entrance Exams)
          * **Exam Name:** (e.g., JEE Main, BITSAT, VITEEE, GUJCET)
          * **Application Deadline:** (Expected or official last date to apply for 2026. Highlight if it is approaching soon!)
          * **Exam Date:** (Expected or official exam dates for 2026)
          
          ---
          
          ### 📉 Admission & Cutoffs (2026 Expected)
          * **Entrance Exam:** (e.g., JEE Main, GUJCET, BITSAT)
          * **Closing Ranks:** Provide a small table for Computer Science (CSE) and other top branches for General/OBC categories based on the latest 2026 trends.
          
          ---
          
          ### 💰 Placement Data (Latest 2026)
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
      });

      let fullText = "";
      let allSources: { title: string; uri: string }[] = [];
      let officialWebsite: string | null = null;
      let isFirstChunk = true;

      for await (const chunk of responseStream) {
        if (isFirstChunk) {
          setLoading(false);
          isFirstChunk = false;
        }

        fullText += chunk.text;

        const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          const newSources = chunks.map((c: any) => c.web).filter(Boolean);
          allSources = [...allSources, ...newSources];
          allSources = allSources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);
        }

        let displayContent = fullText;
        const websiteMatch = fullText.match(/\*\*Official Website:\*\*\s*(?:\[.*?\]\()?(https?:\/\/[^\s\)]+)(?:\))?/);
        if (websiteMatch) {
          officialWebsite = websiteMatch[1];
          displayContent = fullText.replace(/\*\*Official Website:\*\*.*/g, "").trim();
        }

        if (displayContent.includes("### 🔗 Similar Colleges")) {
          displayContent = displayContent.split("### 🔗 Similar Colleges")[0].trim();
        }

        setResult({
          content: displayContent,
          sources: allSources,
          imageUrl: currentImageUrl,
          similarColleges: [],
          officialWebsite
        });
      }

      // Final parse for similar colleges
      const similarSection = fullText.split("### 🔗 Similar Colleges").pop() || "";
      const similarColleges = similarSection
        .split(",")
        .map(s => s.replace(/[*#\n]/g, "").trim())
        .filter(s => s.length > 0 && s.length < 100)
        .slice(0, 5);

      setResult(prev => prev ? { ...prev, similarColleges } : null);

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
          Find Your Dream College
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
        className="relative max-w-2xl mx-auto mb-16 z-50"
        ref={searchContainerRef}
      >
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (query.trim()) setShowSuggestions(true);
            }}
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

        {/* Auto-suggest Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden"
            >
              <ul className="py-2">
                {suggestions.map((suggestion, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(suggestion);
                        setShowSuggestions(false);
                        handleSearch(undefined, suggestion);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors flex items-center gap-3"
                    >
                      <Search className="w-4 h-4 text-slate-400" />
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Trending Colleges Section */}
      {!result && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-16"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Trending Colleges
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {trendingColleges.map((college, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setQuery(college.name);
                  handleSearch(undefined, college.name);
                }}
                className="group cursor-pointer flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left p-4"
              >
                <div className="flex-1 flex flex-col justify-between">
                  <h4 className="font-semibold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {college.name}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompare(college.name);
                    }}
                    className={`w-full py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      compareList.includes(college.name)
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {compareList.includes(college.name) ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {compareList.includes(college.name) ? "Remove" : "Compare"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

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

      {/* News Feed Section */}
      {!result && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-indigo-600" />
            Latest Admission News
          </h3>
          {loadingNews ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {news.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  <p className="text-xs text-indigo-600 font-semibold mb-2">{item.date}</p>
                  <h4 className="font-bold text-slate-900 mb-2 line-clamp-2">{item.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-3">{item.summary}</p>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
              No recent news found.
            </div>
          )}
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
                        <div key={idx} className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setQuery(college);
                              handleSearch(undefined, college);
                            }}
                            className="flex-1 flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl text-left transition-all group"
                          >
                            <span className="font-medium text-slate-700 group-hover:text-indigo-700 truncate pr-2">
                              {college}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                          </button>
                          <button
                            onClick={() => toggleCompare(college)}
                            className={`p-4 rounded-2xl border transition-colors ${
                              compareList.includes(college)
                                ? "bg-indigo-100 border-indigo-200 text-indigo-700"
                                : "bg-white border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-600"
                            }`}
                            title="Add to Compare"
                          >
                            <Scale className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Ask a Question Section */}
              <div className="bg-indigo-50/50 px-8 py-8 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-indigo-600" />
                  Ask a Question about {query}
                </h3>
                <form onSubmit={handleAskQuestion} className="relative">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="E.g., What is the hostel fee? How is the mess food?"
                    className="block w-full pl-4 pr-32 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  <div className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                        isListening 
                          ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      title={isListening ? "Stop listening" : "Start voice typing"}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button
                      type="submit"
                      disabled={asking || !question.trim()}
                      className="px-4 h-full bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ask"}
                    </button>
                  </div>
                </form>

                {speechError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 text-sm text-red-600 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {speechError}
                  </motion.div>
                )}
                
                {answer && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-5 bg-white border border-indigo-100 rounded-xl shadow-sm"
                  >
                    <div className="prose prose-sm prose-slate max-w-none prose-a:text-indigo-600">
                      <ReactMarkdown>{answer}</ReactMarkdown>
                    </div>
                  </motion.div>
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

      {/* Floating Compare Bar */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4"
          >
            <div className="flex-1 w-full">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Comparing {compareList.length}/3 Colleges
              </p>
              <div className="flex flex-wrap gap-2">
                {compareList.map((college, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-100">
                    <span className="truncate max-w-[150px]">{college}</span>
                    <button onClick={() => toggleCompare(college)} className="hover:text-indigo-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCompareList([])}
                className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleCompare}
                disabled={compareList.length < 2 || isComparing}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isComparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
                Compare Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Result Modal */}
      <AnimatePresence>
        {(isComparing || compareResult || compareError) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-6 h-6 text-indigo-600" />
                  College Comparison
                </h2>
                <button
                  onClick={() => {
                    setCompareResult(null);
                    setCompareError(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {isComparing ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-lg font-medium text-slate-900">Analyzing and comparing data...</p>
                  </div>
                ) : compareError ? (
                  <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    {compareError}
                  </div>
                ) : compareResult ? (
                  <div className="space-y-8">
                    <div className="overflow-x-auto pb-4">
                      <div className="min-w-[800px] grid gap-x-4 gap-y-0" style={{ gridTemplateColumns: `200px repeat(${compareResult.colleges.length}, minmax(0, 1fr))` }}>
                        {/* Header Row */}
                        <div className="p-4 flex items-end">
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Metrics</span>
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50 flex flex-col justify-end mb-4">
                            <h3 className="text-xl font-bold text-slate-900 leading-tight">{college.name}</h3>
                          </div>
                        ))}

                        {/* NIRF Ranking */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 font-medium border-t border-slate-100">
                          <Trophy className="w-5 h-5 text-indigo-500" /> NIRF Ranking
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 font-semibold text-slate-900 flex items-center">
                            {college.nirfRanking}
                          </div>
                        ))}

                        {/* Highest Placement */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 font-medium border-t border-slate-100 bg-slate-50/50">
                          <Banknote className="w-5 h-5 text-emerald-500" /> Highest Placement
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 font-semibold text-emerald-700 bg-slate-50/50 flex items-center">
                            {college.highestPlacement}
                          </div>
                        ))}

                        {/* Average Placement */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 font-medium border-t border-slate-100">
                          <Banknote className="w-5 h-5 text-indigo-500" /> Average Placement
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 font-semibold text-slate-900 flex items-center">
                            {college.averagePlacement}
                          </div>
                        ))}

                        {/* CS Cutoff */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 font-medium border-t border-slate-100 bg-slate-50/50">
                          <Target className="w-5 h-5 text-rose-500" /> CS Cutoff
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 font-semibold text-slate-900 bg-slate-50/50 flex items-center">
                            {college.csCutoff}
                          </div>
                        ))}

                        {/* Campus Size */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 font-medium border-t border-slate-100">
                          <Map className="w-5 h-5 text-amber-500" /> Campus Size
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 font-semibold text-slate-900 flex items-center">
                            {college.campusSize}
                          </div>
                        ))}

                        {/* Fees */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 font-medium border-t border-slate-100 bg-slate-50/50">
                          <Wallet className="w-5 h-5 text-blue-500" /> Fees
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 font-semibold text-slate-900 bg-slate-50/50 flex items-center">
                            {college.fees}
                          </div>
                        ))}

                        {/* Pros */}
                        <div className="p-4 flex items-start gap-2 text-slate-600 font-medium border-t border-slate-100 pt-6">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" /> Key Strengths
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 pt-6">
                            <ul className="space-y-2">
                              {college.pros.map((pro, i) => (
                                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                  <span className="flex-1">{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}

                        {/* Cons */}
                        <div className="p-4 flex items-start gap-2 text-slate-600 font-medium border-t border-slate-100 bg-slate-50/50 pt-6 rounded-bl-2xl">
                          <XCircle className="w-5 h-5 text-rose-500 mt-0.5" /> Considerations
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 bg-slate-50/50 pt-6 last:rounded-br-2xl">
                            <ul className="space-y-2">
                              {college.cons.map((con, i) => (
                                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                  <span className="flex-1">{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 md:p-8 border border-indigo-100">
                      <h3 className="text-lg font-bold text-indigo-900 mb-3 flex items-center gap-2">
                        <Scale className="w-5 h-5" />
                        Final Verdict
                      </h3>
                      <p className="text-indigo-800 leading-relaxed">
                        {compareResult.summary}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
