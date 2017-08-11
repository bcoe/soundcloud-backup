# SoundCloud Backup

Backup your SoundCloud accounts's meta information.

## Usage

1. `npm i soundcloud-backup -g`
2. fetch your `client_id` by logging into SoundCloud and viewing the page
  in a web-inspector. The `client_id` will be populated in XHR calls.
3. run `soundcloud-backup --client-id=<your-client-id> --user=<soundcloud-user-name>`
