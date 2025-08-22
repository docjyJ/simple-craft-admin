import { describe, expect, it } from 'vitest';
import { getRelativePath, isValidUid, resolveSafePath, root } from './path-validation';

describe('isValidUid', () => {
  it('valid uid', () => {
    expect(isValidUid('abc-123')).toBe(true);
    expect(isValidUid('AZaz09')).toBe(true);
  });
  it('invalid uid', () => {
    expect(isValidUid('abc_123')).toBe(false);
    expect(isValidUid('abc/123')).toBe(false);
    expect(isValidUid('abc.123')).toBe(false);
  });
});

describe('resolveSafePath', () => {
  it('valid path', () => {
    expect(resolveSafePath('abc-123', '/server.jar')).toBe(`${root}/abc-123/server.jar`);
    expect(resolveSafePath('abc-123', 'plugins/plugin.jar')).toBe(
      `${root}/abc-123/plugins/plugin.jar`,
    );
    expect(resolveSafePath('abc-123', './config.yml')).toBe(`${root}/abc-123/config.yml`);
    expect(resolveSafePath('abc-123', 'data/../server.jar')).toBe(`${root}/abc-123/server.jar`);
  });
  it('bad uid', () => {
    expect(() => resolveSafePath('abc_123', '/server.jar')).toThrow(
      "Invalid uid: 'abc_123'. Only alphanumeric characters, and hyphens are allowed.",
    );
    expect(() => resolveSafePath('abc/123', '/server.jar')).toThrow(
      "Invalid uid: 'abc/123'. Only alphanumeric characters, and hyphens are allowed.",
    );
  });
  it('out of root', () => {
    expect(() => resolveSafePath('abc-123', '../abc-123/server.jar')).toThrow(
      "Path '../abc-123/server.jar' is outside the root directory.",
    );
    expect(() => resolveSafePath('abc-123', '../../other-server/server.jar')).toThrow(
      "Path '../../other-server/server.jar' is outside the root directory.",
    );
    expect(() => resolveSafePath('abc-123', '/server/../data/../../server.jar')).toThrow(
      "Path '/server/../data/../../server.jar' is outside the root directory.",
    );
  });
});

describe('relativePath', () => {
  it('valid relative path', () => {
    expect(getRelativePath('abc-123', `${root}/abc-123/server.jar`)).toBe('/server.jar');
    expect(getRelativePath('abc-123', `${root}/abc-123/plugins/plugin.jar`)).toBe(
      '/plugins/plugin.jar',
    );
    expect(getRelativePath('abc-123', `${root}/abc-123/config.yml`)).toBe('/config.yml');
    expect(getRelativePath('abc-123', `${root}/abc-123`)).toBe('/');
  });
});
