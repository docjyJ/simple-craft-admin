import { Avatar, Group, Stack, Text } from '@mantine/core';

export type ServerUserProps = {
  name: string;
  motd: string;
  icon: string;
};

export default function ServerUser({ name, motd, icon }: ServerUserProps) {
  const motdSlice = motd.split('\n');
  return (
    <Group gap="xs">
      <Avatar src={icon} />
      <Stack gap={0}>
        <Text fz="sm" fw={500}>
          {name}
        </Text>
        <Text fz="xs">
          {motdSlice[0] ?? ' '}
          <br />
          {motdSlice[1] ?? ' '}
          <br />
        </Text>
      </Stack>
    </Group>
  );
}
