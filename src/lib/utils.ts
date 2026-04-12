import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (e) {
    return false;
  }
}

export function isOfficialCollegeWebsite(url: string | null | undefined): boolean {
  if (!isValidUrl(url)) return false;
  const domain = new URL(url!).hostname.toLowerCase();
  // Indian educational and government domains are highly reliable
  const officialTLDs = [".ac.in", ".edu.in", ".res.in", ".gov.in", ".nic.in", ".org.in"];
  if (officialTLDs.some(tld => domain.endsWith(tld))) return true;
  
  // Known aggregator/portal domains that are NOT official college websites
  const aggregatorDomains = [
    "shiksha.com", "collegedunia.com", "careers360.com", "getmyuni.com", 
    "collegepravesh.com", "entrance360.com", "collegedekho.com", "sarvgyan.com",
    "indiatoday.in", "hindustantimes.com", "timesofindia.indiatimes.com",
    "facebook.com", "linkedin.com", "twitter.com", "instagram.com", "youtube.com"
  ];
  
  if (aggregatorDomains.some(agg => domain.includes(agg))) return false;
  
  return true; // Fallback for international or private .com/.org domains
}

export function isReputableNewsSource(url: string | null | undefined): boolean {
  if (!isValidUrl(url)) return false;
  const domain = new URL(url!).hostname.toLowerCase();
  
  const reputableDomains = [
    "timesofindia.indiatimes.com", "ndtv.com", "hindustantimes.com", 
    "indianexpress.com", "thehindu.com", "news18.com", "indiatoday.in", 
    "livemint.com", "business-standard.com", "economictimes.indiatimes.com",
    "jagranjosh.com", "careers360.com", "collegedunia.com", "shiksha.com",
    "pib.gov.in", "education.gov.in", "nta.ac.in", "jeemain.nta.nic.in"
  ];
  
  return reputableDomains.some(rep => domain.includes(rep)) || domain.endsWith(".gov.in") || domain.endsWith(".nic.in");
}
