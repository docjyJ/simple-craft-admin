import {Button, Fieldset, NumberInput, Stack, TextInput} from "@mantine/core";
import {getServerData, updateConfig} from "~/server/minecraft-servers";
import {Form} from "react-router";
import type {Route} from './+types/_auth.servers.$uid.manage';
import {IconDeviceFloppy} from "@tabler/icons-react";
import {zod4Resolver} from 'mantine-form-zod-resolver';
import {z} from 'zod';
import {useForm} from '@mantine/form';
import {safeParseFormData} from "~/zod-utils";

const FromSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("settings"),
			name: z.coerce.string().min(1, "Server name is required"),
		server_port: z.coerce.bigint().min(1, "Port must be between 1 and 65535").max(65535, "Port must be between 1 and 65535")
		})
])


export async function loader({params: {uid}}: Route.LoaderArgs) {
	return getServerData(uid).then(serverData => ({serverData}));
}

export async function action({request, params: {uid}}: Route.ActionArgs) {
	const formData = await safeParseFormData(request, FromSchema);
	if (!formData.success) {
		return {error: formData.error}
	}
	const {type, ...data} = formData.data;
	if (type === "settings") {
		return updateConfig(uid, data);
	}
}

export default function ManageServer({loaderData: {serverData}}: Route.ComponentProps) {
	const form = useForm({
		mode: 'uncontrolled',
		initialValues: {
				name: serverData.name,
				server_port: serverData.server_port
		},
		schema: zod4Resolver(FromSchema)
	});

	return (
		<Stack>
			<Form method="post">
				<Fieldset
					name="Server Settings">
					<TextInput
						name="name"
						label="Server Name"
						required
						{...form.getInputProps('name')}/>
					<NumberInput
						name="server_port"
						label="Server Port"
						required
						min={1}
						max={65535}
						{...form.getInputProps('server_port')}/>
					<Button type="submit" name="type" value="settings" leftSection={<IconDeviceFloppy size={18}/>}>
						Save Settings
					</Button>
				</Fieldset>
			</Form>
		</Stack>
	);
}