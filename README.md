# Branch note:

This repository keeps a copy of the changes from a PR that enables fido2
support on the mac build synced with the most recent changes on the official repo.

based on https://github.com/bitwarden/clients/pull/6375

To build run:
```
cd apps/desktop/
npm run pack:mac
```

If you have any errors on the notorizing step it is no issue , as your dmg is already available at:
`$PROJECT_ROOT$/apps/desktop/dist/mac-universal/Bitwarden.app`
All you got to do is copy to `/Applications/`

IMPORTANT: I Am not a javascript developer, I am not familiar with electron , I just did some small changes and glued everything together so I was able to use the changes from the original PR locally, and I figured many would like to do the same. Use this AT YOUR OWN RISK.
-------

<p align="center">
  <img src="https://raw.githubusercontent.com/bitwarden/brand/master/screenshots/apps-combo-logo.png" alt="Bitwarden" />
</p>
<p align="center">
  <a href="https://github.com/bitwarden/clients/actions/workflows/build-browser.yml?query=branch:master" target="_blank">
    <img src="https://github.com/bitwarden/clients/actions/workflows/build-browser.yml/badge.svg?branch=master" alt="Github Workflow browser build on master" />
  </a>
  <a href="https://github.com/bitwarden/clients/actions/workflows/build-cli.yml?query=branch:master" target="_blank">
    <img src="https://github.com/bitwarden/clients/actions/workflows/build-cli.yml/badge.svg?branch=master" alt="Github Workflow CLI build on master" />
  </a>
  <a href="https://github.com/bitwarden/clients/actions/workflows/build-desktop.yml?query=branch:master" target="_blank">
    <img src="https://github.com/bitwarden/clients/actions/workflows/build-desktop.yml/badge.svg?branch=master" alt="Github Workflow desktop build on master" />
  </a>
    <a href="https://github.com/bitwarden/clients/actions/workflows/build-web.yml?query=branch:master" target="_blank">
    <img src="https://github.com/bitwarden/clients/actions/workflows/build-web.yml/badge.svg?branch=master" alt="Github Workflow web build on master" />
  </a>
  <a href="https://gitter.im/bitwarden/Lobby" target="_blank">
    <img src="https://badges.gitter.im/bitwarden/Lobby.svg" alt="gitter chat" />
  </a>
</p>

---

# Bitwarden Client Applications

This repository houses all Bitwarden client applications except the [Mobile application](https://github.com/bitwarden/mobile).

Please refer to the [Clients section](https://contributing.bitwarden.com/getting-started/clients/) of the [Contributing Documentation](https://contributing.bitwarden.com/) for build instructions, recommended tooling, code style tips, and lots of other great information to get you started.

## Related projects:

- [bitwarden/server](https://github.com/bitwarden/server): The core infrastructure backend (API, database, Docker, etc).
- [bitwarden/mobile](https://github.com/bitwarden/mobile): The mobile app vault (iOS and Android).
- [bitwarden/directory-connector](https://github.com/bitwarden/directory-connector): A tool for syncing a directory (AD, LDAP, Azure, G Suite, Okta) to an organization.

# We're Hiring!

Interested in contributing in a big way? Consider joining our team! We're hiring for many positions. Please take a look at our [Careers page](https://bitwarden.com/careers/) to see what opportunities are [currently open](https://bitwarden.com/careers/#open-positions) as well as what it's like to work at Bitwarden.

# Contribute

Code contributions are welcome! Please commit any pull requests against the `master` branch. Learn more about how to contribute by reading the [Contributing Guidelines](https://contributing.bitwarden.com/contributing/). Check out the [Contributing Documentation](https://contributing.bitwarden.com/) for how to get started with your first contribution.

Security audits and feedback are welcome. Please open an issue or email us privately if the report is sensitive in nature. You can read our security policy in the [`SECURITY.md`](SECURITY.md) file.
