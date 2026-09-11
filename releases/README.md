# Preview releases

`npm run preview` builds, uploads, and archives the exact preview `.zab` under
`releases/v<app.version.name>/`. Each immutable release contains the package,
`release.json`, and `SHA256SUMS`.

Commit the source first, then run the preview and commit its generated release
directory. A version cannot be archived twice; update both `app.version.name`
and `app.version.code` before creating the next release. The numeric version
code must be greater than every archived release code. For an exceptional dirty-
tree build, set `ZEPP_RELEASE_ALLOW_DIRTY=1`; the manifest will mark that the
source state was not reproducible from its recorded commit.

To upload a preserved package again without rebuilding it, run:

```sh
npm run preview:zab -- releases/v1.0.1/<package>.zab
```

The uploader verifies `release.json` when it is present. QR URLs and Zeus login
credentials are never written to the repository.
