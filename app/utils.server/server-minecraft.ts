import { type ChildProcess, spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { resolveSafePath } from '~/utils.server/path-validation';
import { serverMinecraftInstances } from '~/utils.server/global';
import { mkdir, writeFile } from 'node:fs/promises';
import type { LogLine } from '~/type';
import {
  editScaProperties,
  editServerProperties,
  getScaProperties,
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

  get history(): LogLine[] {
    return this.logHistory;
  }

  async init({ name }: { name: string }) {
    await mkdir(this.path, { recursive: true });
    await writeFile(`${this.path}/sca.properties`, `name=${name}\njava-version=default\n`, { flag: 'w' });
    await writeFile(`${this.path}/server.properties`, `motd=${name}\nmax-players=20\nserver-port=25565\n`, {
      flag: 'w',
    });
  }

  isRunning() {
    return this.proc !== null && this.proc.exitCode === null;
  }

  async getServerData() {
    const serverProperties = await getServerProperties(`${this.path}/server.properties`);
    const scaProperties = await getScaProperties(`${this.path}/sca.properties`);
    const serverStatus = this.isRunning() ? await getServerStatus(serverProperties.server_port) : null;
    if (serverStatus) {
      return {
        is_online: true,
        motd: serverStatus.motd,
        max_players: serverStatus.max_players,
        online_players: serverStatus.online_players,
        server_icon: serverStatus.icon,
        server_version: serverStatus.version,
        name: scaProperties.name,
        server_port: serverProperties.server_port,
        java_version: scaProperties.java_version,
      };
    }
    return {
      is_online: false,
      motd: serverProperties.motd,
      max_players: serverProperties.max_players,
      server_icon: await getServerIcon(`${this.path}/server-icon.png`),
      name: scaProperties.name,
      server_port: serverProperties.server_port,
      java_version: scaProperties.java_version,
    };
  }

  async updateConfig({ name, server_port, java_version }: { name: string; server_port: number; java_version: string }) {
    await editServerProperties(`${this.path}/server.properties`, { server_port });
    await editScaProperties(`${this.path}/sca.properties`, {
      name: name.trim(),
      java_version,
    });
  }

  async start() {
    if (this.isRunning()) return;
    const scaProperties = await getScaProperties(`${this.path}/sca.properties`);
    const version = scaProperties.java_version;
    const javaPathMap: Record<string, string> = {
      '8': '/usr/lib/jvm/java-1.8-openjdk/bin/java',
      '11': '/usr/lib/jvm/java-11-openjdk/bin/java',
      '17': '/usr/lib/jvm/java-17-openjdk/bin/java',
      default: '/usr/lib/jvm/java-21-openjdk/bin/java',
    };
    const javaBin = version in javaPathMap ? javaPathMap[version] : javaPathMap['default'];
    const javaArgs = ['-Xmx1024M', '-Xms1024M', '-jar', 'server.jar', 'nogui'];
    const proc = spawn(javaBin, javaArgs, {
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
    if (!this.proc?.stdin) return false;
    this.pushLine({ in: command });
    this.proc.stdin.write(command + '\n');
    return true;
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
}

export function getOrCreateServer(uid: string): ServerMinecraft {
  let inst = serverMinecraftInstances.get(uid);
  if (!inst) {
    inst = new ServerMinecraft(uid);
    serverMinecraftInstances.set(uid, inst);
  }
  return inst;
}
