import { AreaChart } from '@mantine/charts';
import type { Route } from './+types/dashboard';
import { requireAuth } from '~/utils.server/session';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Anchor, Avatar, Badge, Card, Group, Progress, Stack, Text, Title } from '@mantine/core';
import { fullListMinecraftServers } from '~/utils.server/minecraft-servers';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

interface DiskPoint {
  mount: string;
  used: number;
  free: number;
  size: number;
  samplePaths: string[];
}
interface StatPoint {
  ts: number;
  cpu: number;
  ram: number;
  disks: DiskPoint[];
}

function pickUnitFromMB(maxMB: number) {
  if (maxMB >= 1024 * 1024) return { unit: 'To', divisor: 1024 * 1024 };
  if (maxMB >= 1024) return { unit: 'Go', divisor: 1024 };
  return { unit: 'Mo', divisor: 1 };
}
// function formatNumber(val: number) {
//   if (val >= 100) return Math.round(val).toString();
//   if (val >= 10) return val.toFixed(1);
//   return val.toFixed(2);
// }

function useServerStatsStream() {
  const [stats, setStats] = useState<StatPoint[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/stats');
    eventSourceRef.current = es;
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Omit<StatPoint, 'ts'>;
        setStats((prev) => {
          const next: StatPoint = { ts: Date.now(), ...data };
          return [...prev.slice(-59), next];
        });
      } catch {}
    };
    return () => es.close();
  }, []);

  return stats;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const servers = await fullListMinecraftServers();
  return { servers };
}

export default function Dashboard({ loaderData: { servers } }: Route.ComponentProps) {
  const { t } = useTranslation();
  const stats = useServerStatsStream();
  const last = stats[stats.length - 1];

  const cpuChartData = useMemo(
    () =>
      stats.map((s) => ({
        time: new Date(s.ts).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
        CPU: s.cpu,
      })),
    [stats],
  );

  const { ramChartData, ramUnit } = useMemo(() => {
    const maxMB = stats.reduce((m, s) => (s.ram > m ? s.ram : m), 0);
    const { unit, divisor } = pickUnitFromMB(maxMB || 0);
    const data = stats.map((s) => ({
      time: new Date(s.ts).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
      RAM: parseFloat((s.ram / divisor).toFixed(2)),
    }));
    return { ramChartData: data, ramUnit: unit };
  }, [stats]);

  const disks = last?.disks || [];

  return (
    <Stack gap="md">
      <Title order={2}>{t(($) => $.dashboard.title)}</Title>
      <Group align="stretch" grow>
        <Card withBorder>
          <Title order={5}>{t(($) => $.dashboard.cpu, { unit: '%', duration: 60 })}</Title>
          <AreaChart
            h={140}
            data={cpuChartData}
            dataKey="time"
            series={[{ name: 'CPU', color: 'blue.6' }]}
            curveType="monotone"
            withDots={false}
          />
        </Card>
        <Card withBorder>
          <Title order={5}>{t(($) => $.dashboard.ram, { unit: ramUnit, duration: 60 })}</Title>
          <AreaChart
            h={140}
            data={ramChartData}
            dataKey="time"
            series={[{ name: 'RAM', color: 'teal.6' }]}
            curveType="monotone"
            withDots={false}
          />
        </Card>
      </Group>
      {last && (
        <Card withBorder>
          <Title order={5}>{t(($) => $.dashboard.volumes)}</Title>
          <Stack gap="xs">
            {disks.map((d: DiskPoint) => {
              const size = d.size;
              const used = d.used;
              const pct = size ? (used / size) * 100 : 0;
              const pickUnit = (mb: number) =>
                mb >= 1024 * 1024
                  ? { u: 'To', div: 1024 * 1024 }
                  : mb >= 1024
                    ? { u: 'Go', div: 1024 }
                    : { u: 'Mo', div: 1 };
              const { u, div } = pickUnit(size);
              const fmt = (v: number) => (v >= 100 ? Math.round(v) : v >= 10 ? v.toFixed(1) : v.toFixed(2));
              const paths = d.samplePaths.join(', ');
              return (
                <Stack key={d.mount} gap={2}>
                  <Group justify="space-between">
                    <Text size="xs">{d.mount}</Text>
                    <Text size="xs">
                      {fmt(used / div)} {u} / {fmt(size / div)} {u} ({pct.toFixed(1)}%)
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {paths}
                  </Text>
                  <Progress size="xs" value={pct} color={pct > 85 ? 'red' : pct > 70 ? 'orange' : 'blue'} />
                </Stack>
              );
            })}
            {!disks.length && (
              <Text size="xs" c="dimmed">
                {t(($) => $.dashboard.noDisks)}
              </Text>
            )}
          </Stack>
        </Card>
      )}
      <Card withBorder>
        <Group justify="space-between" mb="xs">
          <Title order={5}>{t(($) => $.dashboard.servers)}</Title>
          <Anchor component={Link} to="/servers" size="xs">
            {t(($) => $.dashboard.seeAll)}
          </Anchor>
        </Group>
        <Stack gap="xs">
          {servers.length === 0 && (
            <Text size="sm" c="dimmed">
              {t(($) => $.dashboard.noServers)}
            </Text>
          )}
          {servers.slice(0, 5).map(({ uid, server_data }) => (
            <Group key={uid} justify="space-between" align="center" wrap="nowrap">
              <Group gap={8} wrap="nowrap">
                <Avatar src={server_data.server_icon} size={30} radius="sm" alt={server_data.name} />
                <div>
                  <Text size="sm" fw={500} lineClamp={1}>
                    {server_data.name}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {server_data.motd}
                  </Text>
                </div>
              </Group>
              <Group gap={8} wrap="nowrap">
                {server_data.is_online ? (
                  <Badge size="sm" color="green">
                    {t(($) => $.dashboard.on)}
                  </Badge>
                ) : (
                  <Badge size="sm" color="red">
                    {t(($) => $.dashboard.off)}
                  </Badge>
                )}
                {server_data.max_players !== undefined && server_data.online_players !== undefined && (
                  <Text size="xs" c="dimmed">
                    {server_data.online_players ?? 0}/{server_data.max_players}
                  </Text>
                )}
                <Anchor component={Link} to={`/servers/${uid}`} size="xs">
                  {t(($) => $.dashboard.open)}
                </Anchor>
              </Group>
            </Group>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
