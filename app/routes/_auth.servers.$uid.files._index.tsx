import type {Route} from './+types/_auth.servers.$uid.files._index';
import {useSearchParams, Form, Link} from "react-router";
import {deleteMinecraftServerFile, getMinecraftServerFiles} from "~/server/file-explorer";
import {IconFile, IconFolder, IconTrash, IconDownload} from "@tabler/icons-react";
import CodeMirror from "@uiw/react-codemirror";
import {
	Stack,
	Text,
	Anchor,
	Breadcrumbs,
	Table,
	ScrollArea,
	Paper,
	Button,
	ActionIcon,
	Modal,
	Group
} from "@mantine/core";
import {useState} from "react";

export async function loader({params, request}: Route.LoaderArgs) {
	const url = new URL(request.url);
	const path = url.searchParams.get("path") || "";
	const files = await getMinecraftServerFiles(params.uid, path);
	return {files};
}

export async function action({request, params}: Route.ActionArgs) {
	const formData = await request.formData();
	const type = formData.get("type");
	const path = formData.get("path");
	if (type === "delete" && typeof path === "string" && path.trim() !== "") {
		await deleteMinecraftServerFile(params.uid, path);
	}
	return null;
}

const FORBIDDEN_PATHS = ["..", ".", ""];

export default function FileExplorer({loaderData: {files}}: Route.ComponentProps) {
	const [searchParms, setSearchParams] = useSearchParams();
	const path = (searchParms.get("path") ?? "").split("/").filter(p => !FORBIDDEN_PATHS.includes(p));
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [fileToDelete, setFileToDelete] = useState<{ name: string, isDir: boolean, path: string } | null>(null);

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
								{files.child.map((file) => {
									const filePath = [...path, file.name].join("/");
									return (
										<Table.Tr
											key={file.name}
											onClick={() => handleNavigate(filePath)}
											style={{cursor: "pointer"}}
										>
											<Table.Td>
												{file.isDir ? <IconFolder/> : <IconFile/>} {file.name}
											</Table.Td>
											<Table.Td>
												{file.isDir ? "Folder" : "File"}
											</Table.Td>
											<Table.Td>
												<ActionIcon
													color="red"
													type="button"
													aria-label="Delete file"
													onClick={e => {
														e.stopPropagation();
														setFileToDelete({ name: file.name, isDir: file.isDir, path: filePath });
														setConfirmOpen(true);
													}}
												>
													<IconTrash/>
												</ActionIcon>
												<ActionIcon
													component={Link}
													to={`download?path=${encodeURIComponent(filePath)}`}
													download reloadDocument
													color="blue"
													type="button"
													aria-label={file.isDir ? "Download folder" : "Download file"}
													onClick={e => e.stopPropagation()}
												>
													<IconDownload/>
												</ActionIcon>
											</Table.Td>
										</Table.Tr>
									);
								})}
							</Table.Tbody>
						</Table>
					</Table.ScrollContainer>
				)
			}
			<Modal
				opened={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				title="Confirm Deletion"
				centered
			>
				{fileToDelete && (
					fileToDelete.isDir
						? <Text>Are you sure you want to delete entire {fileToDelete.name} directory?</Text>
						: <Text>Are you sure you want to delete {fileToDelete.name} file?</Text>
				)}
				<Group mt="md" justify="flex-end">
					<Button variant="default" onClick={() => setConfirmOpen(false)}>Cancel</Button>
					<Form method="POST" onSubmit={() => setConfirmOpen(false)}>
						<input type="hidden" name="type" value="delete"/>
						<input type="hidden" name="path" value={fileToDelete?.path ?? ""}/>
						<Button color="red" type="submit" name="type" value="delete">Delete</Button>
					</Form>
				</Group>
			</Modal>
		</Stack>
	);
}