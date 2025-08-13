import {Button, Fieldset, NumberInput, Stack, TextInput} from "@mantine/core";
import {getServerData, updateConfig} from "~/server/minecraft-servers";
import {Form} from "react-router";
import type {Route} from './+types/_auth.servers.$uid.manage';
import {IconDeviceFloppy} from "@tabler/icons-react";

export async function loader({params: {uid}}: Route.LoaderArgs) {
	return getServerData(uid).then(serverData => ({serverData}));
}

export async function action({request, params: {uid}}: Route.ActionArgs) {
	const formData = await request.formData();
	const type = formData.get("type");
	if (type === "settings") {
		const name = formData.get("name") as string;
		const server_port = parseInt(formData.get("port") as string, 10);

		if (name && !isNaN(server_port) && server_port >= 1 && server_port <= 65535) {
			return updateConfig(uid, {name, server_port});
		} else {
			throw new Error("Invalid form data");
		}
	}
}

export default function ManageServer({loaderData: {serverData}}: Route.ComponentProps) {
	return (
		<Stack>
			<Form method="post">
				<Fieldset
					name="Server Settings">
					<TextInput
						name="name"
						label="Server Name"
						defaultValue={serverData.name}
						required/>
					<NumberInput
						name="port"
						label="Server Port"
						defaultValue={serverData.server_port}
						required
						min={1}
						max={65535}
					/>
					<Button type="submit" name="type" value="settings" leftSection={<IconDeviceFloppy size={18}/>}>
						Save Settings
					</Button>
				</Fieldset>
			</Form>
		</Stack>
	);
}