import {Button, Group, Input, Paper, Stack, Textarea, TextInput} from "@mantine/core";
import {IconSend} from "@tabler/icons-react";
import {getMinecraftServerLog, sendCommandToServer} from "~/server/minecraft-servers";
import {Form} from "react-router";
import type {Route} from './+types/_auth.servers.$uid._index';

export async function loader({params}: Route.LoaderArgs) {
	const {uid} = params;
	if (!uid) throw new Response("UID manquant", {status: 400});
	const log = getMinecraftServerLog(uid) ?? "";
	return {log};
}

export async function action({request, params}: Route.ActionArgs) {
	const {uid} = params;
	const formData = await request.formData();
	const command = formData.get("command");
	if (typeof command === "string" && uid) {
		sendCommandToServer(uid, command);
	}
}

export default function ServerConsole({loaderData: {log}}: Route.ComponentProps) {

	return (
		<Stack>
			<Textarea
				placeholder="Console output will appear here..."
				readOnly
				value={log}
				autosize
				minRows={20}
				maxRows={20}
			/>

			<Form method="post">
				<Group align="end">
					<TextInput
						placeholder="Type a command here..."
						autoComplete="off"
						name="command"
						autoFocus
						style={{flexGrow: 1}}
					/>
					<Button
						variant="outline"
						color="blue"
						type="submit"
						leftSection={<IconSend/>}
					>Send</Button>
				</Group>
			</Form>
		</Stack>
	);
}