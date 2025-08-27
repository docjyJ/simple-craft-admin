export type LogLine = { out: string } | { err: string } | { in: string };

export type ServerStatus = {
  version: string;
  max_players: number;
  online_players: number;
  players: {
    name: string;
    id: string;
  }[];
  motd: string;
  icon: string;
};
export type ServerProperties = {
  motd: string;
  max_players: number;
  server_port: number;
};

export type ScaProperties = {
  name: string;
  jar_url: string;
  java_version: string;
};
