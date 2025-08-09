import {resolve} from "node:path";

export type FilePath = {
	fullPath: string;
	pathSplit: string[];
}
const root = "./minecraft/servers"

export function getRootPaths(): string {
	return resolve(root);
}

export function isValidUid(uid: string): boolean {
	return /^[a-zA-Z0-9-]+$/.test(uid);
}

export function resolveSafePath(uid: string, pathInput: string): FilePath {
	if (isValidUid(uid)) {
		throw new Error(`Invalid uid: '${uid}'. Only alphanumeric characters, and hyphens are allowed.`);
	}
	const split = pathInput.split("/");
	if (split.some(p => p === "..")) {
		throw new Error("Invalid path: Parent directory traversal ('..') is not allowed.");
	}
	const pathSplit = split.filter(p => p !== "." && p !== "");
	const fullPath = resolve(root, uid, ...pathSplit);
	return {pathSplit, fullPath};
}