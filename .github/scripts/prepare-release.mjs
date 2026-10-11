import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repository = 'lunarpaper/lunarpaper';
const files = ['.env.example', 'Caddyfile', 'compose.http.yaml', 'compose.https.yaml', 'compose.yaml', 'filer.toml', 'README.md'];
const mediaTypes = [
  'application/vnd.oci.image.manifest.v1+json', 'application/vnd.oci.image.index.v1+json',
  'application/vnd.docker.distribution.manifest.v2+json', 'application/vnd.docker.distribution.manifest.list.v2+json',
];

export function validateInputs(version, details, commit) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version ?? '')) {
    throw new Error('Version must be a published version such as 0.8.0, without a v prefix.');
  }
  if (!details?.trim()) throw new Error('Details must contain release notes.');
  if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('A full template commit is required.');
}

async function request(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(30_000) });
}

// Authenticate anonymously: successful reads prove customers need no GitHub login.
export async function publicImageDigest(name, version) {
  const tokenResponse = await request(`https://ghcr.io/token?service=ghcr.io&scope=repository:lunarpaper/${name}:pull`);
  if (!tokenResponse.ok) throw new Error(`${name}:${version} is not publicly readable (${tokenResponse.status}).`);
  const { token } = await tokenResponse.json();
  const manifest = await request(`https://ghcr.io/v2/lunarpaper/${name}/manifests/${version}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: mediaTypes.join(', ') },
  });
  if (!manifest.ok) throw new Error(`${name}:${version} is not publicly readable (${manifest.status}). Promote both images first.`);
  const bytes = Buffer.from(await manifest.arrayBuffer());
  const document = JSON.parse(bytes.toString('utf8'));
  if (document.schemaVersion !== 2 || !mediaTypes.includes(document.mediaType)) throw new Error(`Invalid ${name} manifest.`);
  const digest = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
  if (manifest.headers.get('docker-content-digest') !== digest) throw new Error(`${name} manifest digest mismatch.`);
  return digest;
}

export async function ensureNewRelease(version, token) {
  if (!token) throw new Error('GitHub Actions token is required.');
  for (const endpoint of [`releases/tags/v${version}`, `git/ref/tags/v${version}`]) {
    const response = await request(`https://api.github.com/repos/${repository}/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    });
    if (response.status === 404) continue;
    if (!response.ok) throw new Error(`Cannot check existing release/tag (${response.status}).`);
    throw new Error(`v${version} already has a release or tag. Inspect it before retrying; existing releases are never overwritten.`);
  }
}

export async function prepareRelease({ version, details, commit, root, output, inspect = publicImageDigest }) {
  validateInputs(version, details, commit);
  const templates = {};
  for (const name of files) {
    const filename = path.join(root, 'compose', name);
    if (!(await lstat(filename)).isFile()) throw new Error(`Template must be a regular file: ${name}`);
    templates[name] = (await readFile(filename, 'utf8')).replaceAll('\r\n', '\n');
  }
  const assignments = templates['.env.example'].split('\n').filter(line => line.trim() && !line.trimStart().startsWith('#'));
  if (assignments.filter(line => /^LUNAR_PAPER_VERSION=\d+\.\d+\.\d+$/.test(line)).length !== 1
      || assignments.some(line => !/^LUNAR_PAPER_VERSION=\d+\.\d+\.\d+$/.test(line) && !/^[A-Z][A-Z0-9_]*=\s*$/.test(line))) {
    throw new Error('The public environment template must contain exactly one version and otherwise blank values.');
  }
  templates['.env.example'] = templates['.env.example'].replace(/^LUNAR_PAPER_VERSION=.*$/m, `LUNAR_PAPER_VERSION=${version}`);
  const images = {};
  for (const name of ['platform', 'publisher']) {
    const digest = await inspect(name, version);
    if (!/^sha256:[a-f0-9]{64}$/.test(digest)) throw new Error(`Invalid digest for ${name}.`);
    images[name] = `ghcr.io/lunarpaper/${name}@${digest}`;
  }
  templates['release.json'] = JSON.stringify({ formatVersion: 2, version, templateCommit: commit, images,
    postgresql: { image: 'postgres:17-alpine', major: 17, dataDirectory: '/var/lib/postgresql/data' } }, null, 2) + '\n';
  templates.LICENSE = await readFile(path.join(root, 'LICENSE'), 'utf8');
  await mkdir(path.join(output, 'bundle'), { recursive: true });
  for (const [name, content] of Object.entries(templates)) await writeFile(path.join(output, 'bundle', name), content);
  const references = Object.entries(images).map(([name, reference]) => `- ${name}: \`${reference}\``).join('\n');
  await writeFile(path.join(output, 'notes.md'), `${details.trim()}\n\n## Installation\n\n` +
    `Download \`lunarpaper-${version}-compose.zip\` below, or follow the [Docker Compose guide](https://docs.lunarpaper.com/self-hosting/install/docker-compose/).\n\n` +
    `The ZIP uses templates from [\`${commit.slice(0, 7)}\`](https://github.com/${repository}/commit/${commit}) and selects version \`${version}\`. Keep populated credentials outside the bundle.\n\n` +
    `## Images\n\n${references}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const { RELEASE_VERSION: version, RELEASE_DETAILS: details, GITHUB_SHA: commit, RELEASE_DIR: output } = process.env;
    if (process.env.GITHUB_REPOSITORY !== repository || process.env.GITHUB_REF !== 'refs/heads/main') throw new Error('Run this workflow from lunarpaper/lunarpaper main.');
    validateInputs(version, details, commit);
    await ensureNewRelease(version, process.env.GH_TOKEN);
    if (!output) throw new Error('Release output directory is required.');
    await prepareRelease({ version, details, commit, root: process.cwd(), output });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
