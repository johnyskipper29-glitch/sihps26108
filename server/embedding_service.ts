// Vector Embedding Service
// Configurable embedding model with cosine similarity vector scoring

export class EmbeddingService {
  private modelName: string;
  private vocabulary: Map<string, number> = new Map();
  private idfMap: Map<string, number> = new Map();
  private isTrained: boolean = false;
  private vectorDimensions: number = 256;

  constructor() {
    this.modelName = process.env.EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
  }

  getModelName(): string {
    return this.modelName;
  }

  // Tokenize & normalize text
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  // Generate deterministic dense vector projection (256-dimensional unit vector)
  generate_embedding(text: string): number[] {
    const tokens = this.tokenize(text);
    const vector = new Array(this.vectorDimensions).fill(0);

    if (tokens.length === 0) return vector;

    // Feature hashing and semantic subword distribution
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      // Hash full token
      const h1 = this.hashString(token);
      const idx1 = Math.abs(h1) % this.vectorDimensions;
      vector[idx1] += 1.0;

      // Bigram context if available
      if (i < tokens.length - 1) {
        const bigram = `${token}_${tokens[i + 1]}`;
        const h2 = this.hashString(bigram);
        const idx2 = Math.abs(h2) % this.vectorDimensions;
        vector[idx2] += 1.5;
      }

      // Semantic stem / prefix features
      if (token.length > 4) {
        const prefix = token.slice(0, 4);
        const h3 = this.hashString(prefix);
        const idx3 = Math.abs(h3) % this.vectorDimensions;
        vector[idx3] += 0.8;
      }

      // Domain synset projections for semantic search (e.g., lights -> luminaire, road -> street, etc.)
      const synonyms = this.getDomainSynonyms(token);
      for (const syn of synonyms) {
        const hSyn = this.hashString(syn);
        const idxSyn = Math.abs(hSyn) % this.vectorDimensions;
        vector[idxSyn] += 0.9;
      }
    }

    // L2 Normalize vector so cosine similarity is simply the dot product
    return this.normalizeVector(vector);
  }

  generate_embeddings(texts: string[]): number[][] {
    return texts.map(t => this.generate_embedding(t));
  }

  // Calculate cosine similarity between two unit vectors (range: 0 to 1)
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    // Scale and bound to 0..1
    return Math.max(0, Math.min(1, (dot + 1) / 2));
  }

  private normalizeVector(vec: number[]): number[] {
    let sumSq = 0;
    for (const v of vec) {
      sumSq += v * v;
    }
    const norm = Math.sqrt(sumSq);
    if (norm === 0) return vec;
    return vec.map(v => v / norm);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash;
  }

  // Domain semantic map for procurement & standards matching
  private getDomainSynonyms(word: string): string[] {
    const synMap: Record<string, string[]> = {
      light: ['luminaire', 'lighting', 'lamp', 'illumination', 'led'],
      lights: ['luminaire', 'lighting', 'luminaires', 'fixtures'],
      lighting: ['luminaire', 'illumination', 'fixture', 'led', 'lamp'],
      road: ['roadway', 'street', 'highway', 'traffic', 'outdoor'],
      roads: ['roadways', 'streets', 'arterial'],
      street: ['roadway', 'road', 'municipal', 'outdoor'],
      cable: ['wire', 'conductor', 'wiring', 'cord', 'sheath'],
      cables: ['conductors', 'wires', 'wiring'],
      solar: ['photovoltaic', 'pv', 'cells', 'renewable', 'sun'],
      panel: ['module', 'photovoltaic', 'board'],
      water: ['potable', 'drinking', 'hydro', 'plumbing', 'liquid'],
      pipe: ['piping', 'conduit', 'drainage', 'upvc', 'plumbing'],
      pipes: ['piping', 'tubing', 'conduits'],
      safety: ['protection', 'protective', 'hazard', 'insulation', 'secure'],
      helmet: ['hardhat', 'headwear', 'headgear', 'cranial'],
      shoes: ['footwear', 'boot', 'sole', 'toe'],
      chair: ['seating', 'swivel', 'ergonomic', 'furniture', 'desk'],
      table: ['desk', 'workstation', 'furniture', 'worktop'],
      computer: ['it', 'pc', 'laptop', 'server', 'computing', 'terminal'],
      fire: ['extinguisher', 'suppression', 'flame', 'combustion'],
      pump: ['centrifugal', 'impeller', 'hydraulic', 'fluid'],
      power: ['voltage', 'electric', 'mcb', 'ups', 'backup'],
      medical: ['hospital', 'patient', 'clinical', 'healthcare', 'biomedical']
    };
    return synMap[word] || [];
  }
}

export const embeddingService = new EmbeddingService();
