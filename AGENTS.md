# Contributor guidance

Everything in this repository is public and customer-facing.

- Make future changes on the `preview` branch and open a pull request into
  `main`. Do not push content updates directly to `main`.
- Treat `main` as the approved public state. Changes require review from the
  code owner in `.github/CODEOWNERS` before merging when branch protection is
  available.
- Never add credentials, API keys, tokens, passwords, private keys, populated
  environment files, backups, logs, database dumps or customer data.
- Keep required values blank in `.env.example`; examples must use unmistakably
  nonfunctional placeholders or reserved `.invalid` domains.
- Keep customer configuration and operational documentation here. Application
  source, database migrations and generated database artifacts do not belong in
  this repository.
- Preserve the single-server Compose model, private backend networks, separate
  database runtime/owner credentials, application-owned initialization and explicit web
  setup.
- Validate both HTTP and HTTPS Compose variants without starting containers and
  without writing synthetic credentials to this repository.
- Do not publish, deploy or promote an image as part of a documentation change.
