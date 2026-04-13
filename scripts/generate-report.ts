#!/usr/bin/env tsx

/**
 * 周报生成脚本 (TypeScript)
 *
 * 用法:
 *   npx tsx scripts/generate-report.ts              # 生成当前周报告
 *   npx tsx scripts/generate-report.ts --week last  # 生成上周报告
 *   npx tsx scripts/generate-report.ts --since 2026-04-01 --until 2026-04-07
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fetchUserCommits } from '../src/lib/github';
import { summarizeCommits } from '../src/lib/claude';
import { getCurrentWeekRange } from '../src/lib/date-utils';
import { startOfWeek, endOfWeek, subWeeks, parseISO, format } from 'date-fns';

// 配置文件路径
const CONFIG_PATH = path.join(os.homedir(), '.weekly-report', 'config.json');

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

// 加载配置
function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('❌ 配置文件不存在！');
    console.error('请先运行: npm run report:init');
    process.exit(1);
  }

  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('❌ 配置文件格式错误:', error);
    process.exit(1);
  }
}

// 解析日期范围
function parseDateRange(args: string[]): { since: string; until: string } {
  const weekIndex = args.indexOf('--week');
  const sinceIndex = args.indexOf('--since');
  const untilIndex = args.indexOf('--until');

  // 自定义日期范围
  if (sinceIndex !== -1 && untilIndex !== -1) {
    const since = args[sinceIndex + 1];
    const until = args[untilIndex + 1];

    if (!since || !until) {
      console.error('❌ --since 和 --until 参数缺失');
      process.exit(1);
    }

    try {
      const sinceDate = parseISO(since);
      const untilDate = parseISO(until);

      return {
        since: sinceDate.toISOString(),
        until: untilDate.toISOString(),
      };
    } catch (error) {
      console.error('❌ 日期格式错误，请使用 YYYY-MM-DD 格式');
      process.exit(1);
    }
  }

  // 上周
  if (weekIndex !== -1 && args[weekIndex + 1] === 'last') {
    const lastWeekDate = subWeeks(new Date(), 1);
    const start = startOfWeek(lastWeekDate, { weekStartsOn: 1 });
    const end = endOfWeek(lastWeekDate, { weekStartsOn: 1 });

    return {
      since: start.toISOString(),
      until: end.toISOString(),
    };
  }

  // 默认：当前周
  const currentWeek = getCurrentWeekRange();
  return {
    since: currentWeek.start,
    until: currentWeek.end,
  };
}

// 格式化日期用于文件名
function formatDateForFilename(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// 主函数
async function main() {
  console.log('📝 周报生成器\n');

  // 1. 加载配置
  console.log('📂 加载配置...');
  const config = loadConfig();
  console.log(`   仓库数量: ${config.repositories.length}`);
  console.log(`   输出目录: ${config.outputDirectory}\n`);

  // 2. 解析日期范围
  const args = process.argv.slice(2);
  const { since, until } = parseDateRange(args);
  const sinceDate = new Date(since);
  const untilDate = new Date(until);

  console.log(`📅 日期范围: ${format(sinceDate, 'yyyy-MM-dd')} 至 ${format(untilDate, 'yyyy-MM-dd')}\n`);

  // 3. 设置环境变量（供 lib 函数使用）
  process.env.ANTHROPIC_API_KEY = config.anthropic.apiKey;
  if (config.anthropic.model) {
    process.env.ANTHROPIC_MODEL = config.anthropic.model;
  }

  // 4. 获取提交记录
  console.log('🔍 获取 GitHub 提交记录...');
  let commits;
  try {
    commits = await fetchUserCommits(
      config.github.token,
      config.github.username,
      config.repositories,
      since,
      until
    );
    console.log(`   找到 ${commits.length} 个提交\n`);
  } catch (error: any) {
    console.error('❌ 获取提交记录失败:', error.message);
    process.exit(1);
  }

  // 5. 检查空提交
  if (commits.length === 0) {
    console.log('ℹ️  该时间段内没有找到提交记录');
    console.log('提示：检查日期范围和仓库配置是否正确');
    process.exit(0);
  }

  // 6. Claude API 总结
  console.log('🤖 使用 Claude AI 生成总结...');
  let markdown;
  try {
    const result = await summarizeCommits(commits, { start: since, end: until });
    markdown = result.markdown;
    console.log('   ✓ 总结生成成功\n');
  } catch (error: any) {
    console.error('❌ AI 总结失败:', error.message);
    process.exit(1);
  }

  // 7. 保存文件
  console.log('💾 保存报告...');

  // 确保输出目录存在
  if (!fs.existsSync(config.outputDirectory)) {
    fs.mkdirSync(config.outputDirectory, { recursive: true });
  }

  // 生成文件名
  const filename = `weekly-report-${formatDateForFilename(sinceDate)}-to-${formatDateForFilename(untilDate)}.md`;
  const outputPath = path.join(config.outputDirectory, filename);

  // 生成完整的 Markdown 内容
  const fullMarkdown = `# 周报 (${format(sinceDate, 'yyyy-MM-dd')} 至 ${format(untilDate, 'yyyy-MM-dd')})

**生成时间**: ${new Date().toLocaleString('zh-CN')}
**提交数量**: ${commits.length}
**仓库**: ${config.repositories.join(', ')}

---

${markdown}
`;

  // 保存文件
  try {
    fs.writeFileSync(outputPath, fullMarkdown, 'utf-8');
    console.log(`   ✓ 报告已保存\n`);
  } catch (error: any) {
    console.error('❌ 保存文件失败:', error.message);
    process.exit(1);
  }

  // 8. 显示结果
  console.log('✅ 周报生成完成！\n');
  console.log(`📄 文件位置: ${outputPath}`);
  console.log(`📊 提交数量: ${commits.length}`);
  console.log(`📅 日期范围: ${format(sinceDate, 'yyyy-MM-dd')} 至 ${format(untilDate, 'yyyy-MM-dd')}`);
}

// 运行
main().catch((error) => {
  console.error('❌ 发生错误:', error);
  process.exit(1);
});
