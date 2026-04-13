#!/usr/bin/env tsx

/**
 * 配置初始化脚本
 *
 * 用法:
 *   npx tsx scripts/init-config.ts
 *   或
 *   npm run report:init
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';

// 配置文件路径
const CONFIG_DIR = path.join(os.homedir(), '.weekly-report');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

interface Config {
  github: {
    token: string;
    username: string;
  };
  anthropic: {
    apiKey: string;
    model?: string;
  };
  repositories: string[];
  outputDirectory: string;
}

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 封装问题输入
function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

// 验证 GitHub token 格式
function validateGitHubToken(token: string): boolean {
  return token.startsWith('ghp_') || token.startsWith('github_pat_');
}

// 验证 Anthropic API key 格式
function validateAnthropicKey(key: string): boolean {
  return key.startsWith('sk-ant-');
}

// 验证仓库格式
function validateRepository(repo: string): boolean {
  return /^[\w-]+\/[\w-]+$/.test(repo);
}

// 主函数
async function main() {
  console.log('🚀 周报配置初始化向导\n');

  // 检查配置是否已存在
  if (fs.existsSync(CONFIG_PATH)) {
    const overwrite = await question('⚠️  配置文件已存在，是否覆盖？(y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('已取消');
      rl.close();
      process.exit(0);
    }
    console.log('');
  }

  // 1. GitHub Personal Access Token
  console.log('📌 GitHub 配置');
  console.log('   提示：在 https://github.com/settings/tokens 生成 token');
  console.log('   需要权限：repo (访问私有仓库)');
  console.log('');

  let githubToken = '';
  while (!githubToken) {
    const token = await question('   GitHub Token (ghp_xxxx): ');
    if (!token) {
      console.log('   ❌ Token 不能为空\n');
      continue;
    }
    if (!validateGitHubToken(token)) {
      console.log('   ⚠️  Token 格式可能不正确（应该以 ghp_ 或 github_pat_ 开头）');
      const proceed = await question('   是否继续？(y/N): ');
      if (proceed.toLowerCase() !== 'y') {
        continue;
      }
    }
    githubToken = token;
  }

  // 2. GitHub 用户名
  let githubUsername = '';
  while (!githubUsername) {
    const username = await question('   GitHub 用户名: ');
    if (!username) {
      console.log('   ❌ 用户名不能为空\n');
      continue;
    }
    githubUsername = username;
  }

  console.log('');

  // 3. Anthropic API Key
  console.log('📌 Anthropic 配置');
  console.log('   提示：在 https://console.anthropic.com/ 获取 API key');
  console.log('');

  let anthropicKey = '';
  while (!anthropicKey) {
    const key = await question('   Anthropic API Key (sk-ant-xxxx): ');
    if (!key) {
      console.log('   ❌ API Key 不能为空\n');
      continue;
    }
    if (!validateAnthropicKey(key)) {
      console.log('   ⚠️  API Key 格式可能不正确（应该以 sk-ant- 开头）');
      const proceed = await question('   是否继续？(y/N): ');
      if (proceed.toLowerCase() !== 'y') {
        continue;
      }
    }
    anthropicKey = key;
  }

  // 4. Anthropic 模型（可选）
  const anthropicModel = await question('   Claude 模型名称 (留空使用默认 claude-3-5-sonnet-20241022): ');

  console.log('');

  // 5. 仓库列表
  console.log('📌 仓库配置');
  console.log('   格式：owner/repo，多个仓库用逗号分隔');
  console.log('   例如：hqc-png/Graduation-design,hqc-png/mempalace');
  console.log('');

  let repositories: string[] = [];
  while (repositories.length === 0) {
    const reposInput = await question('   仓库列表: ');
    if (!reposInput) {
      console.log('   ❌ 至少需要一个仓库\n');
      continue;
    }

    const repoList = reposInput.split(',').map((r) => r.trim()).filter(Boolean);
    const invalidRepos = repoList.filter((r) => !validateRepository(r));

    if (invalidRepos.length > 0) {
      console.log(`   ❌ 以下仓库格式不正确: ${invalidRepos.join(', ')}`);
      console.log('   格式应为: owner/repo\n');
      continue;
    }

    repositories = repoList;
  }

  console.log('');

  // 6. 输出目录
  console.log('📌 输出配置');
  const defaultOutputDir = path.join(os.homedir(), 'Desktop', 'WeeklyReports');
  const outputDirInput = await question(`   输出目录 (默认: ${defaultOutputDir}): `);
  const outputDirectory = outputDirInput || defaultOutputDir;

  console.log('');

  // 构建配置对象
  const config: Config = {
    github: {
      token: githubToken,
      username: githubUsername,
    },
    anthropic: {
      apiKey: anthropicKey,
      ...(anthropicModel && { model: anthropicModel }),
    },
    repositories,
    outputDirectory,
  };

  // 创建配置目录
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // 保存配置
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

    // Windows 不支持 chmod，跳过权限设置
    if (process.platform !== 'win32') {
      fs.chmodSync(CONFIG_PATH, 0o600); // 仅所有者可读写
    }

    console.log('✅ 配置保存成功！\n');
    console.log(`📄 配置文件位置: ${CONFIG_PATH}\n`);
    console.log('📊 配置摘要:');
    console.log(`   GitHub 用户: ${config.github.username}`);
    console.log(`   仓库数量: ${config.repositories.length}`);
    console.log(`   输出目录: ${config.outputDirectory}\n`);
    console.log('🎉 现在可以运行 npm run report 生成周报了！');
  } catch (error: any) {
    console.error('❌ 保存配置文件失败:', error.message);
    process.exit(1);
  }

  rl.close();
}

// 运行
main().catch((error) => {
  console.error('❌ 发生错误:', error);
  rl.close();
  process.exit(1);
});
