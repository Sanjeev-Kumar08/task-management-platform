type CounterMap = Map<string, number>;

const counters: CounterMap = new Map();
const latencies: Map<string, number[]> = new Map();

export const metrics = {
  incr(name: string, by = 1): void {
    counters.set(name, (counters.get(name) ?? 0) + by);
  },

  observeLatency(name: string, ms: number): void {
    const list = latencies.get(name) ?? [];
    list.push(ms);
    if (list.length > 500) list.shift();
    latencies.set(name, list);
  },

  snapshot(): Record<string, unknown> {
    const latencySummary: Record<string, { count: number; avgMs: number }> = {};
    for (const [key, values] of latencies.entries()) {
      const avg = values.reduce((a, b) => a + b, 0) / (values.length || 1);
      latencySummary[key] = { count: values.length, avgMs: Math.round(avg) };
    }
    return {
      counters: Object.fromEntries(counters.entries()),
      latencies: latencySummary,
    };
  },
};
