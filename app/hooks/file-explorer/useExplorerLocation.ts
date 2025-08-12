import {useLocation} from "react-router";


export function urlBuilder({path, download, upload}: { path: string, download?: boolean, upload?: boolean }): string {
	const builder = []
	if (download) builder.push(download);
	if (path) builder.push(`?path=${encodeURIComponent(path).replace(/%2F/g, '/')}`);
	if (upload) builder.push('#upload');
	return builder.join('');
}


export default function useExplorerLocation() {
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const pathArray = (searchParams.get("path") ?? "").split("/").filter(Boolean);
	const pathString = "/" + pathArray.join("/");
	return {
		pathArray,
		pathString,
		upload: location.hash === "#upload"
	};
}