import {Alert, Button, Fieldset, NumberInput, Stack, TextInput} from "@mantine/core";
import {getServerData, updateConfig, updateJar} from "~/server/minecraft-servers";
import type {Route} from './+types/_auth.servers.$uid.manage';
import {IconAlertHexagon, IconDeviceFloppy, IconInfoHexagon} from "@tabler/icons-react";
import {z} from 'zod';
import {parseFormData, ValidatedForm, validationError} from "@rvf/react-router";


const settingsSchema = z.object({
	type: z.literal("settings"),
	name: z.coerce.string().min(1, "Server name is required"),
	server_port: z.coerce.number().int().min(1, "Port must be between 1 and 65535").max(65535, "Port must be between 1 and 65535")
});
const jarSchema = z.object({
	type: z.literal("jar"),
	jar_url: z.url({
		protocol: /^https?$/,
		hostname: z.regexes.domain
	})
});

const schema = z.discriminatedUnion("type", [settingsSchema, jarSchema]);

export async function loader({params: {uid}}: Route.LoaderArgs) {
	return getServerData(uid).then(serverData => ({serverData}));
}

export async function action({request, params: {uid}}: Route.ActionArgs) {
	const result = await parseFormData(request, schema);
	if (result.error) {
		return validationError(result.error, result.submittedData);
	}
	if (result.data.type === "settings") {
		return updateConfig(uid, result.data);
	} else {
		return updateJar(uid, result.data.jar_url);
	}
}

export default function ManageServer({loaderData: {serverData}}: Route.ComponentProps) {
	return (
		<Stack>
			<ValidatedForm
				id="settings-form"
				method="post"
				schema={settingsSchema}
				defaultValues={{
					type: "settings",
					name: serverData.name,
					server_port: serverData.server_port,
				}}
			>
				{(form) => (
					<Fieldset name="Server Settings">
						<Stack justify="left">
							<input name="type" type="hidden" value="settings"/>
							<TextInput
								name="name"
								label="Server Name"
								required
								error={form.error('name')}
								{...form.getInputProps('name')}/>
							<NumberInput
								name="server_port"
								label="Server Port"
								required
								min={1}
								max={65535}
								error={form.error('server_port')}
								{...form.getInputProps('server_port')}/>
							<Button type="submit" leftSection={<IconDeviceFloppy size={18}/>} loading={form.formState.isSubmitting}>
								Save Settings
							</Button>

							{
								form.formState.submitStatus === 'success' && (
									<Alert title="Settings Updated" color="green" icon={<IconInfoHexagon/>}>
										The server settings have been updated successfully.
									</Alert>
								)}
							{
								form.formState.submitStatus === 'error' && (
									<Alert title="Error Updating Settings" color="red" icon={<IconAlertHexagon/>}>
										There was an error updating the server settings. Please check the form for errors.
									</Alert>
								)
							}
						</Stack>
					</Fieldset>
				)}
			</ValidatedForm>
			<ValidatedForm
				id="jar-form"
				method="post"
				schema={jarSchema}
				defaultValues={{
					type: "jar",
					jar_url: serverData.jar_url
				}}
			>
				{(form) => (
					<Fieldset name="Update Jar">
						<Stack justify="left">
							<input name="type" type="hidden" value="jar"/>
							<TextInput
								label="Jar URL"
								required
								placeholder="https://example.com/path/to/server.jar"
								error={form.error('jar_url')}
								{...form.getInputProps('jar_url')}/>
							<Button type="submit" leftSection={<IconDeviceFloppy size={18}/>} loading={form.formState.isSubmitting}>
								Update Jar
							</Button>
							{
								form.formState.submitStatus === 'success' && (
									<Alert title="Jar Updated" color="green" icon={<IconInfoHexagon/>}>
										The server jar has been updated successfully. You may need to restart the server for changes to take
										effect.
									</Alert>
								)}
							{
								form.formState.submitStatus === 'error' && (
									<Alert title="Error Updating Jar" color="red" icon={<IconAlertHexagon/>}>
										There was an error updating the server jar.
									</Alert>
								)
							}
						</Stack>
					</Fieldset>
				)}
			</ValidatedForm>
		</Stack>
	);
}