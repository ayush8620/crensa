

interface CacheItem<T> {
 data: T;
 timestamp: number;
 ttl: number;
}

export class CacheService {
 private static cache = new Map<string, CacheItem<any>>();

 static readonly CACHE_KEYS = {
 TRENDING_CREATORS: 'trending:creators',
 TRENDING_SHOWS: 'trending:shows',
 FEATURED_CONTENT: 'featured:content',
 CATEGORIES: 'categories:active',
 } as const;

 static readonly CACHE_TTL = {
 TRENDING_CREATORS: 300, // 5 minutes
 TRENDING_SHOWS: 300, // 5 minutes
 FEATURED_CONTENT: 1800, // 30 minutes
 CATEGORIES: 3600, // 1 hour
 } as const;

 static set<T>(key: string, data: T, ttlSeconds: number): void {
 const item: CacheItem<T> = {
 data,
 timestamp: Date.now(),
 ttl: ttlSeconds * 1000, // Convert to milliseconds
 };
 
 this.cache.set(key, item);
 }

 static get<T>(key: string): T | null {
 const item = this.cache.get(key);
 
 if (!item) {
 return null;
 }

 const now = Date.now();
 const isExpired = (now - item.timestamp) > item.ttl;

 if (isExpired) {
 this.cache.delete(key);
 return null;
 }

 return item.data as T;
 }

 static has(key: string): boolean {
 return this.get(key) !== null;
 }

 static delete(key: string): boolean {
 return this.cache.delete(key);
 }

 static deleteByPrefix(prefix: string): number {
 let removed = 0;
 for (const key of this.cache.keys()) {
 if (key.startsWith(prefix)) {
 this.cache.delete(key);
 removed++;
 }
 }
 return removed;
 }

 static clear(): void {
 this.cache.clear();
 }

 static getStats(): {
 totalItems: number;
 validItems: number;
 expiredItems: number;
 } {
 const now = Date.now();
 let validItems = 0;
 let expiredItems = 0;

 for (const [key, item] of this.cache.entries()) {
 const isExpired = (now - item.timestamp) > item.ttl;
 if (isExpired) {
 expiredItems++;
 } else {
 validItems++;
 }
 }

 return {
 totalItems: this.cache.size,
 validItems,
 expiredItems,
 };
 }

 static cleanup(): number {
 const now = Date.now();
 let removedCount = 0;

 for (const [key, item] of this.cache.entries()) {
 const isExpired = (now - item.timestamp) > item.ttl;
 if (isExpired) {
 this.cache.delete(key);
 removedCount++;
 }
 }

 return removedCount;
 }

 static async getOrSet<T>(
 key: string,
 fallbackFn: () => Promise<T>,
 ttlSeconds: number
 ): Promise<T> {

 const cached = this.get<T>(key);
 if (cached !== null) {
 return cached;
 }

 try {
 const data = await fallbackFn();
 this.set(key, data, ttlSeconds);
 return data;
 } catch (error) {
 console.error(`Error in cache fallback for key ${key}:`, error);
 throw error;
 }
 }
}

if (typeof window === 'undefined') { // Only run on server
 setInterval(() => {
 const removed = CacheService.cleanup();
 if (removed > 0) {
 console.log(`Cache cleanup: removed ${removed} expired items`);
 }
 }, 10 * 60 * 1000); // 10 minutes
}