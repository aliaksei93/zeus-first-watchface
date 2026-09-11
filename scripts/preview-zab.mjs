import { createRequire } from 'node:module'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertSupportedZeus,
  getZeusInstallation,
  readJson,
  sha256File,
} from './zeus-preview-utils.mjs'

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function getFormLength(form) {
  return new Promise((resolvePromise, rejectPromise) => {
    form.getLength((error, length) => {
      if (error) {
        rejectPromise(error)
        return
      }

      resolvePromise(length)
    })
  })
}

function readAndVerifyReleaseManifest(artifactPath, artifactSha256) {
  const manifestPath = join(dirname(artifactPath), 'release.json')

  if (!existsSync(manifestPath)) {
    return null
  }

  const manifest = readJson(manifestPath, 'release.json')

  if (manifest.schemaVersion !== 1) {
    throw new Error(`Unsupported release manifest schema: ${manifest.schemaVersion}`)
  }

  if (manifest.artifact?.file !== basename(artifactPath)) {
    throw new Error('release.json points to a different artifact')
  }

  if (manifest.artifact?.sha256 !== artifactSha256) {
    throw new Error('ZAB checksum does not match release.json')
  }

  if (manifest.artifact?.sizeBytes !== statSync(artifactPath).size) {
    throw new Error('ZAB size does not match release.json')
  }

  return manifest
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length !== 1) {
    throw new Error('Usage: npm run preview:zab -- <path-to-release.zab>')
  }

  const artifactPath = resolve(projectDirectory, args[0])

  if (!existsSync(artifactPath) || !statSync(artifactPath).isFile()) {
    throw new Error(`ZAB file does not exist: ${artifactPath}`)
  }

  if (extname(artifactPath).toLowerCase() !== '.zab') {
    throw new Error(`Expected a .zab file: ${artifactPath}`)
  }

  const artifactSha256 = sha256File(artifactPath)
  const manifest = readAndVerifyReleaseManifest(artifactPath, artifactSha256)
  const appConfig = readJson(join(projectDirectory, 'app.json'), 'app.json')
  const appType = manifest?.app?.type || appConfig.app?.appType

  if (appType !== 'watchface') {
    throw new Error(`Unsupported app type for this repository: ${appType}`)
  }

  if (!manifest) {
    console.warn('Warning: release.json was not found; uploading an unverified ZAB.')
  }

  const zeus = getZeusInstallation()
  assertSupportedZeus(zeus.version)
  const zeusRequire = createRequire(join(zeus.root, 'package.json'))
  const FormData = zeusRequire('form-data')
  const qrcode = zeusRequire('qrcode-terminal')
  const zeppUtils = zeusRequire(
    './private-modules/zeppos-app-utils/dist/index.js',
  )
  const localConfig = zeppUtils.config.getLocalConfig()
  const loginKeys = localConfig.loginStorageKey
  const storage = zeppUtils.instanceStorage.getStorage()
  const appToken = storage[loginKeys.accountToken] || ''
  const userId = storage[loginKeys.userid] || ''
  const cname = storage[loginKeys.cname] || ''
  const apiHost = String(cname)
    .split(',')
    .find((host) => host.includes('api-mifit'))

  if (!appToken || !userId || !apiHost) {
    throw new Error('Zeus CLI is not logged in. Run `zeus login`, then retry.')
  }

  Object.assign(process.env, {
    _loginAppToken: appToken,
    _loginUserId: userId,
    _loginCname: cname,
    _subRegionalHost: apiHost,
  })

  const form = new FormData()
  form.append('file', createReadStream(artifactPath))
  form.append('app_type', '1')
  const length = await getFormLength(form)

  console.log(`Uploading preserved ZAB without rebuilding: ${artifactPath}`)
  console.log(`SHA-256: ${artifactSha256}`)
  console.log(`Zeus CLI: ${zeus.version}`)

  let uploadResult

  try {
    uploadResult = await zeppUtils.api.uploadPackage(form, length)
  } catch (error) {
    if (error.message === '401') {
      throw new Error('Zeus login expired. Run `zeus login`, then retry.')
    }

    throw error
  }

  const { protocol, code } = uploadResult || {}

  if (!protocol || !code) {
    throw new Error('Zeus upload did not return a preview download code')
  }

  const previewUrl = `${protocol}://${apiHost}/custom/tools/app-dial/download/${code}`
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  console.log('Generating preview QR code...')
  console.log('Use Zepp App Developer Mode to install this exact ZAB.')
  console.log(`This QR code will expire around ${expiresAt.toISOString()}.`)
  qrcode.generate(previewUrl, { small: true })
}

main().catch((error) => {
  console.error(`ZAB preview failed: ${error.message}`)
  process.exitCode = 1
})
