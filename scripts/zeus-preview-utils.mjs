import { accessSync, constants, existsSync, readFileSync, realpathSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { delimiter, dirname, join, resolve } from 'node:path'

export const SUPPORTED_ZEUS_CLI_VERSION = '1.9.3'

export function readJson(filePath, label = filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`Cannot read ${label}: ${error.message}`)
  }
}

function findExecutable(command) {
  if (command.includes('/')) {
    const absolutePath = resolve(command)
    accessSync(absolutePath, constants.X_OK)
    return absolutePath
  }

  for (const pathEntry of (process.env.PATH || '').split(delimiter)) {
    const candidate = join(pathEntry || process.cwd(), command)

    try {
      accessSync(candidate, constants.X_OK)
      return candidate
    } catch {
      // Continue searching PATH.
    }
  }

  throw new Error(`Required command is not available: ${command}`)
}

function findZeusRoot(executablePath) {
  let currentDirectory = dirname(realpathSync(executablePath))

  for (let depth = 0; depth < 6; depth += 1) {
    const packagePath = join(currentDirectory, 'package.json')

    if (existsSync(packagePath)) {
      const packageJson = readJson(packagePath, 'Zeus CLI package.json')

      if (packageJson.name === '@zeppos/zeus-cli') {
        return currentDirectory
      }
    }

    const parentDirectory = dirname(currentDirectory)

    if (parentDirectory === currentDirectory) {
      break
    }

    currentDirectory = parentDirectory
  }

  throw new Error(`Cannot locate @zeppos/zeus-cli from ${executablePath}`)
}

export function getZeusInstallation() {
  const executable = findExecutable(process.env.ZEUS_BIN || 'zeus')
  const root = process.env.ZEUS_CLI_ROOT
    ? resolve(process.env.ZEUS_CLI_ROOT)
    : findZeusRoot(executable)
  const packagePath = join(root, 'package.json')
  const packageJson = readJson(packagePath, 'Zeus CLI package.json')

  if (packageJson.name !== '@zeppos/zeus-cli') {
    throw new Error(`Not a Zeus CLI installation: ${root}`)
  }

  return {
    executable,
    root,
    version: packageJson.version,
  }
}

export function assertSupportedZeus(version) {
  if (version !== SUPPORTED_ZEUS_CLI_VERSION) {
    throw new Error(
      `Unsupported Zeus CLI ${version}. Expected ${SUPPORTED_ZEUS_CLI_VERSION}; ` +
        'review the private preview upload API before changing this pin.',
    )
  }
}

export function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}
