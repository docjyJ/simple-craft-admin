import type {Route} from './+types/_auth.servers.$uid.files';
import {Form, useSearchParams, useNavigation} from "react-router";
import {deleteMinecraftServerFile, getMinecraftServerFiles} from "~/server/file-explorer";
import {IconFile, IconFolder, IconTrash} from "@tabler/icons-react";
import CodeMirror from "@uiw/react-codemirror";
import {Stack, Text, Anchor, Breadcrumbs, Table, ScrollArea, Paper, Button, ActionIcon} from "@mantine/core";

export async function loader({params, request}: Route.LoaderArgs) {
	const url = new URL(request.url);
	const path = url.searchParams.get("path") || "";
	const files = await getMinecraftServerFiles(params.uid, path);
	return {files};
}

export async function action({request, params}: Route.ActionArgs) {
	const formData = await request.formData();
	const path = formData.get("path")
	if (typeof path === "string" && path.trim() !== "") {
		await deleteMinecraftServerFile(params.uid, path);
	}
	return null;
}

const FORBIDDEN_PATHS = ["..", ".", ""];

export default function FileExplorer({loaderData: {files}}: Route.ComponentProps) {
	const [searchParms, setSearchParams] = useSearchParams();
	const path = (searchParms.get("path") ?? "").split("/").filter(p => !FORBIDDEN_PATHS.includes(p));
	const navigation = useNavigation();


	const handleNavigate = (newPath: string) => {
		setSearchParams({path: newPath});
	};

	const pathWithRoot = [
		"Root",
		...path
	];

	return (
		<Stack>
			<Paper withBorder>
				<ScrollArea>

					<Breadcrumbs m="sm" style={{flexWrap: "nowrap"}}>
						{pathWithRoot.map((p, index) => (
							pathWithRoot.length - 1 === index ? (
								<Text key={index}>{p}</Text>
							) : (
								<Anchor
									key={index}
									onClick={() => handleNavigate(pathWithRoot.slice(1, index + 1).join("/"))}
								>
									{p}
								</Anchor>
							)
						))}
					</Breadcrumbs>
				</ScrollArea>
			</Paper>
			{
				files.type === "file" ? (
					<CodeMirror
						value={files.content}
						readOnly={true}
						style={{fontSize: 14}}
					/>
				) : (
					<Table.ScrollContainer minWidth={800} type="native">
						<Table highlightOnHover>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Name</Table.Th>
									<Table.Th>Type</Table.Th>
									<Table.Th>Actions</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{files.child.map((file) => (
									<Table.Tr
										key={file.name}
										onClick={() => handleNavigate([...path, file.name].join("/"))}
										style={{cursor: "pointer"}}
									>
										<Table.Td>
											{file.isDir ? <IconFolder/> : <IconFile/>} {file.name}
										</Table.Td>
										<Table.Td>
											{file.isDir ? "Dossier" : "Fichier"}
										</Table.Td>
										<Table.Td>
											<Form method="post" onClick={e => e.stopPropagation()}>
												<input type="hidden" name="path" value={[...path, file.name].join("/")}/>
												<ActionIcon
													color="red"
													type="submit"
													loading={navigation.state === "submitting"}
													aria-label="Delete file"
												>
													<IconTrash/>
												</ActionIcon>
											</Form>
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					</Table.ScrollContainer>
				)
			}
		</Stack>
	);
}