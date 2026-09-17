import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { ExtractedRequirements } from '../src/types.js';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClient;
}

export class ExtractionService {
  async extractRequirements(input: string, structuredFields?: Partial<ExtractedRequirements>): Promise<{ requirements: ExtractedRequirements; mode: 'AI' | 'FALLBACK' }> {
    const trimmed = (input || '').trim();
    const client = getGeminiClient();

    if (client && trimmed.length > 5) {
      let timeoutId: NodeJS.Timeout | null = null;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Gemini API extraction timeout')), 15000);
        });
        const aiResult = await Promise.race([
          this.extractWithGemini(client, trimmed, structuredFields),
          timeoutPromise
        ]);
        if (timeoutId) clearTimeout(timeoutId);
        return { requirements: aiResult, mode: 'AI' };
      } catch (err: any) {
        if (timeoutId) clearTimeout(timeoutId);
        console.warn('Gemini extraction fell back to deterministic NLP extraction:', err?.message || err);
      }
    }

    // Deterministic Rule-based NLP extraction
    const fallbackResult = this.deterministicExtract(trimmed, structuredFields);
    return { requirements: fallbackResult, mode: 'FALLBACK' };
  }

  private async extractWithGemini(
    ai: GoogleGenAI,
    text: string,
    structuredFields?: Partial<ExtractedRequirements>
  ): Promise<ExtractedRequirements> {
    const prompt = `You are an expert procurement and Indian Standards (BIS) technical analyst.
Analyze the following natural language procurement specification and extract structured technical entities.

Procurement Specification:
"""${text}"""

Additional user-specified structured hints:
${JSON.stringify(structuredFields || {}, null, 2)}

Strictly return a JSON object with this exact schema:
{
  "product": "Specific item being procured, e.g. LED street lighting system",
  "category": "High level industry category (e.g. Lighting, Solar Equipment, Electrical Equipment, Construction, Furniture, PPE, Water Equipment, Mechanical Equipment, IT Equipment, Medical Equipment, Fire Safety, Laboratory Equipment)",
  "material": "Specified material, e.g. Die-cast aluminum, Copper, Stainless steel, uPVC, or 'Not specified'",
  "application": "Intended operational use, e.g. Roadway illumination, Drinking water supply, Office seating",
  "environment": "Operational environment, e.g. Outdoor, Indoor, Extreme weather, Marine, Industrial, High-temperature",
  "quantity": "Specified quantity or batch size (e.g. 500 units) or 'Unspecified'",
  "dimensions": "Dimensional constraints or 'Standard'",
  "power": "Wattage/voltage/power capacity (e.g. 50W, 230V AC) or 'Not specified'",
  "performance_requirements": ["list of functional/performance metrics e.g. L70 > 50000 hrs, 100 lm/W"],
  "safety_requirements": ["list of safety criteria e.g. electrical insulation, surge protection 10kV, earthing"],
  "technical_specifications": ["list of technical specs e.g. IP66 rating, THD < 10%, Power Factor > 0.95"],
  "certifications": ["list of requested certifications or compliance references"],
  "other_constraints": ["delivery terms, testing certifications, environmental factors"]
}`;

    let responseText: string | undefined;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });
      responseText = response.text;
    } catch (primaryErr) {
      // Fallback model attempt if primary hits rate limit or quota
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });
      responseText = response.text;
    }

    const jsonStr = responseText?.trim() || '{}';
    const parsed = JSON.parse(jsonStr);

    return {
      product: parsed.product || structuredFields?.product || 'Specified Equipment',
      category: parsed.category || structuredFields?.category || this.inferCategory(text),
      material: parsed.material || structuredFields?.material || 'Standard commercial grade',
      application: parsed.application || structuredFields?.application || 'Municipal / Industrial',
      environment: parsed.environment || structuredFields?.environment || (text.toLowerCase().includes('outdoor') ? 'Outdoor' : 'Indoor / General'),
      quantity: parsed.quantity || structuredFields?.quantity || 'As per tender',
      dimensions: parsed.dimensions || structuredFields?.dimensions || 'Standard',
      power: parsed.power || structuredFields?.power || '',
      performance_requirements: Array.isArray(parsed.performance_requirements) ? parsed.performance_requirements : [],
      safety_requirements: Array.isArray(parsed.safety_requirements) ? parsed.safety_requirements : [],
      technical_specifications: Array.isArray(parsed.technical_specifications) ? parsed.technical_specifications : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      other_constraints: Array.isArray(parsed.other_constraints) ? parsed.other_constraints : [],
      raw_input: text
    };
  }

  // Deterministic rule-based extractor
  deterministicExtract(text: string, structuredFields?: Partial<ExtractedRequirements>): ExtractedRequirements {
    const lower = text.toLowerCase();

    // Infer product
    let product = structuredFields?.product || '';
    if (!product) {
      if (lower.includes('street light') || lower.includes('led') || lower.includes('lighting') || lower.includes('luminaire')) {
        product = 'LED Street Lighting System';
      } else if (lower.includes('solar') || lower.includes('photovoltaic') || lower.includes('pv module')) {
        product = 'Solar PV Photovoltaic Modules';
      } else if (lower.includes('cable') || lower.includes('wire') || lower.includes('conductor')) {
        product = 'PVC Insulated Electrical Copper Cables';
      } else if (lower.includes('circuit breaker') || lower.includes('mcb')) {
        product = 'Miniature Circuit Breakers (MCB)';
      } else if (lower.includes('concrete') || lower.includes('cement')) {
        product = 'Structural Reinforced Concrete';
      } else if (lower.includes('tmt') || lower.includes('rebar') || lower.includes('steel bar')) {
        product = 'High Strength TMT Deformed Steel Bars';
      } else if (lower.includes('pipe') || lower.includes('upvc')) {
        product = 'uPVC Potable Water Supply Pipes';
      } else if (lower.includes('drinking water') || lower.includes('potable water')) {
        product = 'Drinking Water Purification Quality System';
      } else if (lower.includes('helmet') || lower.includes('hard hat')) {
        product = 'Industrial Safety Helmets';
      } else if (lower.includes('footwear') || lower.includes('safety shoe') || lower.includes('steel toe')) {
        product = 'Safety Protective Footwear with Steel Toe';
      } else if (lower.includes('desk') || lower.includes('workstation') || lower.includes('table')) {
        product = 'Modular Office Workstation Desks';
      } else if (lower.includes('chair') || lower.includes('swivel')) {
        product = 'Ergonomic Adjustable Office Swivel Chairs';
      } else if (lower.includes('ups') || lower.includes('uninterruptible')) {
        product = 'Online Double Conversion UPS Systems';
      } else if (lower.includes('computer') || lower.includes('laptop') || lower.includes('server')) {
        product = 'Information Technology Computing Equipment';
      } else if (lower.includes('fire') || lower.includes('extinguisher')) {
        product = 'Portable Fire Extinguishers';
      } else if (lower.includes('medical') || lower.includes('patient') || lower.includes('hospital')) {
        product = 'Medical Electrical Diagnostic Equipment';
      } else if (lower.includes('pump') || lower.includes('centrifugal')) {
        product = 'Centrifugal Potable Water Pumps';
      } else if (lower.includes('fume hood') || lower.includes('chemical hood')) {
        product = 'Ducted Laboratory Chemical Fume Hoods';
      } else {
        const words = text.split(/\s+/).slice(0, 5).join(' ');
        product = words || 'Procured Equipment';
      }
    }

    const category = structuredFields?.category || this.inferCategory(text);

    // Extract quantity
    let quantity = structuredFields?.quantity || '';
    if (!quantity) {
      const qMatch = text.match(/(\d+)\s*(units|nos|numbers|pieces|pcs|sets|meters|kms|tons|kg)/i) || text.match(/(?:procurement of|supply of|purchasing)\s*(\d+)/i);
      if (qMatch) {
        quantity = qMatch[1] + (qMatch[2] ? ` ${qMatch[2]}` : ' units');
      } else {
        quantity = 'Standard tender quantity';
      }
    }

    // Extract power
    let power = structuredFields?.power || '';
    if (!power) {
      const pMatch = text.match(/(\d+\s*(?:w|watt|watts|kw|mw|kva|v|volt|volts|kv|ma|a|amp|amps))/i);
      if (pMatch) {
        power = pMatch[1].toUpperCase();
      }
    }

    // Extract environment
    let environment = structuredFields?.environment || '';
    if (!environment) {
      if (lower.includes('outdoor') || lower.includes('roadway') || lower.includes('street') || lower.includes('exterior')) {
        environment = 'Outdoor / Exterior Environmental Exposure';
      } else if (lower.includes('indoor') || lower.includes('office') || lower.includes('interior')) {
        environment = 'Indoor / Controlled Environment';
      } else if (lower.includes('coastal') || lower.includes('marine') || lower.includes('corrosive')) {
        environment = 'Severe Marine / Corrosive Environment';
      } else {
        environment = 'General Operational Environment';
      }
    }

    // Extract application
    let application = structuredFields?.application || '';
    if (!application) {
      if (lower.includes('roadway') || lower.includes('street') || lower.includes('highway')) {
        application = 'Public Roadway and Street Lighting';
      } else if (lower.includes('drinking') || lower.includes('potable') || lower.includes('water supply')) {
        application = 'Potable Drinking Water Distribution';
      } else if (lower.includes('office') || lower.includes('workstation')) {
        application = 'Commercial / Institutional Office Facilities';
      } else if (lower.includes('construction') || lower.includes('structural') || lower.includes('building')) {
        application = 'Structural Civil Infrastructure Works';
      } else if (lower.includes('fire')) {
        application = 'Emergency Fire Safety and Suppression';
      } else {
        application = 'General Public Procurement Use';
      }
    }

    // Extract technical and safety specs
    const techSpecs: string[] = [];
    const safetySpecs: string[] = [];
    const perfSpecs: string[] = [];

    if (lower.includes('weather resistant') || lower.includes('weatherproof') || lower.includes('weather resistance')) {
      techSpecs.push('Weather resistant enclosure rating (IP65/IP66)');
    }
    if (lower.includes('ip65') || lower.includes('ip66') || lower.includes('ip67')) {
      techSpecs.push('Ingress protection rating verified');
    }
    if (power) {
      techSpecs.push(`Nominal rating: ${power}`);
    }
    if (lower.includes('thd') || lower.includes('harmonic')) {
      techSpecs.push('Low total harmonic distortion (<10% THD)');
    }
    if (lower.includes('power factor')) {
      techSpecs.push('High power factor (>= 0.95)');
    }
    if (lower.includes('electrical safety') || lower.includes('insulation')) {
      safetySpecs.push('Electrical insulation and dielectric strength verification');
    }
    if (lower.includes('surge') || lower.includes('lightning') || lower.includes('spd')) {
      safetySpecs.push('High-voltage surge protection (minimum 10kV)');
    }
    if (lower.includes('earthing') || lower.includes('grounding')) {
      safetySpecs.push('Class I protective earthing / grounding safety');
    }
    if (lower.includes('fire') || lower.includes('flame') || lower.includes('frls')) {
      safetySpecs.push('Flame retardant / low smoke non-hazardous combustion');
    }
    if (lower.includes('life') || lower.includes('hours') || lower.includes('efficacy')) {
      perfSpecs.push('Long service lifespan (L70 > 50,000 hours)');
    }
    if (lower.includes('energy') || lower.includes('star') || lower.includes('efficiency')) {
      perfSpecs.push('High energy efficiency / BEE compliance');
    }

    return {
      product,
      category,
      material: structuredFields?.material || (lower.includes('aluminum') ? 'Die-cast aluminum LM6' : lower.includes('copper') ? 'High conductivity electrolytic copper' : 'Standard engineering grade material'),
      application,
      environment,
      quantity,
      dimensions: structuredFields?.dimensions || 'Standard dimensional tolerances',
      power,
      performance_requirements: perfSpecs.length > 0 ? perfSpecs : ['Operational reliability under continuous duty cycle'],
      safety_requirements: safetySpecs.length > 0 ? safetySpecs : ['Standard industrial electrical and mechanical protection'],
      technical_specifications: techSpecs.length > 0 ? techSpecs : ['Compliance with standard manufacturing tolerances and test protocols'],
      certifications: ['BIS Product Certification / ISI Mark eligibility', 'Type Test Report from NABL-accredited laboratory'],
      other_constraints: ['Warranty coverage minimum 3 years', 'Manufacturer test certificate with supply'],
      raw_input: text
    };
  }

  private inferCategory(text: string): string {
    const l = text.toLowerCase();
    if (l.includes('light') || l.includes('led') || l.includes('luminaire') || l.includes('lamp')) return 'Lighting';
    if (l.includes('solar') || l.includes('photovoltaic') || l.includes('pv')) return 'Solar Equipment';
    if (l.includes('cable') || l.includes('wire') || l.includes('mcb') || l.includes('switchgear') || l.includes('circuit breaker')) return 'Electrical Equipment';
    if (l.includes('concrete') || l.includes('cement') || l.includes('tmt') || l.includes('rebar') || l.includes('steel')) return 'Construction';
    if (l.includes('pipe') || l.includes('water') || l.includes('potable') || l.includes('plumbing')) return 'Water Equipment';
    if (l.includes('helmet') || l.includes('shoe') || l.includes('footwear') || l.includes('ppe') || l.includes('glove')) return 'PPE';
    if (l.includes('desk') || l.includes('chair') || l.includes('table') || l.includes('workstation') || l.includes('furniture')) return 'Furniture';
    if (l.includes('ups') || l.includes('computer') || l.includes('server') || l.includes('laptop') || l.includes('printer')) return 'IT Equipment';
    if (l.includes('fire') || l.includes('extinguisher') || l.includes('suppression')) return 'Fire Safety';
    if (l.includes('medical') || l.includes('patient') || l.includes('hospital') || l.includes('ecg')) return 'Medical Equipment';
    if (l.includes('pump') || l.includes('motor') || l.includes('centrifugal')) return 'Mechanical Equipment';
    if (l.includes('fume hood') || l.includes('laboratory') || l.includes('chemical')) return 'Laboratory Equipment';
    return 'Electrical Equipment';
  }
}

export const extractionService = new ExtractionService();
