import {Link} from "react-router";
import {Button} from "@mantine/core";
import {IconUpload} from "@tabler/icons-react";


export default function UploadButton({to}: { to: string }) {
	return (
		<Button
			component={Link}
			to={to}
			color="green"
			aria-label="Upload file"
			leftSection={<IconUpload/>}
		>
			Upload
		</Button>
	);
}