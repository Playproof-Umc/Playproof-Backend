type RedisSetStore = Map<string, Set<string>>;

const sets: RedisSetStore = new Map();

const getSet = (key: string) => {
  const existing = sets.get(key);
  if (existing) {
    return existing;
  }
  const created = new Set<string>();
  sets.set(key, created);
  return created;
};

export const redisClient = {
  sAdd: async (key: string, value: string) => {
    const set = getSet(key);
    const sizeBefore = set.size;
    set.add(String(value));
    return set.size - sizeBefore;
  },
  sCard: async (key: string) => getSet(key).size,
  sRem: async (key: string, value: string) => {
    const set = getSet(key);
    const existed = set.delete(String(value));
    return existed ? 1 : 0;
  },
  del: async (key: string) => {
    const existed = sets.delete(key);
    return existed ? 1 : 0;
  },
  sIsMember: async (key: string, value: string) => {
    const set = getSet(key);
    return set.has(String(value)) ? 1 : 0;
  },
};

export const prisma = {};
