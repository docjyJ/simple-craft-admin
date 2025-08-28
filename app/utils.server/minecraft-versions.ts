import { prisma } from '~/utils.server/global';

export async function refreshMinecraftVersionCache() {
  const manifestRes = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest.json').catch(() => null);
  if (!manifestRes?.ok) return 0;
  const manifest = await manifestRes
    .json()
    .then((o) => (Array.isArray(o?.versions) ? [...o.versions] : null))
    .catch(() => null);
  if (!manifest) return 0;
  const versions: { name: string; type: 'release' | 'snapshot'; jarUrl: string; releaseTime: Date }[] = [];
  for (const v of manifest) {
    const name = typeof v?.id === 'string' ? v.id : null;
    const type = v?.type === 'release' ? 'release' : v?.type === 'snapshot' ? 'snapshot' : null;
    const url = typeof v?.url === 'string' ? v.url : null;
    const rel = typeof v?.releaseTime === 'string' ? Date.parse(v.releaseTime) : NaN;
    if (!name || !type || !url || isNaN(rel)) continue;
    const detailRes = await fetch(url).catch(() => null);
    if (!detailRes?.ok) continue;
    const detail = await detailRes.json().catch(() => null);
    const jarUrl = typeof detail?.downloads?.server?.url === 'string' ? detail.downloads.server.url : null;
    if (!jarUrl) continue;
    versions.push({ name, type, jarUrl, releaseTime: new Date(rel) });
  }
  await prisma.verssionCache.deleteMany({ where: { OR: [{ type: 'release' }, { type: 'snapshot' }] } });
  if (versions.length) await prisma.verssionCache.createMany({ data: versions });
  return versions.length;
}

export async function listCachedMinecraftVersions(type?: 'release' | 'snapshot') {
  return prisma.verssionCache.findMany({ where: type ? { type } : {}, orderBy: { releaseTime: 'desc' } });
}
