import {Link} from "react-router";
import {Button} from "@mantine/core";
import {IconTrash} from "@tabler/icons-react";


export default function DeleteButton({to}: { to: string }) {
	return (
		<Button
			component={Link}
			to={to}
			color="red"
			aria-label="Delete file"
			leftSection={<IconTrash/>}
		>
			Delete
		</Button>
	);
}