import { useState, useRef, useEffect } from "react";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Search, GraduationCap, TrendingUp, Building2, MessageSquare, Loader2, AlertCircle, ExternalLink, ChevronRight, Newspaper, Mic, MicOff, Scale, X, Plus, Trophy, Banknote, Target, Map, Wallet, CheckCircle2, XCircle, Users, Network, BookOpen, MapPin, Plane, TrainFront } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn, isValidUrl, isOfficialCollegeWebsite, isReputableNewsSource } from "../lib/utils";

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
    facultyStudentRatio: string;
    alumniNetworkStrength: string;
    courseDetails: string;
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

const fetchCollegeLocation = async (collegeName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find detailed location information and Google Maps URL for the college: ${collegeName}. Return the result strictly as a JSON object with 'address', 'city', 'state', 'pincode', 'nearestAirport' (name and approx distance), 'nearestRailwayStation' (name and approx distance), and 'mapUrl' (valid Google Maps link). Do not include any other text or markdown formatting.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            address: { type: Type.STRING },
            city: { type: Type.STRING },
            state: { type: Type.STRING },
            pincode: { type: Type.STRING },
            nearestAirport: { type: Type.STRING },
            nearestRailwayStation: { type: Type.STRING },
            mapUrl: { type: Type.STRING }
          },
          required: ["address", "city", "state", "pincode", "nearestAirport", "nearestRailwayStation", "mapUrl"]
        }
      }
    });
    
    let text = response.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to fetch location:", e);
    return null;
  }
};

interface CollegeData {
  content: string;
  sources: { title: string; uri: string }[];
  imageUrl: string | null;
  similarColleges: string[];
  officialWebsite: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  nearestAirport?: string | null;
  nearestRailwayStation?: string | null;
  mapUrl?: string | null;
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

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Chandigarh"
];

export default function Home() {
  const currentYear = new Date().getFullYear();
  const currentMonthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonth = new Date().getMonth();
  const currentAcademicYear = currentMonth < 5 ? `${currentYear - 1}-${currentYear}` : `${currentYear}-${currentYear + 1}`;

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CollegeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trendingColleges, setTrendingColleges] = useState<TrendingCollege[]>(INITIAL_TRENDING);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningTarget, setListeningTarget] = useState<'query' | 'question' | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  // Compare Feature State
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareData | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);

  // State Feature State
  const [showStateModal, setShowStateModal] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [stateColleges, setStateColleges] = useState<string[]>([]);
  const [loadingStateColleges, setLoadingStateColleges] = useState(false);
  const [stateCities, setStateCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

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
        
        setListeningTarget(prevTarget => {
          if (prevTarget === 'query') {
            setQuery(transcript);
            setShowSuggestions(true);
          } else if (prevTarget === 'question') {
            setQuestion(transcript);
          }
          return prevTarget;
        });
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

  const toggleListening = (target: 'query' | 'question') => {
    setSpeechError(null);
    if (!recognitionRef.current) {
      setSpeechError("Speech recognition is not supported in your browser.");
      return;
    }
    if (isListening && listeningTarget === target) {
      recognitionRef.current.stop();
      setListeningTarget(null);
    } else {
      if (isListening) {
        recognitionRef.current.stop();
      }
      setListeningTarget(target);
      if (target === 'query') setQuery("");
      if (target === 'question') setQuestion("");
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchNews = async (forceUpdate = false, retryCount = 0) => {
      const cachedNews = localStorage.getItem('latestNews_v3');
      const cachedTime = localStorage.getItem('latestNewsTime_v3');
      const now = new Date().getTime();
      
      // Cache valid for 12 hours
      const isCacheValid = cachedNews && cachedTime && (now - parseInt(cachedTime)) < 12 * 60 * 60 * 1000;

      if (cachedNews) {
        setNews(JSON.parse(cachedNews));
        if (isCacheValid && !forceUpdate) {
          setLoadingNews(false);
          return;
        }
      }

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Find the top 6 latest news articles related to college admissions in India, JEE Main, CLAT, or government education announcements for ${currentMonthYear}. 
          
          CRITICAL: You MUST verify that the URL is from a highly reputable news source or official government portal. 
          Preferred domains: timesofindia.indiatimes.com, ndtv.com, hindustantimes.com, indianexpress.com, thehindu.com, news18.com, indiatoday.in, jagranjosh.com, pib.gov.in, education.gov.in, nta.ac.in.
          
          Do not return URLs from aggregator sites, personal blogs, or forums.
          
          Return the result strictly as a JSON array of objects with 'title', 'summary', 'url', and 'date' fields. Ensure all 'url' fields are absolute, valid URLs starting with http:// or https://. Do not include markdown formatting like \`\`\`json.`,
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
          // Client-side validation for news sources
          const validatedData = data.filter((item: any) => isReputableNewsSource(item.url));
          setNews(validatedData);
          localStorage.setItem('latestNews_v3', JSON.stringify(validatedData));
          localStorage.setItem('latestNewsTime_v3', now.toString());
        }
      } catch (err: any) {
        console.error("Failed to fetch news:", err);
        
        // Retry on rate limit
        if (isMounted && retryCount < 2 && (err.message?.includes("429") || JSON.stringify(err).includes("429"))) {
          setTimeout(() => fetchNews(forceUpdate, retryCount + 1), 5000 * (retryCount + 1));
          return;
        }

        if (!process.env.GEMINI_API_KEY) {
          console.error("GEMINI_API_KEY is missing.");
        }
      } finally {
        if (isMounted && retryCount === 0) setLoadingNews(false);
      }
    };
    
    fetchNews();
    
    // Auto-update every 4 hours
    const intervalId = setInterval(() => {
      fetchNews(true);
    }, 4 * 60 * 60 * 1000);
    
    return () => { 
      isMounted = false; 
      clearInterval(intervalId);
    };
  }, [currentMonthYear]);

  useEffect(() => {
    if (!process.env.GEMINI_API_KEY) {
      setError("GEMINI_API_KEY is missing. Please check your app settings.");
    }
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
    } catch (err: any) {
      console.error("Failed to answer question:", err);
      let errorMessage = "Sorry, I couldn't find an answer to that question right now. Please try again.";
      if (err.message?.includes("429") || JSON.stringify(err).includes("429")) {
        errorMessage = "The AI service is currently busy (rate limit reached). Please wait a moment and try again.";
      }
      setAnswer(errorMessage);
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
        Provide a detailed side-by-side comparison based on key metrics like NIRF Rankings, Highest Placement, Average Placement, CS Cutoff (approx), Total Fees (4 Years), Scholarship Eligibility (Income/Rank criteria), Loan Tie-ups, Campus Size, Faculty-Student Ratio, Number of Branches Offered, Alumni Network Strength, and Specific Course Details. 
        Also provide a brief summary of which college is better for what.`,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
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
                    facultyStudentRatio: { type: Type.STRING },
                    alumniNetworkStrength: { type: Type.STRING },
                    courseDetails: { type: Type.STRING },
                    pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                    cons: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["name", "nirfRanking", "highestPlacement", "averagePlacement", "csCutoff", "campusSize", "fees", "facultyStudentRatio", "alumniNetworkStrength", "courseDetails", "pros", "cons"]
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
    } catch (err: any) {
      console.error("Failed to compare colleges:", err);
      let errorMessage = "Failed to generate comparison. Please try again.";
      if (err.message?.includes("429") || JSON.stringify(err).includes("429")) {
        errorMessage = "The AI service is currently busy (rate limit reached). Please wait a moment and try again.";
      }
      setCompareError(errorMessage);
    } finally {
      setIsComparing(false);
    }
  };

  const fetchCitiesForState = async (state: string) => {
    setSelectedState(state);
    setSelectedCity(null);
    setLoadingCities(true);
    setStateCities([]);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `List the top 15 major cities in ${state}, India that are known for having engineering colleges. Return the result strictly as a JSON array of strings containing only the city names. Do not include any other text or markdown formatting.`
      });
      let text = response.text || "[]";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const cities = JSON.parse(text);
      setStateCities(cities);
    } catch (e) {
      console.error("Failed to fetch cities:", e);
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchStateColleges = async (state: string, city: string | null) => {
    setSelectedCity(city || 'All');
    setLoadingStateColleges(true);
    setStateColleges([]);
    try {
      const locationPrompt = city ? `${city}, ${state}` : state;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `List the top 30 engineering colleges in ${locationPrompt}, India. Return the result strictly as a JSON array of strings containing only the college names. Do not include any other text or markdown formatting.`
      });
      let text = response.text || "[]";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const colleges = JSON.parse(text);
      setStateColleges(colleges);
    } catch (e) {
      console.error("Failed to fetch state colleges:", e);
    } finally {
      setLoadingStateColleges(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const activeQuery = overrideQuery || query;
    if (!activeQuery.trim() || cooldown > 0) return;

    setShowSuggestions(false);
    setLoading(true);
    setError(null);
    setResult(null);
    setQuestion("");
    setAnswer(null);

    // Check cache first
    const cacheKey = `search_${activeQuery.toLowerCase().trim()}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // Only use cache if it's less than 24 hours old
        if (new Date().getTime() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setResult(parsed.data);
          setLoading(false);
          return;
        }
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      let currentImageUrl: string | null = null;
      let currentLocation: { address: string, city: string, state: string, pincode: string, nearestAirport: string, nearestRailwayStation: string, mapUrl: string } | null = null;

      fetchCollegeImage(activeQuery).then(url => {
        currentImageUrl = url;
        setResult(prev => prev ? { ...prev, imageUrl: url } : null);
      });

      fetchCollegeLocation(activeQuery).then(loc => {
        currentLocation = loc;
        setResult(prev => prev ? { 
          ...prev, 
          address: loc?.address, 
          city: loc?.city,
          state: loc?.state,
          pincode: loc?.pincode,
          nearestAirport: loc?.nearestAirport,
          nearestRailwayStation: loc?.nearestRailwayStation,
          mapUrl: loc?.mapUrl 
        } : null);
      });

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: `Provide a deep, data-driven review for the college: ${activeQuery}. 
        Focus on the latest ${currentYear} data for PCM students in India. 
        Follow the exact structure requested: 
        1. 🏛️ [College Full Name & Location]
        2. ✅ Pros & ❌ Cons
        3. 📅 Important Dates (Entrance Exams & Syllabus)
        4. 📉 Admission & Cutoffs (${currentYear} Expected/Latest)
        5. 🌿 Branches & Cutoffs (Total count and detailed list)
        6. 💰 Placement Data (Latest ${currentYear})
        7. 📚 Curriculum & Academics
        8. 🗣️ Student Reviews & Vibe (Positive & Negative)
        9. 🎓 Scholarships & Financial Aid
        10. 🏦 Education Loan Options
        11. 💡 Expert Advice
        12. 🔗 Similar Colleges`,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
          systemInstruction: `You are a "College Admission Expert" for 12th-grade PCM (Science A-Group) students in India. 
          Your goal is to provide deep, data-driven reviews of engineering colleges to help them make informed choices during counseling (JoSAA, CSAB, ACPC, etc.) for the academic year ${currentAcademicYear}.
          
          When a user provides a college name:
          1. Use Google Search to find the absolute latest (${currentYear}) data and the official college website.
          2. Search for: "[College Name] official placement report ${currentYear}", "[College Name] JEE Main/GUJCET cutoff ${currentYear}", "[College Name] entrance exam application deadline dates ${currentYear}", "[College Name] entrance exam syllabus ${currentYear}", "[College Name] curriculum and academic pressure", "[College Name] scholarships", "[College Name] education loan tie-ups", and "Student reviews on Quora/YouTube/Reddit".
          3. Synthesize this information into the structured format below.
          4. CRITICAL: You MUST verify that the Official Website URL is the actual, official domain of the college. 
          In India, official college domains almost always end in .ac.in, .edu.in, .res.in, or .org.in. 
          Do NOT return URLs from third-party portals like shiksha.com, collegedunia.com, careers360.com, or blogs.
          5. Ensure the Official Website URL is absolute and starts with http:// or https://.
          
          Output Structure:
          ### 🏛️ [College Full Name & Location]
          **Overview:** A 2-sentence summary of the college's reputation and campus vibe.
          **Official Website:** https://... (Ensure this is a valid, absolute URL)
          
          ### ✅ Pros & ❌ Cons
          * **Pros:** (List 3 specific strengths)
          * **Cons:** (List 2-3 honest weaknesses)
          
          ---
          
          ### 📅 Important Dates (Entrance Exams)
          List ALL relevant entrance exams (National like JEE Main, and State-level like GUJCET/MHT-CET) for this college.
          For each exam, provide:
          * **Exam Name:** (e.g., JEE Main 2025)
          * **Application Deadline:** (Official or expected last date to apply. Highlight if it is approaching soon!)
          * **Exam Date:** (Official or expected dates)
          * **Syllabus Link:** (Provide the absolute URL to the official syllabus if available, otherwise provide a link to the official exam portal)
          
          ---
          
          ### 📉 Admission & Cutoffs (${currentYear} Expected)
          * **Entrance Exam:** (e.g., JEE Main, GUJCET, BITSAT)
          * **Closing Ranks:** Provide a small table for Computer Science (CSE) and other top branches for General/OBC categories based on the latest ${currentYear} trends.
          
          ---
          
          ### 🌿 Branches & Cutoffs
          * **Total Branches:** (State the exact total number of engineering branches offered by the college)
          * **Detailed Branch List:** (Provide a markdown table listing EVERY engineering branch offered by the college. The table must have two columns: 'Branch Name' and 'Approximate Cutoff Rank/Percentile').
          
          ---
          
          ### 💰 Placement Data (Latest ${currentYear})
          * **Highest Package:** ₹[Amount] LPA
          * **Average Package:** ₹[Amount] LPA (Focus on CSE/IT specifically if possible)
          * **Top Recruiters:** (List 4-5 major companies)
          
          ---
          
          ### 📚 Curriculum & Academics
          * **Structure:** (Brief overview of the curriculum, e.g., theoretical vs practical focus, updated syllabus)
          * **Academic Pressure:** (Details on grading strictness, attendance policies like 75% rule, and workload)
          
          ---
          
          ### 🗣️ Student Reviews & Vibe
          Divide the student feedback from YouTube, Quora, and Reddit into two clear sections. 
          CRITICAL: Do NOT write these as paragraphs. Use a step-by-step itemized format (numbered or bulleted) with a blank line between each point to ensure readability.
          
          * **Positive Reviews:**
            1. (Point 1)
            
            2. (Point 2)
            
          * **Negative Reviews:**
            1. (Point 1)
            
            2. (Point 2)
            
          Include specific sentiments or quotes if available.
          
          ---
          
          ### 🎓 Scholarships & Financial Aid
          Provide specific details, amounts, and eligibility criteria where possible.
          * **Merit-based Scholarships:** (e.g., "100% tuition waiver for top 100 JEE rankers", "50% off for >9.0 CGPA")
          * **Need-based Fee Waivers:** (e.g., "Full tuition waiver for family income < ₹1 Lakh/year", "2/3rd waiver for income ₹1-5 Lakhs/year")
          * **Category-based Aid:** (Specific benefits for SC/ST/OBC/PwD candidates)
          * **State/National Schemes:** (e.g., "Eligible for Bihar Student Credit Card", "MYSY Scholarship for Gujarat students", "NSP portal schemes")
          
          ---
          
          ### 🏦 Fees & Education Loan Options
          * **Estimated Total Fees:** (Provide a rough estimate for 4 years B.Tech, including tuition and hostel)
          * **Bank Tie-ups:** (List specific banks like SBI, PNB, HDFC that have official tie-ups or branches on campus for fast-track processing)
          * **Subsidized Loan Schemes:** (Mention if the college is listed under state schemes providing low-interest loans)
          * **Campus Assistance:** (Does the college have a dedicated financial aid office or bank branch on campus?)
          
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
          const potentialUrl = websiteMatch[1];
          if (isOfficialCollegeWebsite(potentialUrl)) {
            officialWebsite = potentialUrl;
          } else {
            officialWebsite = null;
          }
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
          officialWebsite,
          address: currentLocation?.address,
          city: currentLocation?.city,
          state: currentLocation?.state,
          pincode: currentLocation?.pincode,
          nearestAirport: currentLocation?.nearestAirport,
          nearestRailwayStation: currentLocation?.nearestRailwayStation,
          mapUrl: currentLocation?.mapUrl
        });
      }

      // Final parse for similar colleges
      const similarSection = fullText.split("### 🔗 Similar Colleges").pop() || "";
      const similarColleges = similarSection
        .split(",")
        .map(s => s.replace(/[*#\n]/g, "").trim())
        .filter(s => s.length > 0 && s.length < 100)
        .slice(0, 5);

      setResult(prev => {
        const finalResult = prev ? { ...prev, similarColleges } : null;
        if (finalResult) {
          const cacheKey = `search_${activeQuery.toLowerCase().trim()}`;
          localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: new Date().getTime(),
            data: finalResult
          }));
        }
        return finalResult;
      });

    } catch (err: any) {
      console.error("Search error:", err);
      let errorMessage = "Failed to fetch college data. Please try again or check your connection.";
      
      if (!process.env.GEMINI_API_KEY) {
        errorMessage = "API Key is missing. Please check your app settings.";
      } else if (err.status === 429 || err.code === 429 || err.error?.code === 429 || err.message?.includes("429") || JSON.stringify(err).includes("429")) {
        errorMessage = "The AI service is currently busy (rate limit reached). Please wait a moment and try again.";
        setCooldown(30); // 30 second cooldown
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

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
          className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight"
        >
          Find Your Dream College
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
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
            className="block w-full pl-11 pr-36 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggleListening('query')}
              className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                isListening && listeningTarget === 'query'
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 animate-pulse" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              title={isListening && listeningTarget === 'query' ? "Stop listening" : "Start voice typing"}
            >
              {isListening && listeningTarget === 'query' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 h-full bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </button>
          </div>
        </form>

        {/* Auto-suggest Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg overflow-hidden"
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
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-3"
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

        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowStateModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-800 rounded-full text-lg font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-400 transition-all shadow-md hover:shadow-lg"
          >
            <Map className="w-6 h-6 text-emerald-500" />
            Explore by Region
          </button>
        </div>
      </motion.div>

      {/* Trending Colleges Section */}
      {!result && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-16"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
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
                className="group cursor-pointer flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all text-left p-4"
              >
                <div className="flex-1 flex flex-col justify-between">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {college.name}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompare(college.name);
                    }}
                    className={`w-full py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      compareList.includes(college.name)
                        ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
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
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <feature.icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-4" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
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
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-indigo-600" />
            Latest News
          </h3>
          {loadingNews ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {news.map((item, idx) => (
                isValidUrl(item.url) ? (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500 transition-all"
                  >
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-2">{item.date}</p>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{item.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{item.summary}</p>
                  </a>
                ) : (
                  <div
                    key={idx}
                    className="block bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
                  >
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-2">{item.date}</p>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{item.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{item.summary}</p>
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
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
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Analyzing 2025 Data...</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Searching official reports and student forums</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-red-700 dark:text-red-400"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
            {error.includes("rate limit") && (
              <button
                onClick={() => handleSearch(undefined, query)}
                disabled={cooldown > 0}
                className="shrink-0 px-4 py-1.5 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-800 dark:text-red-300 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <TrendingUp className="w-4 h-4" />
                {cooldown > 0 ? `Retry in ${cooldown}s` : "Retry Now"}
              </button>
            )}
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl overflow-hidden">
              {result.imageUrl && (
                <div className="w-full h-64 sm:h-80 bg-slate-100 dark:bg-slate-800 relative">
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
                <div className="flex flex-wrap gap-4 mb-8">
                  {result.officialWebsite && isValidUrl(result.officialWebsite) && (
                    <a 
                      href={result.officialWebsite} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-100 dark:border-indigo-800"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Visit Official Website
                    </a>
                  )}
                  {result.mapUrl && isValidUrl(result.mapUrl) && (
                    <a 
                      href={result.mapUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-100 dark:border-emerald-800"
                      title={result.address || "View on Google Maps"}
                    >
                      <MapPin className="w-5 h-5" />
                      View on Google Maps
                    </a>
                  )}
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-strong:text-slate-900 dark:prose-strong:text-white prose-ul:list-disc prose-li:marker:text-indigo-400">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h3: ({ children }) => (
                        <h3 className="text-2xl font-bold flex items-center gap-2 mt-12 mb-6 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                          {children}
                        </h3>
                      ),
                      hr: () => <hr className="my-12 border-slate-200 dark:border-slate-800" />,
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-6 rounded-xl border border-slate-100 dark:border-slate-800">
                          <table className="w-full text-sm text-left">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="bg-slate-50 dark:bg-slate-900 px-4 py-3 font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                          {children}
                        </td>
                      )
                    }}
                  >
                    {result.content}
                  </ReactMarkdown>
                </div>

                {/* Location Section */}
                {result.address && result.mapUrl && (
                  <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-emerald-600" />
                      Location & Connectivity
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-4">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                          <Map className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Campus Address</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{result.address}</p>
                          {(result.city || result.state || result.pincode) && (
                            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 font-medium">
                              {[result.city, result.state, result.pincode].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        {result.nearestAirport && (
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                            <div className="p-2.5 bg-sky-100 dark:bg-sky-900/30 rounded-lg shrink-0">
                              <Plane className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Nearest Airport</h4>
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{result.nearestAirport}</p>
                            </div>
                          </div>
                        )}
                        
                        {result.nearestRailwayStation && (
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg shrink-0">
                              <TrainFront className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Nearest Railway</h4>
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{result.nearestRailwayStation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <a 
                        href={result.mapUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm hover:shadow"
                      >
                        <MapPin className="w-5 h-5" />
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                )}

                {/* Similar Colleges Section */}
                {result.similarColleges.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
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
                            className="flex-1 flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 rounded-2xl text-left transition-all group"
                          >
                            <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 truncate pr-2">
                              {college}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 shrink-0" />
                          </button>
                          <button
                            onClick={() => toggleCompare(college)}
                            className={`p-4 rounded-2xl border transition-colors ${
                              compareList.includes(college)
                                ? "bg-indigo-100 dark:bg-indigo-900/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-indigo-200 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
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
              <div className="bg-indigo-50/50 dark:bg-indigo-900/10 px-8 py-8 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  Still have questions?
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                  Ask a specific question about {query} and get an AI-powered answer.
                </p>
                <form onSubmit={handleAskQuestion} className="relative">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="E.g., What is the hostel fee? How is the mess food?"
                    className="block w-full pl-4 pr-32 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <div className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleListening('question')}
                      className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                        isListening && listeningTarget === 'question'
                          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 animate-pulse" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                      title={isListening && listeningTarget === 'question' ? "Stop listening" : "Start voice typing"}
                    >
                      {isListening && listeningTarget === 'question' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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
                    className="mt-6 p-5 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-xl shadow-sm"
                  >
                    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-a:text-indigo-600 dark:prose-a:text-indigo-400">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sources Footer */}
              {result.sources.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-6 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
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
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
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
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4"
          >
            <div className="flex-1 w-full">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Comparing {compareList.length}/3 Colleges
              </p>
              <div className="flex flex-wrap gap-2">
                {compareList.map((college, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-lg border border-indigo-100 dark:border-indigo-800">
                    <span className="truncate max-w-[150px]">{college}</span>
                    <button onClick={() => toggleCompare(college)} className="hover:text-indigo-900 dark:hover:text-indigo-100">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCompareList([])}
                className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
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
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-6 h-6 text-indigo-600" />
                  College Comparison
                </h2>
                <button
                  onClick={() => {
                    setCompareResult(null);
                    setCompareError(null);
                  }}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {isComparing ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-lg font-medium text-slate-900 dark:text-white">Analyzing and comparing data...</p>
                  </div>
                ) : compareError ? (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    {compareError}
                  </div>
                ) : compareResult ? (
                  <div className="space-y-8">
                    <div className="overflow-x-auto pb-4">
                      <div className="min-w-[800px] grid gap-x-4 gap-y-0" style={{ gridTemplateColumns: `200px repeat(${compareResult.colleges.length}, minmax(0, 1fr))` }}>
                        {/* Header Row */}
                        <div className="p-4 flex items-end">
                          <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Metrics</span>
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100/50 dark:border-indigo-800/50 flex flex-col justify-end mb-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{college.name}</h3>
                          </div>
                        ))}

                        {/* NIRF Ranking */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800">
                          <Trophy className="w-5 h-5 text-indigo-500" /> NIRF Ranking
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 dark:border-slate-800 font-semibold text-slate-900 dark:text-white flex items-center">
                            {college.nirfRanking}
                          </div>
                        ))}

                        {/* Highest Placement */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                          <Banknote className="w-5 h-5 text-emerald-500" /> Highest Placement
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 dark:border-slate-800 font-semibold text-emerald-700 dark:text-emerald-400 bg-slate-50/50 dark:bg-slate-800/30 flex items-center">
                            {college.highestPlacement}
                          </div>
                        ))}

                        {/* Average Placement */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800">
                          <Banknote className="w-5 h-5 text-indigo-500" /> Average Placement
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 dark:border-slate-800 font-semibold text-slate-900 dark:text-white flex items-center">
                            {college.averagePlacement}
                          </div>
                        ))}

                        {/* CS Cutoff */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                          <Target className="w-5 h-5 text-rose-500" /> CS Cutoff
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 dark:border-slate-800 font-semibold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30 flex items-center">
                            {college.csCutoff}
                          </div>
                        ))}

                        {/* Campus Size */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800">
                          <Map className="w-5 h-5 text-amber-500" /> Campus Size
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 dark:border-slate-800 font-semibold text-slate-900 dark:text-white flex items-center">
                            {college.campusSize}
                          </div>
                        ))}

                        {/* Fees */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                          <Wallet className="w-5 h-5 text-blue-500" /> Fees
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 dark:border-slate-800 font-semibold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30 flex items-center">
                            {college.fees}
                          </div>
                        ))}

                        {/* Faculty-Student Ratio */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800">
                          <Users className="w-5 h-5 text-purple-500" /> Faculty-Student Ratio
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 dark:border-slate-800 font-semibold text-slate-900 dark:text-white flex items-center">
                            {college.facultyStudentRatio}
                          </div>
                        ))}

                        {/* Alumni Network Strength */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                          <Network className="w-5 h-5 text-teal-500" /> Alumni Network
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 dark:border-slate-800 font-semibold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30 flex items-center">
                            {college.alumniNetworkStrength}
                          </div>
                        ))}

                        {/* Course Details */}
                        <div className="p-4 flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800">
                          <BookOpen className="w-5 h-5 text-orange-500" /> Course Details
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 dark:border-slate-800 font-semibold text-slate-900 dark:text-white flex items-center">
                            {college.courseDetails}
                          </div>
                        ))}

                        {/* Pros */}
                        <div className="p-4 flex items-start gap-2 text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800 pt-6">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" /> Key Strengths
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                            <ul className="space-y-2">
                              {college.pros.map((pro, i) => (
                                <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                  <span className="flex-1">{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}

                        {/* Cons */}
                        <div className="p-4 flex items-start gap-2 text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 pt-6 rounded-bl-2xl">
                          <XCircle className="w-5 h-5 text-rose-500 mt-0.5" /> Considerations
                        </div>
                        {compareResult.colleges.map((college, idx) => (
                          <div key={idx} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 pt-6 last:rounded-br-2xl">
                            <ul className="space-y-2">
                              {college.cons.map((con, i) => (
                                <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                  <span className="flex-1">{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-6 md:p-8 border border-indigo-100 dark:border-indigo-800/50">
                      <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
                        <Scale className="w-5 h-5" />
                        Final Verdict
                      </h3>
                      <p className="text-indigo-800 dark:text-indigo-200 leading-relaxed">
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

      {/* State Modal */}
      <AnimatePresence>
        {showStateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStateModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <Map className="w-6 h-6 text-emerald-500" />
                  {selectedState ? (selectedCity ? `Top Colleges in ${selectedCity === 'All' ? selectedState : selectedCity}` : `Select City in ${selectedState}`) : "Explore by Region"}
                </h2>
                <button
                  onClick={() => {
                    setShowStateModal(false);
                    setSelectedState(null);
                    setSelectedCity(null);
                    setStateColleges([]);
                    setStateCities([]);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                {!selectedState ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {INDIAN_STATES.map((state) => (
                      <button
                        key={state}
                        onClick={() => fetchCitiesForState(state)}
                        className="p-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all text-left truncate"
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                ) : !selectedCity ? (
                  loadingCities ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">Finding cities in {selectedState}...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      <button
                        onClick={() => fetchStateColleges(selectedState, null)}
                        className="p-3 text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all text-left truncate"
                      >
                        Select all cities
                      </button>
                      {stateCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => fetchStateColleges(selectedState, city)}
                          className="p-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all text-left truncate"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )
                ) : loadingStateColleges ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Finding top colleges...</p>
                  </div>
                ) : stateColleges.length > 0 ? (
                  <div className="space-y-2">
                    {stateColleges.map((college, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setShowStateModal(false);
                          setQuery(college);
                          handleSearch(undefined, college);
                        }}
                        className="w-full p-4 flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transition-all group text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                            {idx + 1}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {college}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-slate-400">No colleges found.</p>
                    <button 
                      onClick={() => { setSelectedCity(null); setStateColleges([]); }}
                      className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      &larr; Back to Cities
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                {selectedState && !selectedCity && !loadingCities && (
                  <button 
                    onClick={() => {
                      setSelectedState(null);
                      setStateCities([]);
                    }}
                    className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2"
                  >
                    &larr; Back to all states
                  </button>
                )}
                {selectedState && selectedCity && !loadingStateColleges && (
                  <button 
                    onClick={() => {
                      setSelectedCity(null);
                      setStateColleges([]);
                    }}
                    className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2"
                  >
                    &larr; Back to cities
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
