# Contributor guidance

Everything in this repository is public and customer-facing.

- Never add credentials, API keys, tokens, passwords, private keys, populated
  environment files, backups, logs, database dumps or customer data.
- Keep required values blank in `.env.example`; examples must use unmistakably
  nonfunctional placeholders or reserved `.invalid` domains.
- Keep customer configuration and operational documentation here. Application
  source, database migrations and generated database artifacts do not belong in
  this repository.
- Preserve the single-server Compose model, private backend networks, separate
  database runtime/owner credentials, image-matched bootstrap and explicit web
  setup.
- Validate both HTTP and HTTPS Compose variants without starting containers and
  without writing synthetic credentials to this repository.
- Do not publish, deploy or promote an image as part of a documentation change.
