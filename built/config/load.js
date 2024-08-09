/**
 * Config loader
 */
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import * as yaml from 'js-yaml';
const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
/**
 * Path of configuration directory
 */
const dir = `${_dirname}/../../.config`;
/**
 * Path of configuration file
 */
const path = process.env.NODE_ENV === 'test'
    ? `${dir}/test.yml`
    : `${dir}/default.yml`;
const verDir = `${_dirname}/../..`;
const verPath = `${verDir}/package.json`;
export default function load() {
    const repo = JSON.parse(fs.readFileSync(verPath, 'utf8'));
    const config = yaml.load(fs.readFileSync(path, 'utf-8'));
    const mixin = {};
    mixin.userAgent = `MisskeyMediaProxy/${repo.version}`;
    return Object.assign(config, mixin);
}
