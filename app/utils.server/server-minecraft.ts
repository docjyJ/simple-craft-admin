import { type ChildProcess, spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { resolveSafePath } from '~/utils.server/path-validation';
import { serverMinecraftInstances } from '~/utils.server/global';
import { mkdir, writeFile } from 'node:fs/promises';
import type { LogLine } from '~/type';
import {
  editSacProperties,
  editServerProperties,
  getSacProperties,
  getServerIcon,
  getServerProperties,
  getServerStatus,
} from '~/utils.server/minecraft-servers';

export class ServerMinecraft {
  readonly uid: string;
  private readonly path: string;
  private proc: ChildProcess | null = null;
  private logHistory: LogLine[] = [];
  private emitter = new EventEmitter();
  private stdoutBuf = '';
  private stderrBuf = '';

  constructor(uid: string) {
    this.uid = uid;
    this.path = resolveSafePath(uid, '');
  }

  private serverPropertiesFile() {
    return resolveSafePath(this.uid, 'server.properties');
  }
  private sacPropertiesFile() {
    return resolveSafePath(this.uid, 'sac.properties');
  }
  private serverIconFile() {
    return resolveSafePath(this.uid, 'server-icon.png');
  }

  async init({ name }: { name: string }) {
    await mkdir(this.path, { recursive: true });
    await writeFile(this.sacPropertiesFile(), `name=${name}\njar_url=\n`, { flag: 'w' });
    await writeFile(this.serverPropertiesFile(), `motd=${name}\nmax-players=20\nserver-port=25565\n`, { flag: 'w' });
  }

  get history(): LogLine[] {
    return this.logHistory;
  }

  isRunning() {
    return this.proc !== null && this.proc.exitCode === null;
  }

  async getServerData() {
    const serverProperties = await getServerProperties(this.serverPropertiesFile());
    const sacProperties = await getSacProperties(this.sacPropertiesFile());
    const serverStatus = this.isRunning() ? await getServerStatus(serverProperties.server_port) : null;
    if (serverStatus) {
      return {
        is_online: true,
        motd: serverStatus.motd,
        max_players: serverStatus.max_players,
        online_players: serverStatus.online_players,
        server_icon: serverStatus.icon,
        server_version: serverStatus.version,
        name: sacProperties.name,
        server_port: serverProperties.server_port,
        jar_url: sacProperties.jar_url,
      };
    }
    return {
      is_online: false,
      motd: serverProperties.motd,
      max_players: serverProperties.max_players,
      server_icon: await getServerIcon(this.serverIconFile()),
      name: sacProperties.name,
      server_port: serverProperties.server_port,
      jar_url: sacProperties.jar_url,
    };
  }

  async updateConfig({ name, server_port, jar_url }: { name: string; server_port: number; jar_url: string }) {
    await editServerProperties(this.serverPropertiesFile(), { server_port });
    await editSacProperties(this.sacPropertiesFile(), { name: name.trim(), jar_url });
  }

  private pushLine(line: LogLine) {
    this.logHistory.push(line);
    this.emitter.emit('line', line);
  }

  private handleErrChunk(chunk: string) {
    this.stderrBuf += chunk.replace(/\r/g, '');
    let idx: number;
    while ((idx = this.stderrBuf.indexOf('\n')) !== -1) {
      const line = this.stderrBuf.slice(0, idx).replace(/\r$/, '');
      this.stderrBuf = this.stderrBuf.slice(idx + 1);
      this.pushLine({ err: line });
    }
  }

  private handleOutChunk(chunk: string) {
    this.stdoutBuf += chunk.replace(/\r/g, '');
    let idx: number;
    while ((idx = this.stdoutBuf.indexOf('\n')) !== -1) {
      const line = this.stdoutBuf.slice(0, idx);
      this.stdoutBuf = this.stdoutBuf.slice(idx + 1);
      this.pushLine({ out: line });
    }
  }

  private clean() {
    this.proc = null;
    this.logHistory = [];
    this.stdoutBuf = '';
    this.stderrBuf = '';
  }

  start() {
    if (this.isRunning()) return;
    const javaArgs = ['-Xmx1024M', '-Xms1024M', '-jar', 'server.jar', 'nogui'];
    const proc = spawn('java', javaArgs, {
      cwd: this.path,
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.proc = proc;

    proc.stdout?.setEncoding('utf-8');
    proc.stderr?.setEncoding('utf-8');
    proc.stdout?.on('data', (d: string) => this.handleOutChunk(d));
    proc.stderr?.on('data', (d: string) => this.handleErrChunk(d));

    proc.on('close', () => this.clean());

    proc.unref();
  }

  sendCommand(command: string) {
    const trimmed = command.trim();
    if (trimmed.length === 0) return;
    if (this.proc?.stdin) {
      this.pushLine({ in: trimmed });
      this.proc.stdin.write(trimmed + '\n');
    }
  }

  forceKill(): boolean {
    if (!this.proc) return true;
    try {
      this.proc.kill('SIGKILL');
      this.clean();
      return true;
    } catch {
      return false;
    }
  }

  onLine(listener: (line: LogLine) => void) {
    this.emitter.on('line', listener);
    return () => this.emitter.off('line', listener);
  }
}

export function getOrCreateServer(uid: string): ServerMinecraft {
  let inst = serverMinecraftInstances.get(uid);
  if (!inst) {
    inst = new ServerMinecraft(uid);
    serverMinecraftInstances.set(uid, inst);
  }
  return inst;
}
