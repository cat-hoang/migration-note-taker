import coreWebVitalsConfig from 'eslint-config-next/core-web-vitals'
import typescriptConfig from 'eslint-config-next/typescript'

const config = [...coreWebVitalsConfig, ...typescriptConfig]

export default config
