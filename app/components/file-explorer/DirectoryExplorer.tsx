import type {FolderEntry} from "~/server/file-explorer";
import {Form, Link, useNavigate} from "react-router";
import {useState} from "react";
import {ActionIcon, Group, ScrollArea, Stack, Table} from "@mantine/core";
import HeaderExplorer from "~/components/file-explorer/HeaderExplorer";
import {IconDownload, IconFile, IconFileZip, IconFolder, IconFolderUp, IconTrash} from "@tabler/icons-react";
import {DownloadButton, UploadButton} from "~/components/file-explorer/buttons";
import useExplorerLocation, {urlBuilder} from "~/hooks/file-explorer/useExplorerLocation";
import DeleteFileModal from "~/components/file-explorer/modals/DeleteFileModal";
import UploadFilesModal from "~/components/file-explorer/modals/UploadFilesModal";

type DirectoryExplorerProps = {
	entries: FolderEntry[];
};

export default function DirectoryExplorer({entries}: DirectoryExplorerProps) {
	const {pathArray, pathString, upload} = useExplorerLocation();
	const navigate = useNavigate();
	const [deleteModal, setDeleteModal] = useState<{ name: string, isDir: boolean, path: string } | null>(null);
	return (
		<Stack miw={600}>
			<HeaderExplorer
				leftSection={<>
					<DownloadButton isFile={false} to={urlBuilder({path: pathString, download: true})}/>
					<UploadButton to={urlBuilder({path: pathString, upload: true})}/>
				</>} pathArray={pathArray}/>
			<Table highlightOnHover>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Name</Table.Th>
						<Table.Th>Type</Table.Th>
						<Table.Th>Actions</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{entries.map((entry) => {
						const filePath = [...pathArray, entry.name].join("/");
						return (
							<Table.Tr
								key={entry.name}
								onClick={() => navigate(urlBuilder({path: filePath}))}
								style={{cursor: "pointer"}}
							>
								<Table.Td>
									{entry.type === "folder" ? <IconFolder/> : entry.type === "archive" ? <IconFileZip/> :
										<IconFile/>} {entry.name}
								</Table.Td>
								<Table.Td>
									{entry.type === "folder" ? "Folder" : entry.type === "archive" ? "Archive" : "File"}
								</Table.Td>
								<Table.Td>
									<Group>
										<ActionIcon
											color="red"
											type="button"
											aria-label="Delete file"
											onClick={e => {
												e.stopPropagation();
												setDeleteModal({name: entry.name, isDir: entry.type === "folder", path: filePath});
											}}
										>
											<IconTrash/>
										</ActionIcon>
										<ActionIcon
											component={Link}
											to={urlBuilder({path: filePath, download: true})}
											download reloadDocument
											color="blue"
											type="button"
											aria-label={entry.type === "folder" ? "Download folder" : "Download file"}
											onClick={e => e.stopPropagation()}
										>
											<IconDownload/>
										</ActionIcon>
										{
											entry.type === "archive" && (
												<Form method="POST" action={urlBuilder({path: pathString})}>
													<input type="hidden" name="path" value={filePath}/>
													<ActionIcon
														color="green"
														type="submit"
														aria-label="Extract archive"
														name="type"
														value="extract"
														onClick={e => e.stopPropagation()}

													><IconFolderUp/></ActionIcon>
												</Form>
											)
										}
									</Group>
								</Table.Td>
							</Table.Tr>
						);
					})}
				</Table.Tbody>
			</Table>
			<DeleteFileModal path={pathString} deleteModal={deleteModal} onClose={() => setDeleteModal(null)}/>
			<UploadFilesModal opened={upload} path={pathString}
												closePath={urlBuilder({path: pathString})}/>
		</Stack>
	);
}