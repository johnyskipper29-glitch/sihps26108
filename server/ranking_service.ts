import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { db } from './db.js';
import { embeddingService } from './embedding_service.js';
import {
  Standard,
  StandardChunk,
  ExtractedRequirements,
  Recommendation,
  ApplicabilityType,
  ScoreBreakdown,
  EvidenceItem,
  RankingWeights
} from '../src/types.js';

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

export class RankingService {
  // Main RAG Recommendation Pipeline
  async rankAndExplain(
    searchId: string,
    query: string,
    extracted: ExtractedRequirements,
    weights: RankingWeights
  ): Promise<Recommendation[]> {
    const allStandards = db.getStandards();
    const allChunks = db.getChunks();

    if (allStandards.length === 0) {
      return [];
    }

    // Step 1: Query Embedding
    const queryEmbedding = embeddingService.generate_embedding(
      `${query} ${extracted.product} ${extracted.category} ${extracted.application} ${extracted.environment} ${(extracted.technical_specifications || []).join(' ')} ${(extracted.safety_requirements || []).join(' ')}`
    );

    // Step 2: Semantic retrieval against chunks and standards
    const candidates: Array<{
      standard: Standard;
      chunks: StandardChunk[];
      semanticScore: number;
      bestChunk?: StandardChunk;
      chunkScore: number;
    }> = [];

    for (const std of allStandards) {
      const stdChunks = allChunks.filter(c => c.standard_id === std.id);

      // Embedding for standard metadata
      const stdMetaText = `${std.title} ${std.category} ${std.scope} ${std.description} ${std.keywords.join(' ')}`;
      const stdEmbedding = embeddingService.generate_embedding(stdMetaText);
      const metaSimilarity = embeddingService.cosineSimilarity(queryEmbedding, stdEmbedding);

      // Embedding for chunks
      let bestChunkSim = 0;
      let bestChunk: StandardChunk | undefined = undefined;

      for (const chk of stdChunks) {
        const chkEmbedding = embeddingService.generate_embedding(chk.chunk_text);
        const sim = embeddingService.cosineSimilarity(queryEmbedding, chkEmbedding);
        if (sim > bestChunkSim) {
          bestChunkSim = sim;
          bestChunk = chk;
        }
      }

      // Blended semantic score (60% best chunk + 40% overall document metadata)
      const blendedSemantic = bestChunkSim > 0
        ? bestChunkSim * 0.6 + metaSimilarity * 0.4
        : metaSimilarity;

      candidates.push({
        standard: std,
        chunks: stdChunks,
        semanticScore: blendedSemantic,
        bestChunk,
        chunkScore: bestChunkSim
      });
    }

    // Step 3: Compute multi-signal scores
    const scoredCandidates = candidates.map(c => {
      const breakdown = this.calculateSignalBreakdown(extracted, c.standard, c.semanticScore, weights);
      return {
        ...c,
        breakdown
      };
    });

    // Step 4: Sort by final score descending & take top K
    scoredCandidates.sort((a, b) => b.breakdown.final - a.breakdown.final);
    const topCandidates = scoredCandidates.slice(0, weights.top_k || 10);

    // Step 5: Classify applicability & build explainability / evidence
    const recommendations: Recommendation[] = [];

    for (let i = 0; i < topCandidates.length; i++) {
      const item = topCandidates[i];
      const rec = this.buildRecommendation(searchId, item, extracted, i + 1);
      recommendations.push(rec);
    }

    // Step 6: Optional LLM Enhancement (strictly adhering to no-hallucination policy)
    const client = getGeminiClient();
    if (client && recommendations.length > 0) {
      try {
        await this.enhanceExplanationsWithLLM(client, query, extracted, recommendations.slice(0, 3));
      } catch (err) {
        console.warn('Gemini explanation enhancement skipped, using verified deterministic evidence:', err);
      }
    }

    return recommendations;
  }

  // Calculate 6-factor signal breakdown according to BIS procurement ranking specification
  private calculateSignalBreakdown(
    extracted: ExtractedRequirements,
    std: Standard,
    semanticSim: number,
    weights: RankingWeights
  ): ScoreBreakdown {
    const qLower = extracted.raw_input.toLowerCase();
    const prodLower = extracted.product.toLowerCase();
    const catLower = extracted.category.toLowerCase();
    const appLower = extracted.application.toLowerCase();
    const envLower = extracted.environment.toLowerCase();

    const stdTitleLower = std.title.toLowerCase();
    const stdScopeLower = std.scope.toLowerCase();
    const stdDescLower = std.description.toLowerCase();
    const stdCatLower = std.category.toLowerCase();
    const keywordsLower = std.keywords.map(k => k.toLowerCase());

    // 1. Product Match (0 to 100)
    let productScore = 20;
    const prodWords = prodLower.split(/\s+/).filter(w => w.length > 3);
    let matchedProdWords = 0;
    for (const w of prodWords) {
      if (stdTitleLower.includes(w) || stdDescLower.includes(w) || keywordsLower.some(k => k.includes(w))) {
        matchedProdWords++;
      }
    }
    if (prodWords.length > 0) {
      productScore += (matchedProdWords / prodWords.length) * 80;
    }
    productScore = Math.min(100, productScore);

    // 2. Category Match (0 to 100)
    let categoryScore = 15;
    if (catLower === stdCatLower) {
      categoryScore = 100;
    } else if (
      (catLower.includes('light') && stdCatLower.includes('light')) ||
      (catLower.includes('electr') && stdCatLower.includes('electr')) ||
      (catLower.includes('water') && stdCatLower.includes('water')) ||
      (catLower.includes('furn') && stdCatLower.includes('furn')) ||
      (catLower.includes('construct') && stdCatLower.includes('construct')) ||
      (catLower.includes('ppe') && stdCatLower.includes('ppe')) ||
      (catLower.includes('it') && stdCatLower.includes('it'))
    ) {
      categoryScore = 95;
    } else if (stdScopeLower.includes(catLower) || stdDescLower.includes(catLower)) {
      categoryScore = 70;
    }

    // 3. Application Match (0 to 100)
    let applicationScore = 25;
    const appWords = `${appLower} ${envLower}`.split(/\s+/).filter(w => w.length > 3);
    let matchedAppWords = 0;
    for (const w of appWords) {
      if (stdScopeLower.includes(w) || stdDescLower.includes(w) || keywordsLower.some(k => k.includes(w))) {
        matchedAppWords++;
      }
    }
    if (appWords.length > 0) {
      applicationScore += (matchedAppWords / appWords.length) * 75;
    }
    applicationScore = Math.min(100, applicationScore);

    // 4. Technical Requirement Match (0 to 100)
    let techScore = 20;
    const techReqs = extracted.technical_specifications || [];
    let matchedTech = 0;
    for (const tr of techReqs) {
      const trWords = tr.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      for (const tw of trWords) {
        if (stdScopeLower.includes(tw) || stdDescLower.includes(tw) || keywordsLower.some(k => k.includes(tw))) {
          matchedTech++;
          break;
        }
      }
    }
    if (techReqs.length > 0) {
      techScore += (matchedTech / techReqs.length) * 80;
    } else {
      techScore = 50;
    }
    techScore = Math.min(100, techScore);

    // 5. Safety Match (0 to 100)
    let safetyScore = 20;
    const safetyReqs = extracted.safety_requirements || [];
    let matchedSafety = 0;
    for (const sr of safetyReqs) {
      const srWords = sr.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      for (const sw of srWords) {
        if (stdScopeLower.includes(sw) || stdDescLower.includes(sw) || stdTitleLower.includes(sw)) {
          matchedSafety++;
          break;
        }
      }
    }
    if (safetyReqs.length > 0) {
      safetyScore += (matchedSafety / safetyReqs.length) * 80;
    } else {
      safetyScore = 50;
    }
    safetyScore = Math.min(100, safetyScore);

    // 6. Semantic Similarity normalized to 0-100
    const semantic100 = Math.round(semanticSim * 100);

    // Weighted Final Score
    const finalRaw =
        (weights.semantic_weight || 0.40) * semantic100
      + (weights.product_weight || 0.20) * productScore
      + (weights.category_weight || 0.15) * categoryScore
      + (weights.application_weight || 0.10) * applicationScore
      + (weights.technical_weight || 0.10) * techScore
      + (weights.safety_weight || 0.05) * safetyScore;

    const final = Math.min(100, Math.max(0, Math.round(finalRaw)));

    return {
      semantic: semantic100,
      product: Math.round(productScore),
      category: Math.round(categoryScore),
      application: Math.round(applicationScore),
      technical: Math.round(techScore),
      safety: Math.round(safetyScore),
      final
    };
  }

  private buildRecommendation(
    searchId: string,
    candidate: {
      standard: Standard;
      chunks: StandardChunk[];
      semanticScore: number;
      bestChunk?: StandardChunk;
      breakdown: ScoreBreakdown;
    },
    extracted: ExtractedRequirements,
    rank: number
  ): Recommendation {
    const { standard, chunks, breakdown, bestChunk } = candidate;
    const score = breakdown.final;

    // Classification according to Section 14 & 15
    let applicability_type: ApplicabilityType = 'LOW_RELEVANCE';
    if (score >= 88) {
      applicability_type = 'HIGHLY_APPLICABLE';
    } else if (score >= 75) {
      applicability_type = 'STRONG_CANDIDATE';
    } else if (score >= 60) {
      applicability_type = 'POTENTIALLY_APPLICABLE';
    } else if (score >= 40) {
      applicability_type = 'RELATED';
    } else {
      applicability_type = 'LOW_RELEVANCE';
    }

    // Determine conditional nuances
    const conditions: string[] = [];
    if (extracted.environment.toLowerCase().includes('outdoor') && standard.scope.toLowerCase().includes('outdoor')) {
      conditions.push('Applies specifically for outdoor perimeter, street, or public infrastructure deployment.');
    } else if (extracted.environment.toLowerCase().includes('indoor')) {
      conditions.push('Applies if the installation is housed within sheltered or temperature-controlled indoor spaces.');
    }
    if (score >= 70 && score < 88) {
      conditions.push(`Applicability is conditional upon verifying required working ratings with tender schedule requirements.`);
    }

    // Build explainable reasons breakdown
    const reasons_breakdown: string[] = [];
    if (breakdown.product >= 60) {
      reasons_breakdown.push(`Product category and technical description align with ${extracted.product}.`);
    }
    if (breakdown.category >= 80) {
      reasons_breakdown.push(`Industry discipline matches "${standard.category}" standard portfolio.`);
    }
    if (breakdown.application >= 50) {
      reasons_breakdown.push(`Operational deployment matches ${extracted.application} in scope.`);
    }
    if (breakdown.technical >= 50) {
      reasons_breakdown.push(`Technical specifications and performance ratings reflect standard scope.`);
    }
    if (breakdown.safety >= 50) {
      reasons_breakdown.push(`Prescribes essential electrical/mechanical safety testing protocols.`);
    }
    if (reasons_breakdown.length === 0) {
      reasons_breakdown.push('General contextual similarity identified within BIS standards registry.');
    }

    const mainReason = `This standard is recommended because its scope encompasses ${extracted.product} requirements under ${standard.category}, addressing mandatory electrical/safety tolerances and environmental specifications.`;

    // Matched requirements list
    const matched_requirements: string[] = [];
    if (extracted.product) matched_requirements.push(`Product: ${extracted.product}`);
    if (extracted.environment) matched_requirements.push(`Environment: ${extracted.environment}`);
    if (extracted.application) matched_requirements.push(`Application: ${extracted.application}`);
    for (const spec of (extracted.technical_specifications || []).slice(0, 2)) {
      matched_requirements.push(`Technical Spec: ${spec}`);
    }
    for (const safe of (extracted.safety_requirements || []).slice(0, 2)) {
      matched_requirements.push(`Safety: ${safe}`);
    }

    // Supporting Evidence (traceable chunks)
    const evidence: EvidenceItem[] = [];
    if (bestChunk) {
      evidence.push({
        document: standard.document_name,
        section: bestChunk.section,
        page: bestChunk.page_number,
        snippet: bestChunk.chunk_text.slice(0, 280) + (bestChunk.chunk_text.length > 280 ? '...' : '')
      });
    }

    // Additional evidence chunks if available
    for (const chk of chunks) {
      if (evidence.length >= 2) break;
      if (!bestChunk || chk.id !== bestChunk.id) {
        evidence.push({
          document: standard.document_name,
          section: chk.section,
          page: chk.page_number,
          snippet: chk.chunk_text.slice(0, 260) + (chk.chunk_text.length > 260 ? '...' : '')
        });
      }
    }

    // If standard has no chunks, use scope snippet
    if (evidence.length === 0) {
      evidence.push({
        document: standard.document_name,
        section: 'Scope of Standard',
        page: 1,
        snippet: standard.scope
      });
    }

    const confidence = Math.min(0.98, Math.max(0.40, (score / 100) * 0.95 + 0.05));

    return {
      id: `rec-${searchId.slice(0, 8)}-${standard.id}`,
      search_id: searchId,
      standard_id: standard.id,
      standard,
      relevance_score: score,
      confidence_score: parseFloat(confidence.toFixed(2)),
      applicability_type,
      reason: mainReason,
      reasons_breakdown,
      matched_requirements,
      conditions,
      evidence,
      score_breakdown: breakdown,
      review_status: 'PENDING_REVIEW',
      created_at: new Date().toISOString()
    };
  }

  // LLM enhancement strictly grounded in retrieved evidence (No Hallucination)
  private async enhanceExplanationsWithLLM(
    ai: GoogleGenAI,
    query: string,
    extracted: ExtractedRequirements,
    topRecs: Recommendation[]
  ) {
    const tasks = topRecs.slice(0, 3).map(async (rec) => {
      if (!rec.standard || rec.evidence.length === 0) return;

      const prompt = `You are a compliance assistant for the Bureau of Indian Standards (BIS).
Review this procurement specification against the retrieved standard evidence.

Procurement Specification:
"${query}"

Retrieved Standard:
Number: ${rec.standard.is_number}
Title: ${rec.standard.title}
Evidence Snippet:
"${rec.evidence[0].snippet}"

STRICT RULES:
1. Do NOT invent standard numbers or clauses.
2. Ground your answer ONLY on the provided evidence and specification.
3. Clearly state this is for procurement review and not legally binding compliance.
4. Return a concise 2-sentence explanation of why this standard applies.`;

      let timerId: NodeJS.Timeout | null = null;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timerId = setTimeout(() => reject(new Error('LLM explanation timeout')), 10000);
        });
        const generatePromise = (async () => {
          try {
            return await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: prompt,
              config: { temperature: 0.1 }
            });
          } catch {
            return await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
              config: {
                temperature: 0.1,
                thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
              }
            });
          }
        })();

        const res: any = await Promise.race([
          generatePromise,
          timeoutPromise
        ]);
        if (timerId) clearTimeout(timerId);
        const text = res.text?.trim();
        if (text && text.length > 20) {
          rec.reason = text;
        }
      } catch (err) {
        if (timerId) clearTimeout(timerId);
        // Silently preserve verified deterministic reason
      }
    });

    await Promise.allSettled(tasks);
  }
}

export const rankingService = new RankingService();
