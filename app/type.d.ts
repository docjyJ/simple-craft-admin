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

export type SacProperties = {
  name: string;
  jar_url: string;
};
