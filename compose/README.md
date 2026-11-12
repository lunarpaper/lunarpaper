# Quick install

Try Lunar Paper on your computer with the [Quick install guide](https://docs.lunarpaper.com/self-hosting/install/try-locally/).
The starter ZIP includes Docker Compose configuration, a demo login and scripts
that generate the remaining keys and passwords.

## Before you start

[Install and start Docker](https://docs.lunarpaper.com/self-hosting/install-docker/),
then check that `docker version` shows both **Client** and **Server** and
`docker compose version` shows **2.23.1** or later. On Linux or macOS,
`openssl version` must also work.

## Download the starter

Save [lunarpaper-trial-0.8.3.zip](https://docs.lunarpaper.com/downloads/lunarpaper-trial-0.8.3.zip)
in **Downloads**. Extract it outside this repository so your private settings
and generated secrets stay outside the checkout.

**Windows PowerShell**

```powershell
cd "$env:USERPROFILE\Downloads"
Expand-Archive -LiteralPath "lunarpaper-trial-0.8.3.zip" -DestinationPath "lunarpaper-trial-0.8.3"
cd ".\lunarpaper-trial-0.8.3"
Get-ChildItem -Name compose.yaml
```

**Linux and macOS**

```sh
cd "$HOME/Downloads"
unzip -n "lunarpaper-trial-0.8.3.zip" -d "lunarpaper-trial-0.8.3"
cd "lunarpaper-trial-0.8.3"
ls compose.yaml
```

When you see `compose.yaml`, you're in the right folder. Run the remaining
commands there. The starter contains its own single-file HTTP configuration;
the scripts below are in the ZIP, not this repository's `compose/` folder.
Already have a trial? Return to its original folder and settings instead.

## Set your administrator login

Create and open your private `.env` settings file.

**Windows PowerShell**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\create-env.ps1
notepad .env
```

**Linux and macOS**

```sh
bash create-env.sh
nano .env
```

In nano, **Ctrl+O**, then **Enter** saves your edits; **Ctrl+X** closes the editor.
The scripts keep an existing `.env` unchanged.

For a localhost trial, use the supplied login:

- Email: `demo@lunarpaper.com`
- Password: `LunarPaper-Demo!083`

To choose your own login, set `SYSTEM_ADMIN_USERNAME` and `SYSTEM_ADMIN_PASSWORD`
before setup. Use a unique password of 15–72 ASCII characters with uppercase and
lowercase letters, a number and a symbol. Save your changes. For an existing
trial, use the login you originally set.

## Start Lunar Paper

Validate the configuration. If it finishes silently, start the containers and
wait for them to become healthy.

```sh
docker compose --project-name lunarpaper-trial config --quiet
docker compose --project-name lunarpaper-trial up -d --wait
```

If port 3000 is busy, [choose another port](https://docs.lunarpaper.com/self-hosting/install/docker-compose/#use-a-different-port)
and use it in the setup address below. For image download or sign-in problems,
see the [Quick install troubleshooting instructions](https://docs.lunarpaper.com/self-hosting/install/try-locally/#start-your-local-trial).

## Finish setup and sign in

Open [Lunar Paper setup](http://localhost:3000/setup). Copy the value after
`SETUP_KEY=` in your private `.env`, paste it into **Setup key** and select
**Unlock setup**.

For a fresh trial, select **Initialize databases**. When it finishes, select
**Launch Application** and sign in with the email and password above, or the
ones you chose. You can now [create your first service](https://docs.lunarpaper.com/docs/getting-started/#4-create-your-first-service).

If setup shows existing data or a maintenance screen, follow the
[recovery instructions](https://docs.lunarpaper.com/self-hosting/install/docker-compose/#first-time-setup)
before continuing.

## Stop and return later

From the original starter folder, pause your trial with:

```sh
docker compose --project-name lunarpaper-trial stop
```

To resume, run:

```sh
docker compose --project-name lunarpaper-trial up -d --wait
```

Open [Lunar Paper](http://localhost:3000) and use your original login.
Back up `.env` with your data: it contains your encryption keys. Keep the
original folder, settings and volumes when returning to your trial.

## Shared hosting and maintenance

For a server or shared deployment, follow the full guides and choose private
administrator credentials before first setup:

- [Docker Compose guide](https://docs.lunarpaper.com/self-hosting/install/docker-compose/) — configuration, LAN access and multiple instances.
- [HTTPS guide](https://docs.lunarpaper.com/self-hosting/install/https/) — Caddy and certificate setup.
- [Configuration and secrets](https://docs.lunarpaper.com/self-hosting/configuration/).
- [Backup and restore](https://docs.lunarpaper.com/self-hosting/backup-restore/).
- [Upgrades](https://docs.lunarpaper.com/self-hosting/upgrades/).
- [Remove a local trial](https://docs.lunarpaper.com/self-hosting/install/try-locally/#remove).

The files in this repository support manual deployments: use `compose.yaml`
with exactly one of `compose.http.yaml` or `compose.https.yaml`, and keep your
populated environment file outside the repository. The core file alone
publishes no ports. Keep your selected access file and project name on every
maintenance command. Never use `docker compose down --volumes` during an upgrade.
