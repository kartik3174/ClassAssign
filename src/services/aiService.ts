import { GoogleGenAI } from "@google/genai";
import { Faculty, Substitution } from "../types";

// Helper to get client safely
function getAIClient() {
  // Check both Vite and process.env (for various environments)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (window as any).process?.env?.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE" || apiKey.includes("MY_API_KEY")) {
    return null;
  }
  
  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("AI Initialization Failed:", e);
    return null;
  }
}

/**
 * Local fallback engine to provide insights when AI is unavailable.
 * This ensures the UI always looks professional and provides value.
 */
function getLocalInsights(faculty: Faculty[], recentSubs: Substitution[]): string {
  const totalFaculty = faculty.length;
  if (totalFaculty === 0) return "Sync your data to enable real-time resource analysis.";

  const overloadedCount = faculty.filter(f => f.workload > 18).length;
  const avgAcceptance = faculty.reduce((acc, f) => acc + f.acceptanceRate, 0) / totalFaculty;
  const pendingRequests = recentSubs.filter(s => s.status === 'Requested').length;
  const highRiskDept = faculty.reduce((acc: Record<string, number>, f) => {
    acc[f.department] = (acc[f.department] || 0) + (f.workload > 18 ? 1 : 0);
    return acc;
  }, {});

  const mostOverloadedDept = Object.entries(highRiskDept).sort((a, b) => b[1] - a[1])[0];

  if (overloadedCount > 2) {
    return `Resource Alert: ${overloadedCount} faculty members are exceeding optimal workload limits. ${mostOverloadedDept[1] > 0 ? `The ${mostOverloadedDept[0]} department requires immediate load balancing.` : 'Redistribution is recommended.'}`;
  }

  if (pendingRequests > 3) {
    return `Operational Trend: High volume of pending substitutions (${pendingRequests}) detected today. System responsiveness remains stable with a ${Math.round(avgAcceptance * 100)}% acceptance rate.`;
  }

  if (avgAcceptance < 0.6) {
    return `Strategic Insight: Faculty acceptance rate has dipped to ${Math.round(avgAcceptance * 100)}%. Consider reviewing the incentive structure or manual overrides for critical periods.`;
  }

  return "System Health: Faculty distribution is currently optimized. All departments show balanced workloads and high availability for upcoming periods.";
}

export async function getAISuggestions(faculty: Faculty[], recentSubs: Substitution[]) {
  const fallback = getLocalInsights(faculty, recentSubs);
  
  try {
    const ai = getAIClient();
    if (!ai) {
      return fallback;
    }

    const prompt = `
      You are an AI assistant for a university substitution system called AI&DS Staff Assign.
      Current Faculty stats:
      ${faculty.map(f => `- ${f.name} (${f.department}): Workload ${f.workload}hrs, Acceptance Rate ${f.acceptanceRate * 100}%`).join('\n')}
      
      Recent Substitutions:
      ${recentSubs.slice(0, 5).map(s => `- ${s.subject} substituted by ${s.substituteFacultyId || 'Unknown'} status ${s.status}`).join('\n')}
      
      Provide a brief 1-sentence professional insight about the substitution health of the department. 
      Identify if some faculty are overloaded or if the acceptance rate is high.
      Keep it professional and encouraging.
    `;

    // Using the @google/genai models.generateContent pattern
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    // Handle both property and function styles just in case of SDK variations
    // In @google/genai, .text is often a getter property rather than a method
    const text = typeof (result as any).text === 'function' 
      ? await (result as any).text() 
      : (result as any).text;
    
    return text || fallback;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return fallback;
  }
}
