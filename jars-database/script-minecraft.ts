import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type JarEntry = {
  id: string;
  url: string | null;
  stable: boolean;
  fabric: Array<{ id: string; url: string; stable: boolean }>;
};

type ManifestResponse = {
  versions: {
    id: string;
    url: string;
  }[];
};

type VerssionResponse = {
  downloads: {
    server?: {
      url: string;
    };
  };
  type: string;
};

type FabricInstallerResponse = {
  version: string;
  stable: boolean;
}[];

type FabricLoaderResponse = {
  loader: {
    version: string;
    stable: boolean;
  };
}[];

async function get<T>(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as Promise<T>;
}

async function getFabricInstallerVersions(): Promise<string> {
  const installers = await get<FabricInstallerResponse>('https://meta.fabricmc.net/v2/versions/installer');
  if (!Array.isArray(installers)) throw new Error('No installers found');
  const usable = installers.find((i) => i?.stable === true && typeof i?.version === 'string');
  if (typeof usable?.version !== 'string') throw new Error('No stable installer found');
  return usable.version;
}

async function main() {
  const manifest = await get<ManifestResponse>('https://launchermeta.mojang.com/mc/game/version_manifest.json');
  const fabricInstallerVersion = await getFabricInstallerVersions();

  const versions = [] as JarEntry[];

  for (const version of manifest.versions) {
    console.log(`Processing version ${version.id}...`);
    const [data, fabric] = await Promise.all([
      get<VerssionResponse>(version.url),
      await get<FabricLoaderResponse>(
        `https://meta.fabricmc.net/v2/versions/loader/${encodeURIComponent(version.id)}`,
      ).catch(() => {
        console.warn(`No fabric loaders for version ${version.id}`);
        return [];
      }),
    ]);

    if (!data.downloads.server) {
      console.warn(`No server download for version ${version.id}`);
      continue;
    }

    versions.push({
      id: version.id,
      stable: data.type === 'release',
      url: data.downloads.server?.url || null,
      fabric: fabric.map((f) => ({
        id: f.loader.version,
        url: `https://meta.fabricmc.net/v2/versions/loader/${encodeURIComponent(version.id)}/${encodeURIComponent(f.loader.version)}/${encodeURIComponent(fabricInstallerVersion)}/server/jar`,
        stable: f.loader.stable,
      })),
    });
  }

  const here = path.dirname(fileURLToPath(import.meta.url));
  const outPath = path.join(here, 'minecraft.json');
  await writeFile(outPath, `${JSON.stringify(versions, null, 2)}\n`, 'utf8');

  process.stdout.write(`Wrote ${versions.length} entries to ${outPath}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
