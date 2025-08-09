import {DeleteButton, DownloadButton} from "~/components/file-explorer/buttons";
import {Stack, Text} from "@mantine/core";
import HeaderExplorer from "~/components/file-explorer/HeaderExplorer";
import useExplorerLocation, {urlBuilder} from "~/hooks/file-explorer/useExplorerLocation";

type ArchiveViewerProps = {
	archiveFiles: string[];
}

export default function ArchiveViewer({archiveFiles}: ArchiveViewerProps) {
	const {pathString, pathArray} = useExplorerLocation();
	return (
		<Stack>
			<HeaderExplorer
				leftSection={<>
					<DownloadButton isFile={true} to={urlBuilder({path: pathString, download: true})}/>
					{/*TODO: Implement Delete Modal*/}
					<DeleteButton to={""}/>
				</>} pathArray={pathArray}			/>

			{archiveFiles.map((name) => (<Text key={name}>{name}</Text>))}
		</Stack>
	);
}