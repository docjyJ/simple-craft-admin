import {Group, Text} from "@mantine/core";

export type ServerPlayerCountProps = {
	online_players?: number;
	max_players: number;
}

export default function ServerPlayerCount({online_players, max_players}: ServerPlayerCountProps) {
	return (
		<Group gap="xs">
			<Text fz="sm" fw={500}>{online_players ?? '??'}</Text>
			<Text fz="xs" c="dimmed">/ {max_players}</Text>
		</Group>
	);
}