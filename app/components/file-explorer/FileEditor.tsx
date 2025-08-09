import {Stack} from "@mantine/core";
import HeaderExplorer from "~/components/file-explorer/HeaderExplorer";
import {DeleteButton, DownloadButton} from "~/components/file-explorer/buttons";
import useExplorerLocation, {urlBuilder} from "~/hooks/file-explorer/useExplorerLocation";
import CodeMirror from "@uiw/react-codemirror";

type FileEditorProps = {
	fileContent: string;
}

export default function FileEditor({fileContent}: FileEditorProps) {
	const {pathArray, pathString} = useExplorerLocation();
	return (
		<Stack>
			<HeaderExplorer
				leftSection={<>
					<DownloadButton isFile={true} to={urlBuilder({path: pathString, download: true})}/>
					{/*TODO: Implement Delete Modal*/}
					<DeleteButton to={""}/>
				</>} pathArray={pathArray}/>
			<CodeMirror
				value={fileContent}
				readOnly={true}
				style={{fontSize: 14}}
			/>
		</Stack>
	);
}
