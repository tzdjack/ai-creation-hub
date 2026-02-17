/**
 * Coze 平台环境变量加载工具
 * 用于从 Coze 工作负载身份中获取项目环境变量
 */

let envLoaded = false;

/**
 * 从 Coze 平台加载环境变量
 */
export function loadCozeEnvVars(): void {
  if (envLoaded) {
    return;
  }

  try {
    const { execSync } = require('child_process');

    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;

    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        // 移除引号
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        // 只设置未存在的环境变量，避免覆盖 process.env
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }

    envLoaded = true;
    console.log('[CozeEnv] Environment variables loaded from Coze platform');
  } catch (error) {
    console.warn('[CozeEnv] Failed to load environment variables from Coze platform:', error);
    // 静默失败，允许回退到 .env 文件
  }
}

/**
 * 获取环境变量（优先从 Coze 平台加载）
 */
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  loadCozeEnvVars();
  return process.env[key] || defaultValue;
}

/**
 * 检查是否在 Coze 平台上运行
 */
export function isCozePlatform(): boolean {
  return !!process.env.COZE_WORKSPACE_PATH;
}
