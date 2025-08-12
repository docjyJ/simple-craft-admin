import {useLocation} from "react-router";


export function urlBuilder({path, download, upload, delete:del, file}: { path: string, download?: boolean, upload?: boolean, file?:string, delete?:boolean }): string {
	const builder = []
	if (download) builder.push(download);
	builder.push(`?path=${encodeURIComponent(path).replace(/%2F/g, '/')}`);
	if (file) builder.push(`&file=${encodeURIComponent(file)}`);
	if (upload) builder.push('#upload');
	if (del) builder.push('#delete');
	return builder.join('');
}


export default function useExplorerLocation() {
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const pathArray = (searchParams.get("path") ?? "").split("/").filter(Boolean);
	const pathString = "/" + pathArray.join("/");
	const fileParam = searchParams.get("file");
	return {
		pathArray,
		pathString,
		fileParam,
		upload: location.hash === "#upload",
		delete: location.hash === "#delete",
	};
}