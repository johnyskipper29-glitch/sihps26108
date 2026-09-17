import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Standard, StandardChunk, SearchHistoryItem, Recommendation, RankingWeights } from '../src/types.js';
import { DEMO_STANDARDS_DATA } from './demo_standards.js';

interface DatabaseSchema {
  users: User[];
  standards: Standard[];
  chunks: StandardChunk[];
  search_history: SearchHistoryItem[];
  recommendations: Recommendation[];
  saved_recommendation_ids: { user_id: string; recommendation_id: string; created_at: string }[];
  config_weights: RankingWeights;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'standards_ai_store.json');

// Default initial weights
const DEFAULT_WEIGHTS: RankingWeights = {
  semantic_weight: 0.40,
  product_weight: 0.20,
  category_weight: 0.15,
  application_weight: 0.10,
  technical_weight: 0.10,
  safety_weight: 0.05,
  top_k: 10
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
    this.seedDefaultsIfEmpty();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading database file, starting fresh:', err);
      }
    }
    return {
      users: [],
      standards: [],
      chunks: [],
      search_history: [],
      recommendations: [],
      saved_recommendation_ids: [],
      config_weights: { ...DEFAULT_WEIGHTS }
    };
  }

  private save() {
    try {
      this.ensureDirectory();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  private seedDefaultsIfEmpty() {
    let modified = false;

    // Seed users if missing
    if (this.data.users.length === 0) {
      const adminPass = bcrypt.hashSync('admin123', 10);
      const officerPass = bcrypt.hashSync('officer123', 10);

      this.data.users.push(
        {
          id: 'usr-admin-1',
          name: 'Chief Admin Officer',
          email: 'admin@example.com',
          role: 'ADMIN',
          department: 'Bureau of Standards & IT Operations',
          created_at: new Date().toISOString()
        },
        {
          id: 'usr-officer-1',
          name: 'Procurement Officer Sharma',
          email: 'officer@example.com',
          role: 'PROCUREMENT_OFFICER',
          department: 'Central Public Procurement Division',
          created_at: new Date().toISOString()
        }
      );
      // Store password hashes in internal map
      modified = true;
    }

    // Seed demo standards if empty
    if (this.data.standards.length === 0) {
      for (const item of DEMO_STANDARDS_DATA) {
        this.data.standards.push({
          ...item.standard,
          chunks_count: item.chunks.length
        });
        for (const chunk of item.chunks) {
          this.data.chunks.push(chunk);
        }
      }
      modified = true;
    }

    if (modified) {
      this.save();
    }
  }

  // User Operations
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  // Standards Operations
  getStandards(): Standard[] {
    return this.data.standards.map(s => ({
      ...s,
      chunks_count: this.data.chunks.filter(c => c.standard_id === s.id).length
    }));
  }

  getStandardById(id: string): Standard | undefined {
    const s = this.data.standards.find(item => item.id === id || item.is_number === id);
    if (!s) return undefined;
    return {
      ...s,
      chunks_count: this.data.chunks.filter(c => c.standard_id === s.id).length
    };
  }

  addStandard(standard: Standard, chunks: StandardChunk[] = []): Standard {
    this.data.standards.push(standard);
    for (const chk of chunks) {
      this.data.chunks.push(chk);
    }
    this.save();
    return standard;
  }

  deleteStandard(id: string): boolean {
    const prevCount = this.data.standards.length;
    this.data.standards = this.data.standards.filter(s => s.id !== id && s.is_number !== id);
    this.data.chunks = this.data.chunks.filter(c => c.standard_id !== id);
    if (this.data.standards.length !== prevCount) {
      this.save();
      return true;
    }
    return false;
  }

  getChunks(standardId?: string): StandardChunk[] {
    if (standardId) {
      return this.data.chunks.filter(c => c.standard_id === standardId);
    }
    return this.data.chunks;
  }

  // Search History
  saveSearchHistory(item: SearchHistoryItem) {
    this.data.search_history.unshift(item);
    // Keep last 100
    if (this.data.search_history.length > 100) {
      this.data.search_history = this.data.search_history.slice(0, 100);
    }
    this.save();
  }

  getSearchHistory(userId?: string): SearchHistoryItem[] {
    if (userId) {
      return this.data.search_history.filter(h => h.user_id === userId);
    }
    return this.data.search_history;
  }

  getSearchById(id: string): SearchHistoryItem | undefined {
    const search = this.data.search_history.find(h => h.id === id);
    if (!search) return undefined;
    const recommendations = this.data.recommendations.filter(r => r.search_id === id);
    return {
      ...search,
      recommendations
    };
  }

  // Recommendations
  saveRecommendations(recs: Recommendation[]) {
    for (const r of recs) {
      const idx = this.data.recommendations.findIndex(existing => existing.id === r.id);
      if (idx >= 0) {
        this.data.recommendations[idx] = r;
      } else {
        this.data.recommendations.push(r);
      }
    }
    this.save();
  }

  getRecommendationsBySearchId(searchId: string, userId?: string): Recommendation[] {
    return this.data.recommendations
      .filter(r => r.search_id === searchId)
      .map(r => {
        const std = this.getStandardById(r.standard_id);
        const isSaved = userId ? this.isRecommendationSaved(userId, r.id) : false;
        return {
          ...r,
          standard: std,
          is_saved: isSaved
        };
      });
  }

  getRecommendationById(id: string): Recommendation | undefined {
    const r = this.data.recommendations.find(item => item.id === id);
    if (!r) return undefined;
    return {
      ...r,
      standard: this.getStandardById(r.standard_id)
    };
  }

  updateRecommendationReview(id: string, status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED', notes?: string): Recommendation | undefined {
    const rec = this.data.recommendations.find(r => r.id === id);
    if (!rec) return undefined;
    rec.review_status = status;
    if (notes !== undefined) {
      rec.review_notes = notes;
    }
    this.save();
    return rec;
  }

  // Saved / Bookmarks
  toggleSaveRecommendation(userId: string, recommendationId: string): boolean {
    const existingIdx = this.data.saved_recommendation_ids.findIndex(
      s => s.user_id === userId && s.recommendation_id === recommendationId
    );
    let isSaved = false;
    if (existingIdx >= 0) {
      this.data.saved_recommendation_ids.splice(existingIdx, 1);
      isSaved = false;
    } else {
      this.data.saved_recommendation_ids.push({
        user_id: userId,
        recommendation_id: recommendationId,
        created_at: new Date().toISOString()
      });
      isSaved = true;
    }
    this.save();
    return isSaved;
  }

  isRecommendationSaved(userId: string, recommendationId: string): boolean {
    return this.data.saved_recommendation_ids.some(
      s => s.user_id === userId && s.recommendation_id === recommendationId
    );
  }

  getSavedRecommendations(userId: string): Recommendation[] {
    const saved = this.data.saved_recommendation_ids.filter(s => s.user_id === userId);
    const recs: Recommendation[] = [];
    for (const item of saved) {
      const r = this.getRecommendationById(item.recommendation_id);
      if (r) {
        recs.push({
          ...r,
          is_saved: true
        });
      }
    }
    return recs;
  }

  // Config weights
  getWeights(): RankingWeights {
    return this.data.config_weights || { ...DEFAULT_WEIGHTS };
  }

  updateWeights(weights: Partial<RankingWeights>): RankingWeights {
    this.data.config_weights = {
      ...this.getWeights(),
      ...weights
    };
    this.save();
    return this.data.config_weights;
  }
}

export const db = new Database();
