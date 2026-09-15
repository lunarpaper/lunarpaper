# Docker Compose deployment

This bundle installs Lunar Paper on one computer or server over local/LAN HTTP or HTTPS.
It includes the application, PostgreSQL, Redis and persistent SeaweedFS file
storage. HTTPS adds Caddy. Background jobs run in the application container, and
a public domain is not required.

For the broader installation, networking, configuration, backup and maintenance
documentation, see the public [Self-hosting guide](https://docs.lunarpaper.com/self-hosting/).

> **Release compatibility:** use an exact Lunar Paper image version or digest
> whose [release notes](https://github.com/lunarpaper/lunarpaper/releases) identify
> this bundle as supported. The image must contain the image-matched database
> bootstrap and current keyed setup flow. Do not use `latest`.

## Installation overview

1. Create a private environment file outside the repository.
2. Choose exactly one access file: HTTP or HTTPS.
3. Validate the resolved configuration without printing secrets.
4. Pull the pinned images and start the stack.
5. Open `APP_URL`, unlock setup with `SETUP_KEY` and complete guided setup.

## Requirements

- Docker Engine or Docker Desktop with Docker Compose v2. Platform-specific
  installation links and deployment commands are provided below.
- A browser address reachable from your devices: localhost, a LAN address or an
  internal hostname. For HTTPS, reserve ports 80/443 and arrange client trust for
  the internal certificate authority, or use your organisation's TLS infrastructure.
- A supported release image reference from Lunar Paper, preferably its published
  digest. The source repository address is not the container image address.
- Persistent disk space for the databases, file storage and generated documents.

## Configure

Keep the populated environment file **outside this checkout**. Never put real
passwords, API keys or private keys into the example or any other repository file.
The operating-system instructions below create a private `deployment.env` from
the blank `.env.example` template.

Set the image reference, `APP_URL`, administrator email and password. Generate
every remaining secret independently; do not reuse one generated value across
fields. The form-file keyring is a JSON object using `v1` as its key ID, as
explained in the template. Keep all keys and database passwords stable across
restarts. Losing encryption keys can make stored content unreadable.

## Choose HTTP or HTTPS

Use `compose.yaml` plus **exactly one** access file. The core file alone publishes
no ports. Keep the selected file on every command, including later maintenance.

For HTTP on the host computer, set `APP_URL=http://localhost:3000` in your
private env and use `compose.http.yaml`. For LAN access, set both the exact browser
URL and an interface address assigned to your host, for example:

```dotenv
APP_URL=http://192.168.1.20:3000
HTTP_BIND_ADDRESS=192.168.1.20
```

`HOST_PORT` defaults to 3000; include any changed port in APP_URL. Without an
explicit bind address the HTTP file listens only on 127.0.0.1. HTTP supports
ordinary application requests and authenticated setup; its traffic is unencrypted.
Browser features such as recording and clipboard access may require HTTPS.

For internal HTTPS, set `APP_URL=https://paper.internal`, make that name resolve
to the host on your client devices, and use `compose.https.yaml`. Caddy uses
its internal CA by default. Persist the Caddy volumes and install its root CA in
each client's trust store. The root is at `/data/caddy/pki/authorities/local/root.crt`
inside Caddy; distribute only the public root certificate, never the CA private
key. [Caddy's HTTPS guide](https://caddyserver.com/docs/automatic-https) describes
client trust. Public ACME certificates are optional: uncomment the blank
`CADDY_TLS_DIRECTIVE=` example only with suitable DNS and ACME validation.

Do not stack both access files. The HTTPS file publishes Caddy's ports and keeps
the application port private. Its single proxy hop is already configured. An
existing organisation proxy needs a separately reviewed upstream binding and
matching hop count; it must preserve the original host and HTTPS scheme and
prevent direct access that bypasses the proxy.

APP_URL is the exact browser origin, with scheme and optional port but no path
or trailing slash. The application derives cookie security from its scheme.
There are no cookie-security or evaluation flags for customers to coordinate.
Use a different hostname for HTTP if the old hostname has cached an HTTPS-only
HSTS policy.

The template leaves all required values blank. Follow the section for your
operating system after installing Docker and Compose. The examples use local
HTTP; for HTTPS, replace `compose.http.yaml` with `compose.https.yaml` in every
validation, pull and startup command.

## Linux

Install [Docker Engine](https://docs.docker.com/engine/install/) for your Linux
distribution and the [Docker Compose plugin](https://docs.docker.com/compose/install/linux/),
then verify Compose is available:

```sh
docker compose version
```

Clone the repository and create a private deployment file outside the checkout:

```sh
git clone https://github.com/lunarpaper/lunarpaper.git
cd lunarpaper/compose
mkdir -p "$HOME/.config/lunarpaper"
chmod 700 "$HOME/.config/lunarpaper"
# Run this copy only for a NEW installation; never overwrite an existing file.
cp -n .env.example "$HOME/.config/lunarpaper/deployment.env"
chmod 600 "$HOME/.config/lunarpaper/deployment.env"
```

Edit `~/.config/lunarpaper/deployment.env`. Generate each secret independently
by running `openssl rand -hex 32` again for every secret field. After populating
all required values, validate, pull and start Lunar Paper:

```sh
docker compose --project-name lunarpaper \
  --env-file "$HOME/.config/lunarpaper/deployment.env" \
  --file compose.yaml --file compose.http.yaml config --quiet
docker compose --project-name lunarpaper \
  --env-file "$HOME/.config/lunarpaper/deployment.env" \
  --file compose.yaml --file compose.http.yaml pull
docker compose --project-name lunarpaper \
  --env-file "$HOME/.config/lunarpaper/deployment.env" \
  --file compose.yaml --file compose.http.yaml up --detach --wait
```

## Windows

Install [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/),
start Docker Desktop and select Linux containers. Open PowerShell and verify
Compose is available:

```powershell
docker compose version
```

Clone the repository and create a private deployment file outside the checkout:

```powershell
git clone https://github.com/lunarpaper/lunarpaper.git
Set-Location lunarpaper\compose
$deploymentDirectory = Join-Path $env:USERPROFILE '.config\lunarpaper'
$deploymentEnv = Join-Path $deploymentDirectory 'deployment.env'
New-Item -ItemType Directory -Force -Path $deploymentDirectory | Out-Null
if (Test-Path -LiteralPath $deploymentEnv) { throw "Refusing to overwrite $deploymentEnv" }
Copy-Item -LiteralPath '.env.example' -Destination $deploymentEnv
notepad $deploymentEnv
```

Generate each secret independently in PowerShell by running this block again for
every secret field:

```powershell
$bytes = New-Object byte[] 32
$generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$generator.GetBytes($bytes)
$generator.Dispose()
[BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
```

After saving all required values, validate, pull and start Lunar Paper:

```powershell
docker compose --project-name lunarpaper --env-file $deploymentEnv --file compose.yaml --file compose.http.yaml config --quiet
docker compose --project-name lunarpaper --env-file $deploymentEnv --file compose.yaml --file compose.http.yaml pull
docker compose --project-name lunarpaper --env-file $deploymentEnv --file compose.yaml --file compose.http.yaml up --detach --wait
```

## macOS

Install [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/)
and start Docker Desktop, then open Terminal and verify Compose is available:

```sh
docker compose version
```

Clone the repository and create a private deployment file outside the checkout:

```sh
git clone https://github.com/lunarpaper/lunarpaper.git
cd lunarpaper/compose
mkdir -p "$HOME/.config/lunarpaper"
chmod 700 "$HOME/.config/lunarpaper"
# Run this copy only for a NEW installation; never overwrite an existing file.
cp -n .env.example "$HOME/.config/lunarpaper/deployment.env"
chmod 600 "$HOME/.config/lunarpaper/deployment.env"
open -e "$HOME/.config/lunarpaper/deployment.env"
```

Generate each secret independently by running `openssl rand -hex 32` again for
every secret field. After populating all required values, validate, pull and
start Lunar Paper:

```sh
docker compose --project-name lunarpaper \
  --env-file "$HOME/.config/lunarpaper/deployment.env" \
  --file compose.yaml --file compose.http.yaml config --quiet
docker compose --project-name lunarpaper \
  --env-file "$HOME/.config/lunarpaper/deployment.env" \
  --file compose.yaml --file compose.http.yaml pull
docker compose --project-name lunarpaper \
  --env-file "$HOME/.config/lunarpaper/deployment.env" \
  --file compose.yaml --file compose.http.yaml up --detach --wait
```

`config --quiet` validates structure and required values without printing the
resolved credentials. Application startup validates URLs, key formats and
strength. Run commands without conflicting shell deployment variables, since
shell values take precedence over the environment file.

## After startup

Open your exact `APP_URL` and follow guided setup, using your `SETUP_KEY` when
requested. The initial administrator is created only for an empty user database;
changing the bootstrap password later does not reset an existing account.

The `database-bootstrap` container exits successfully after copying the matching
fresh-install database files from the application image. Its stopped state is
normal. The copy commands live in `/app/docker/database-bootstrap.sh` inside the
image; customers do not edit them. This bundle requires an image containing that
script. Container health checks measure liveness; release/setup readiness is
reported separately at `/api/health/ready`.

Set `LUNAR_PAPER_IMAGE` once in the private environment file. Both services use
that selection. The application also receives it through `environment` for its
release-reference checks: Docker's `image` field is not an application environment
variable. Leave that forwarding entry as supplied; it is not a second input.

Only the selected access service publishes host ports. PostgreSQL, Redis and file
storage are private to Docker. The application can make outbound requests for
integrations and licensing; internal hosting does not imply offline operation.

## Two databases, four connections

This deployment creates platform and intake in the same PostgreSQL service.
Each database has a restricted application account and a separate owner connection
for setup/upgrades and backups:

| Database | Application connection | Owner connection |
| --- | --- | --- |
| platform | DATABASE_URL, using app_platform | MIGRATION_PLATFORM_DATABASE_URL |
| intake | INTAKE_DATABASE_URL, using app_intake | MIGRATION_INTAKE_DATABASE_URL |

The owner URLs point to those same databases. They do not create additional
ones. Keep owner and runtime passwords separate; Compose builds the four URLs
from the supplied passwords, so customers do not need to duplicate them in the
private env file. This template requires an image supporting INTAKE_DATABASE_URL.

## Setup is built in

The application always checks whether setup or an upgrade is required. Unlock the
web UI with SETUP_KEY, review the proposed work and explicitly start it. Signing
in does not apply migrations. Ready installations start normally without repeating
setup; pending upgrades remain in maintenance until completed by the operator.

Startup requires a valid independent SETUP_KEY and never applies pending migrations
automatically. Fresh empty database volumes still receive the baseline from the
selected image through database-bootstrap.

## Persistence and upgrades

Keep `--project-name lunarpaper` on every command so subsequent operations use the
same named volumes. This bundle is for fresh installs; do not point it at existing
deployment volumes without reviewing their names, topology and encryption keyrings.

Back up PostgreSQL, Redis, the uploads volume, the entire SeaweedFS data volume
(file contents **and** filer metadata), Caddy state and the private environment
file. Use a consistent backup/snapshot procedure and test restoration. Unless a
release explicitly says otherwise, do not assume an in-app backup includes the
SeaweedFS volume.

For upgrades, preserve the environment and volumes and follow the selected
release's upgrade instructions. Schema upgrades remain an explicit operator action
through setup. Never use `docker compose down --volumes` as an upgrade step.

## Advanced configuration

`compose.yaml` uses ordinary service definitions with application settings directly
under `lunarpaper.environment`. There are no shared YAML anchors or merge keys.
APP_URL is the only origin input. Internal ports and service addresses are
supplied by the bundle; the access file defines direct HTTP or a TLS proxy. Data
processing uses the application's local default.

The commented `DATA_LAYER_ENABLED=true` example in `.env.example` opts into a
separately configured remote data-layer service. Uncomment it only in your private
environment file, supply the endpoint, exact endpoint allowlist and independent
instance key, and configure/register the remote service. This bundle does not
create that service. Empty optional Compose entries forward values when supplied
and are omitted from the container when unset.

`filer.toml` keeps SeaweedFS's directory metadata in the persistent data volume.
Its combined server command follows the [SeaweedFS server implementation](https://github.com/seaweedfs/seaweedfs/blob/4.47/weed/command/server.go),
and the filer storage configuration follows the [upstream template](https://github.com/seaweedfs/seaweedfs/blob/4.47/weed/command/scaffold/filer.toml).

Experimental feature switches, remote data-layer services, separate queue workers,
publisher containers and tuning overrides are outside this standard bundle.
