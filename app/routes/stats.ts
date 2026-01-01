import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { requireAuth } from '~/utils.server/session';
import type { Route } from './+types/stats';

const DISK_CANDIDATE_PATHS = [
  path.resolve('minecraft'),
  path.resolve('backup'),
  path.resolve('config'),
  path.resolve('.'),
];

interface DiskCacheEntry {
  used: number;
  free: number;
  size: number;
  mount: string;
  ts: number;
}
const diskMountCache = new Map<string, DiskCacheEntry>();
const DISK_CACHE_TTL_MS = 10_000;

function parseDfForPath(p: string): { entry: DiskCacheEntry; mount: string } | null {
  try {
    const raw = execFileSync('df', ['-kP', p]).toString().trim().split('\n');
    if (raw.length >= 2) {
      const cols = raw[1].split(/\s+/).filter(Boolean);
      if (cols.length >= 6) {
        const sizeKB = parseInt(cols[1], 10) || 0;
        const usedKB = parseInt(cols[2], 10) || 0;
        const availKB = parseInt(cols[3], 10) || 0;
        const mountPoint = cols[5];
        const usedMB = Math.round(usedKB / 1024);
        const freeMB = Math.round(availKB / 1024);
        const sizeMB = Math.round(sizeKB / 1024);
        const existing = diskMountCache.get(mountPoint);
        const now = Date.now();
        if (existing && now - existing.ts < DISK_CACHE_TTL_MS) {
          return { entry: existing, mount: mountPoint };
        }
        const entry: DiskCacheEntry = { used: usedMB, free: freeMB, size: sizeMB, mount: mountPoint, ts: now };
        diskMountCache.set(mountPoint, entry);
        return { entry, mount: mountPoint };
      }
    }
  } catch {}
  return null;
}

function readDisks(): { mount: string; used: number; free: number; size: number; samplePaths: string[] }[] {
  const groups = new Map<
    string,
    { mount: string; used: number; free: number; size: number; samplePaths: Set<string> }
  >();
  for (const p of DISK_CANDIDATE_PATHS) {
    const parsed = parseDfForPath(p);
    if (!parsed) continue;
    const { entry, mount } = parsed;
    let g = groups.get(mount);
    if (!g) {
      g = { mount, used: entry.used, free: entry.free, size: entry.size, samplePaths: new Set<string>() };
      groups.set(mount, g);
    }
    g.samplePaths.add(p);
  }
  return Array.from(groups.values()).map((g) => ({
    mount: g.mount,
    used: g.used,
    free: g.free,
    size: g.size,
    samplePaths: Array.from(g.samplePaths),
  }));
}

function readCpuTotals() {
  const cpus = os.cpus();
  let active = 0;
  let total = 0;
  for (const c of cpus) {
    const a = c.times.user + c.times.nice + c.times.sys + c.times.irq;
    const t = a + c.times.idle;
    active += a;
    total += t;
  }
  return { active, total };
}
let prevCpu = readCpuTotals();

function readMemUsageMB(): number {
  try {
    const meminfo = readFileSync('/proc/meminfo', 'utf8');
    let memTotalKB = 0;
    let memAvailKB = 0;
    for (const line of meminfo.split('\n')) {
      if (!memTotalKB && line.startsWith('MemTotal:')) {
        memTotalKB = parseInt(line.replace(/[^0-9]/g, ''), 10) || 0;
      } else if (!memAvailKB && line.startsWith('MemAvailable:')) {
        memAvailKB = parseInt(line.replace(/[^0-9]/g, ''), 10) || 0;
      }
      if (memTotalKB && memAvailKB) break;
    }
    if (memTotalKB && memAvailKB) {
      const usedKB = memTotalKB - memAvailKB;
      return Math.round(usedKB / 1024);
    }
  } catch {}
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  return Math.round((totalMem - freeMem) / 1024 / 1024);
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const encoder = new TextEncoder();
  let closed = false;

  function getStats() {
    const curCpu = readCpuTotals();
    const deltaActive = curCpu.active - prevCpu.active;
    const deltaTotal = curCpu.total - prevCpu.total;
    const cpuPercent = deltaTotal > 0 ? (deltaActive / deltaTotal) * 100 : 0;
    prevCpu = curCpu;

    const usedMemMB = readMemUsageMB();
    const disks = readDisks();

    return {
      cpu: Math.round(cpuPercent),
      ram: usedMemMB,
      disks: disks.map((d) => ({
        mount: d.mount,
        used: d.used,
        free: d.free,
        size: d.size,
        samplePaths: d.samplePaths,
      })),
    };
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const push = () => {
        if (closed) return;
        const stats = getStats();
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
        } catch {}
      };
      push();
      const interval = setInterval(push, 1000);
      const keepAlive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: keep-alive ${Date.now()}\n\n`));
        } catch {}
      }, 25_000);
      const abort = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        clearInterval(keepAlive);
        try {
          controller.close();
        } catch {}
      };
      request.signal.addEventListener('abort', abort);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
