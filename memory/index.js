// Minimal in-memory store for Buddy v2 MVP
export function createMemory(){
  const store = new Map();
  return {
    async get(key){ return store.has(key) ? store.get(key) : undefined; },
    async set(key, value){ store.set(key, value); return true; },
    async delete(key){ store.delete(key); return true; },
    async list(){ const arr=[]; for(let [k,v] of store.entries()){ arr.push({k,v}); } return arr; }
  };
}
