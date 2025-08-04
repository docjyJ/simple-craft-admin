import type {Route} from './+types/_auth.servers.$uid.files';
import {useSearchParams} from "react-router";
import {getMinecraftServerFiles} from "~/server/file-explorer";
import {IconFile, IconFolder} from "@tabler/icons-react";
import CodeMirror from "@uiw/react-codemirror";
import {Button, Stack, Text, Divider, Anchor, Breadcrumbs} from "@mantine/core";

export async function loader({params, request}: Route.LoaderArgs) {
	const url = new URL(request.url);
	const path = url.searchParams.get("path") || "";
	const files = await getMinecraftServerFiles(params.uid, path);
	return {files};
}

export default function FileExplorer({loaderData: {files}}: Route.ComponentProps) {
	const [searchParms, setSearchParams] = useSearchParams();

	const path = searchParms.get("path") || "";

	const handleNavigate = (newPath: string) => {
		setSearchParams({path: newPath});
	};

	const paths = [
		"Root",
		...(path ? path.split("/").filter(Boolean) : [])
	];

	return (
		<Stack>
			<Breadcrumbs>
				{paths.map((p, index) => (
					paths.length - 1 === index ? (
						<Text key={index}>{p}</Text>
					) : (
						<Anchor
							key={index}
							onClick={() => handleNavigate(paths.slice(1, index + 1).join("/"))}
						>
							{p}
						</Anchor>
					)
				))}
			</Breadcrumbs>
			<Divider/>
			{
				files.type === "file" ? (
					<CodeMirror
						value={files.content}
						readOnly={true}
						style={{fontSize: 14}}
					/>
				) : (
					<Stack justify="stretch">
						{files.child.map((file) => (
							<Button
								color={file.isDir ? "orange" : "gray"}
								key={file.name}
								variant="subtle"
								onClick={() => handleNavigate(path ? `${path}/${file.name}` : file.name)}
								leftSection={
									file.isDir ? <IconFolder/> : <IconFile/>
								}
								justify="start"
							>
								{file.name}
							</Button>
						))}
					</Stack>
				)
			}
		</Stack>)
}