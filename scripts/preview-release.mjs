import { spawn } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertSupportedZeus,
  getZeusInstallation,
  readJson,
  sha256File,
} from './zeus-preview-utils.mjs'

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const appJsonPath = join(projectDirectory, 'app.json')
const distDirectory = join(projectDirectory, 'dist')
const releasesDirectory = join(projectDirectory, 'releases')
const target = process.env.ZEPP_TARGET || '480x480-amazfit-balance-2'

function run(command, args, { passthrough = false } = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: projectDirectory,
      env: process.env,
      stdio: ['inherit', 'pipe', 'pipe'],
    })
    let output = ''

    const collect = (stream, destination) => {
      stream.on('data', (chunk) => {
        const text = chunk.toString()
        output += text

        if (passthrough) {
          destination.write(chunk)
        }
      })
    }

    collect(child.stdout, process.stdout)
    collect(child.stderr, process.stderr)
    child.on('error', rejectPromise)
    child.on('close', (code, signal) => {
      resolvePromise({ code, output, signal })
    })
  })
}

async function runRequired(command, args) {
  const result = await run(command, args)

  if (result.code !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.code}`)
  }

  return result.output.trim()
}

function snapshotZabFiles() {
  const snapshot = new Map()

  if (!existsSync(distDirectory)) {
    return snapshot
  }

  for (const entry of readdirSync(distDirectory, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.zab')) {
      const filePath = join(distDirectory, entry.name)
      snapshot.set(filePath, sha256File(filePath))
    }
  }

  return snapshot
}

function validateVersionName(versionName) {
  if (!/^[0-9A-Za-z][0-9A-Za-z._-]*$/.test(versionName)) {
    throw new Error(`Unsupported app.version.name for a release directory: ${versionName}`)
  }
}

function validateVersionCode(versionCode) {
  if (!existsSync(releasesDirectory)) {
    return
  }

  let greatestReleasedCode = 0

  for (const entry of readdirSync(releasesDirectory, { withFileTypes: true })) {
    const manifestPath = join(releasesDirectory, entry.name, 'release.json')

    if (!entry.isDirectory() || !existsSync(manifestPath)) {
      continue
    }

    const manifest = readJson(manifestPath, `${entry.name}/release.json`)
    const releasedCode = manifest.app?.version?.code

    if (!Number.isInteger(releasedCode) || releasedCode < 1) {
      throw new Error(`Invalid app.version.code in ${manifestPath}`)
    }

    greatestReleasedCode = Math.max(greatestReleasedCode, releasedCode)
  }

  if (versionCode <= greatestReleasedCode) {
    throw new Error(
      `app.version.code must be greater than the latest released code ` +
        `${greatestReleasedCode}; received ${versionCode}.`,
    )
  }
}

async function main() {
  const appConfig = readJson(appJsonPath, 'app.json')
  const app = appConfig.app || {}
  const version = app.version || {}
  const versionName = String(version.name || '')
  const versionCode = version.code

  validateVersionName(versionName)

  if (!Number.isInteger(versionCode) || versionCode < 1) {
    throw new Error('app.version.code must be a positive integer')
  }

  if (!appConfig.targets?.[target]) {
    throw new Error(`Target is not declared in app.json: ${target}`)
  }

  const releaseDirectory = join(releasesDirectory, `v${versionName}`)

  if (existsSync(releaseDirectory)) {
    throw new Error(
      `Release v${versionName} already exists. Update app.version.name and app.version.code first.`,
    )
  }

  validateVersionCode(versionCode)

  const gitStatus = await runRequired('git', [
    'status',
    '--porcelain',
    '--untracked-files=normal',
  ])
  const sourceIsClean = gitStatus.length === 0

  if (!sourceIsClean && process.env.ZEPP_RELEASE_ALLOW_DIRTY !== '1') {
    throw new Error(
      'The working tree is not clean. Commit the source first, or explicitly set ' +
        'ZEPP_RELEASE_ALLOW_DIRTY=1 to archive a non-reproducible source state.',
    )
  }

  const gitCommit = await runRequired('git', ['rev-parse', 'HEAD'])
  const zeus = getZeusInstallation()
  assertSupportedZeus(zeus.version)

  const beforeBuild = snapshotZabFiles()
  const preview = await run(zeus.executable, ['preview', '-t', target], {
    passthrough: true,
  })

  if (preview.code !== 0) {
    const reason = preview.signal
      ? `signal ${preview.signal}`
      : `exit code ${preview.code}`
    throw new Error(`Zeus preview failed with ${reason}`)
  }

  const uploadConfirmed =
    preview.output.includes('Generating preview QR code') &&
    preview.output.includes('This QR code will expire on')

  if (!uploadConfirmed) {
    throw new Error(
      'Zeus did not confirm preview upload and QR generation; no release was archived.',
    )
  }

  const afterBuild = snapshotZabFiles()
  const generatedArtifacts = [...afterBuild.entries()].filter(
    ([filePath, hash]) => beforeBuild.get(filePath) !== hash,
  )

  if (generatedArtifacts.length !== 1) {
    const names = generatedArtifacts.map(([filePath]) => basename(filePath)).join(', ')
    throw new Error(
      `Expected exactly one generated ZAB, found ${generatedArtifacts.length}` +
        (names ? `: ${names}` : ''),
    )
  }

  const [[artifactPath, artifactSha256]] = generatedArtifacts
  const artifactName = basename(artifactPath)
  const artifactSize = statSync(artifactPath).size
  const createdAt = new Date().toISOString()
  const releaseManifest = {
    schemaVersion: 1,
    artifact: {
      file: artifactName,
      sha256: artifactSha256,
      sizeBytes: artifactSize,
    },
    app: {
      id: app.appId,
      name: app.appName,
      type: app.appType,
      version: {
        name: versionName,
        code: versionCode,
      },
    },
    target,
    build: {
      mode: 'preview',
      createdAt,
      zeusCliVersion: zeus.version,
    },
    preview: {
      qrExpiresAfterDays: 7,
    },
    source: {
      gitCommit,
      clean: sourceIsClean,
    },
  }

  mkdirSync(releasesDirectory, { recursive: true })
  const temporaryDirectory = mkdtempSync(
    join(releasesDirectory, `.v${versionName}.tmp-`),
  )
  let archived = false

  try {
    copyFileSync(artifactPath, join(temporaryDirectory, artifactName))
    writeFileSync(
      join(temporaryDirectory, 'release.json'),
      `${JSON.stringify(releaseManifest, null, 2)}\n`,
    )
    writeFileSync(
      join(temporaryDirectory, 'SHA256SUMS'),
      `${artifactSha256}  ${artifactName}\n`,
    )
    renameSync(temporaryDirectory, releaseDirectory)
    archived = true
  } finally {
    if (!archived) {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  }

  console.log('')
  console.log(`Archived exact preview package: ${releaseDirectory}`)
  console.log(`SHA-256: ${artifactSha256}`)
  console.log(`Source commit: ${gitCommit}${sourceIsClean ? '' : ' (dirty)'}`)
  console.log(`Commit releases/v${versionName} to keep this rollback artifact.`)
}

main().catch((error) => {
  console.error(`Preview release failed: ${error.message}`)
  process.exitCode = 1
})
