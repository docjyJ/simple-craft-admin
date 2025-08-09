import {fullListMinecraftServers} from "~/server/minecraft-servers";
import type {Route} from './+types/_auth.servers._index';
import {ActionIcon, Avatar, Badge, Group, Paper, Table, Text} from "@mantine/core";
import {IconAccessPoint, IconAccessPointOff, IconEdit} from "@tabler/icons-react";
import {Link} from "react-router";


export async function loader() {
	const servers = await fullListMinecraftServers();
	return {servers}
}

export default function ServersIndex({loaderData: {servers}}: Route.ComponentProps) {
	const rows = servers.map(({uid, server_data}) => (
		<Table.Tr key={uid}>
			<Table.Td>
				<Group gap="sm">
					<Avatar src={server_data.server_icon}/>
					<div>
						<Text fz="sm" fw={500}>
							{server_data.motd}
						</Text>
					</div>
				</Group>
			</Table.Td>

			<Table.Td>
				<Group gap="xs">
					<Text fz="sm" fw={500}>
						{server_data.online_players ?? '??'}
					</Text>
					<Text fz="xs" c="dimmed">
						/ {server_data.max_players}
					</Text>
				</Group>
			</Table.Td>
			<Table.Td>
				<Text fz="sm">
					{server_data.server_version ?? 'Unknown'}
				</Text>
			</Table.Td>
			<Table.Td>
				{
					server_data.is_online ? (
						<Badge color="green" size="sm" leftSection={<IconAccessPoint size={12}/>}>
							Online
						</Badge>
					) : (
						<Badge color="red" size="sm" leftSection={<IconAccessPointOff size={12}/>}>
							Offline
						</Badge>
					)
				}
			</Table.Td>
			<Table.Td>
				<ActionIcon component={Link} to={`/servers/${uid}`} variant="filled" aria-label="Settings">
					<IconEdit style={{width: '70%', height: '70%'}} stroke={1.5}/>
				</ActionIcon>
			</Table.Td>
		</Table.Tr>
	));
	return (
		<>
			<h1>Liste des serveurs Minecraft</h1>

			<Paper withBorder>
				<Table.ScrollContainer minWidth={800} type="native">
					<Table verticalSpacing="sm">
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Server</Table.Th>
								<Table.Th>Players</Table.Th>
								<Table.Th>Version</Table.Th>
								<Table.Th>Status</Table.Th>
								<Table.Th>Action</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>{rows}</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			</Paper>
		</>
	);
}