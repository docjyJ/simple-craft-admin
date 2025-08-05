import type {Route} from './+types/_auth.servers.$uid.files';
import {useSearchParams} from "react-router";
import {deleteMinecraftServerFile, getMinecraftServerFiles} from "~/server/file-explorer";
import {IconFile, IconFolder, IconTrash} from "@tabler/icons-react";
import CodeMirror from "@uiw/react-codemirror";
import {
	Stack, Text, Anchor, Breadcrumbs, Table, ScrollArea, Paper, Button, ActionIcon, Modal, Group, Loader
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
	const path = formData.get("path");
	if (typeof path === "string" && path.trim() !== "") {
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
	const [loading, setLoading] = useState(false);

	const handleNavigate = (newPath: string) => {
		setSearchParams({path: newPath});
	};

	const handleDeleteClick = (file: { name: string, isDir: boolean }, filePath: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setFileToDelete({...file, path: filePath});
		setConfirmOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!fileToDelete) return;
		setLoading(true);
		await fetch(window.location.pathname, {
			method: "POST",
			body: new URLSearchParams({path: fileToDelete.path}),
		});
		setLoading(false);
		setConfirmOpen(false);
		setFileToDelete(null);
		window.location.reload();
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
													onClick={e => handleDeleteClick(file, filePath, e)}
													disabled={loading}
												>
													{loading && fileToDelete?.path === filePath ? <Loader size="xs"/> : <IconTrash/>}
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
					<Button variant="default" onClick={() => setConfirmOpen(false)} disabled={loading}>Cancel</Button>
					<Button color="red" onClick={handleConfirmDelete} loading={loading}>Delete</Button>
				</Group>
			</Modal>
		</Stack>
	);
}