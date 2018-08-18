# Auto block script for mastodon instances
This script relies on [dzuk-mutant's excellent instance blocklist](https://github.com/dzuk-mutant/blockchain). It pulls the list, parses it, (and skips an entry or two that are malformed), then adds the blocklists via a scripted interaction with the mastodon UI in a hidden browser window.

I know this is a terrible way to do it. I don't like it any more than you do. Unfortunately, though, the mastodon REST api doesn't offer any admin functionality yet and I didn't much feel like trying to figure out the 'authenticity token' field in the formdata from the POSTs; I'd appreciate a PR if you could do that so I could package this up cleaner as a small docker container.

# Requirements
- modern nodeJS (tested with 10, no guarantees about anything older)
- npm

# Installation
- clone this repo
- `cd mastoblock && npm install`
- `MASTO_EMAIL=<admin or mod user> MASTO_PASSWORD=<your masto password> MASTO_URL=<your instances url including https:// and no trailing slash> node index.js`

It will take a while. I had to do this in the *silliest* way possible because of the missing API methods, so be patient.

The script notices domain blocks you already have and doesn't try to re-add them, so it won't mess with any existing domain blocks. If it fails or errors because of a network timeout or something, it is safe to run again.

Good luck and don't be afraid to DM me if something goes sideways, i'm happy to help debug. get me @jabyrd3@masto.dev.host if you got a problem, or you can file an issue or PR.
