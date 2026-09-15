# Security policy

## Report a vulnerability privately

Please do not open a public issue or discussion for a suspected vulnerability.
Email [hello@lunarpaper.com](mailto:hello@lunarpaper.com) with **Security** in the
subject line. Include the affected version, impact and reproduction steps, but do
not include customer data or active credentials.

If a credential may have been exposed, revoke or rotate it immediately through
the service that issued it. Do not send the active value to Lunar Paper.

Please allow time for investigation and a coordinated fix before publishing
details.

## Supported versions

Security fixes are provided through published release images. Use only versions
identified as supported in the release notes, pin an exact version or digest,
and review the notes before upgrading. Public beta releases may change quickly.

## Deployment security

The operator is responsible for host security, network access, TLS, backups and
credential storage. Keep the populated deployment environment outside this
checkout with restrictive file permissions. Never post setup keys, licence keys,
API credentials, database contents or logs containing sensitive data in GitHub
issues or discussions.
