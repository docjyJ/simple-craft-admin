import { describe, expect, it } from 'vitest';
import { getRelativePath, isValidUid, resolveSafePath, root } from './path-validation';

const uuidSample = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';

describe('isValidUid', () => {
  it('valid uid', () => {
    expect(isValidUid(uuidSample)).toBe(true);
  });
  it('invalid uid', () => {
    expect(isValidUid('AZaz09')).toBe(false);
    expect(isValidUid('abc_123')).toBe(false);
    expect(isValidUid('abc/123')).toBe(false);
    expect(isValidUid('abc.123')).toBe(false);
  });
});

describe('resolveSafePath', () => {
  it('valid path', () => {
    expect(resolveSafePath(uuidSample, '/server.jar')).toBe(`${root}/${uuidSample}/server.jar`);
    expect(resolveSafePath(uuidSample, 'plugins/plugin.jar')).toBe(`${root}/${uuidSample}/plugins/plugin.jar`);
    expect(resolveSafePath(uuidSample, './config.yml')).toBe(`${root}/${uuidSample}/config.yml`);
    expect(resolveSafePath(uuidSample, 'data/../server.jar')).toBe(`${root}/${uuidSample}/server.jar`);
  });
  /*it('bad uid', () => {
    expect(() => resolveSafePath('abc_123', '/server.jar')).toThrow(
      "Invalid uid: 'abc_123'. Only alphanumeric characters, and hyphens are allowed.",
    );
    expect(() => resolveSafePath('abc/123', '/server.jar')).toThrow(
      "Invalid uid: 'abc/123'. Only alphanumeric characters, and hyphens are allowed.",
    );
  });*/
  /*it('out of root', () => {
    expect(() => resolveSafePath(uuidSample, '../${uuidSample}/server.jar')).toThrow(
      "Path '../${uuidSample}/server.jar' is outside the root directory.",
    );
    expect(() => resolveSafePath(uuidSample, '../../other-server/server.jar')).toThrow(
      "Path '../../other-server/server.jar' is outside the root directory.",
    );
    expect(() => resolveSafePath(uuidSample, '/server/../data/../../server.jar')).toThrow(
      "Path '/server/../data/../../server.jar' is outside the root directory.",
    );
  });*/
});

describe('relativePath', () => {
  it('valid relative path', () => {
    expect(getRelativePath(uuidSample, `${root}/${uuidSample}/server.jar`)).toBe('/server.jar');
    expect(getRelativePath(uuidSample, `${root}/${uuidSample}/plugins/plugin.jar`)).toBe('/plugins/plugin.jar');
    expect(getRelativePath(uuidSample, `${root}/${uuidSample}/config.yml`)).toBe('/config.yml');
    expect(getRelativePath(uuidSample, `${root}/${uuidSample}`)).toBe('/');
  });
});
