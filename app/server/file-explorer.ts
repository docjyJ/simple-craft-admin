import {readFile, rm, readdir, stat, writeFile, mkdir} from "node:fs/promises";
import {resolve, dirname} from "node:path";
import JSZip from "jszip";
import {resolveSafePath} from "~/server/path-validation";

export type PathContent = {
	type: "file";
	content: string;
} | {
	type: "folder";
	child: {
		name: string;
		type: "file" | "folder" | "archive";
	}[];
} | {
	type: "archive";
	tree: string[];
};

export type DownloadPath = {
	content: Buffer;
	name: string;
	contentType: "application/zip" | "application/octet-stream";
}


export async function getPath(uid: string, inputPath: string): Promise<PathContent> {
	const {fullPath} = resolveSafePath(uid, inputPath);
	const s = await stat(fullPath);

	if (s.isDirectory()) {
		const entries = await readdir(fullPath, {withFileTypes: true});
		const child = entries.map(entry => ({
			name: entry.name,
			type: entry.isDirectory() ? "folder" as const : entry.name.endsWith(".zip") ? "archive" as const : "file" as const
		}));
		child.sort((a, b) => {
			if (a.type === b.type) return a.name.localeCompare(b.name);
			return a.type === "folder" ? -1 : 1;
		});
		return {type: "folder", child};
	} else if (fullPath.endsWith(".zip")) {
		const buffer = await readFile(fullPath);
		const zip = await JSZip.loadAsync(buffer);
		const tree: string[] = [];
		zip.forEach((relativePath) => {
			tree.push(relativePath);
		});
		return {type: "archive", tree};
	} else {
		const content = await readFile(fullPath, "utf-8");
		return {type: "file", content};
	}
}

export async function deletePath(uid: string, inputPath: string): Promise<void> {
	const {fullPath, pathSplit} = resolveSafePath(uid, inputPath);
	if (pathSplit.length === 0) {
		throw new Error("Cannot delete the root directory of a server");
	}
	await rm(fullPath, {recursive: true, force: true});
}

export async function downloadPath(uid: string, relPath: string): Promise<DownloadPath> {
	const {fullPath, pathSplit} = resolveSafePath(uid, relPath);
	const s = await stat(fullPath);
	if (s.isDirectory()) {
		const zip = new JSZip();

		async function addDirToZip(dir: string, zipFolder: JSZip) {
			const entries = await readdir(dir, {withFileTypes: true});
			for (const entry of entries) {
				const entryPath = `${dir}/${entry.name}`;
				if (entry.isDirectory()) {
					await addDirToZip(entryPath, zipFolder.folder(entry.name)!);
				} else {
					const fileData = await readFile(entryPath);
					zipFolder.file(entry.name, fileData);
				}
			}
		}

		await addDirToZip(fullPath, zip);
		const content = await zip.generateAsync({type: "nodebuffer"});
		return {
			content,
			name: pathSplit[pathSplit.length - 1] + ".zip",
			contentType: "application/zip"
		};
	} else {
		const content = await readFile(fullPath);
		return {
			content,
			name: pathSplit[pathSplit.length - 1],
			contentType: "application/octet-stream"
		};
	}
}

export async function uploadFiles(uid: string, targetPath: string, files: File[]): Promise<void> {
	const {fullPath} = resolveSafePath(uid, targetPath);
	for (const file of files) {
		await writeFile(resolve(fullPath, file.name), Buffer.from(await file.arrayBuffer()));
	}
}

export async function extractArchive(uid: string, targetPath: string): Promise<void> {
	const {fullPath} = resolveSafePath(uid, targetPath);
	if (!fullPath.endsWith(".zip")) {
		throw new Error("Invalid archive path, must end with .zip");
	}
	const buffer = await readFile(fullPath);
	const zip = await JSZip.loadAsync(buffer);
	const destDir = fullPath.slice(0, -4);
	for (const entry of Object.values(zip.files)) {
		const outPath = resolve(destDir, entry.name);
		if (entry.dir) {
			await mkdir(outPath, {recursive: true});
		} else {
			await mkdir(dirname(outPath), {recursive: true});
			const content = await entry.async("nodebuffer");
			await writeFile(outPath, content);
		}
	}
}