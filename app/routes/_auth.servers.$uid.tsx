import type {Route} from './+types/_auth.servers.$uid';
import {Form, Outlet, useLocation, useNavigate} from "react-router";
import {forceKill, getServerData, isRunning, startMinecraftServer} from "~/server/minecraft-servers";
import {Button, Group, Paper, Stack, Tabs, Text} from "@mantine/core";
import {IconPlayerStop, IconPower} from '@tabler/icons-react';
import ServerUser from "~/components/ServerUser";
import ServerPlayerCount from "~/components/ServerPlayerCount";

export async function loader({params: {uid}}: Route.LoaderArgs) {
	return {
		server_data: await getServerData(uid),
		is_online: isRunning(uid)
	};
}

export async function action({request, params: {uid}}: Route.ActionArgs) {
	const formData = await request.formData();
	const actionType = formData.get("running-action"); // "start" ou "stop"

	if (actionType === "start") {
		startMinecraftServer(uid)
	}
	if (actionType === "stop") {
		forceKill(uid)
	}
}

export default function ServerLayout({loaderData: {server_data, is_online}, params: {uid}}: Route.ComponentProps) {
	const navigate = useNavigate();
	const {pathname} = useLocation();

	return (
		<Stack h="100%" justify="space-between" p="md">
			<Paper withBorder p="md">
				<Group justify="space-between">
					<ServerUser name={server_data.name} motd={server_data.motd} icon={server_data.server_icon}/>
					<ServerPlayerCount max_players={server_data.max_players} online_players={server_data.online_players}/>
					<Text fz="sm">
						{server_data.server_version ?? 'Unknown'}
					</Text>
					<Form method="post">
						<Button
							color={is_online ? "red" : "green"}
							type="submit"
							name="running-action"
							value={is_online ? "stop" : "start"}
							leftSection={is_online ? <IconPlayerStop size={18}/> : <IconPower size={18}/>}
						>
							{is_online ? "Force Stop" : "Start Server"}
						</Button>
					</Form>
				</Group>
			</Paper>
			<Paper withBorder p="md">
				<Tabs
					value={pathname}
					onChange={(value) => {
						if (value !== null) navigate(value)
					}}
					variant="pills"
				>
					<Tabs.List>
						<Tabs.Tab value={`/servers/${uid}`}>Console</Tabs.Tab>
						<Tabs.Tab value={`/servers/${uid}/files`}>Files</Tabs.Tab>
						<Tabs.Tab value={`/servers/${uid}/settings`}>Settings</Tabs.Tab>
					</Tabs.List>
				</Tabs>

			</Paper>
			<Paper withBorder p="md" style={{flexGrow: 1, overflow: "auto"}}>
				<Outlet/>
			</Paper>
		</Stack>
	);
}