# omp-ulw

[English](README.md) | [한국어](README.ko.md) | 简体中文

面向 [Oh My Pi (OMP)](https://github.com/can1357/oh-my-pi) 的模型专用提示词和原生 ULW 工作流扩展。它提供会话级 ULW 启用、规划、执行、研究及专业技能；通用执行和工具策略由 OMP 负责。

## 快速开始

安装 OMP 后运行：

```bash
git clone https://github.com/dbc-hbin/omp-ulw.git
omp -e ./omp-ulw/index.ts
```

在交互式 TUI 中，使用 `/ulw <任务>`、`ulw <任务>` 或 `/goal ulw <任务>` 同时启用 ULW 和原生目标。已有目标不会被替换。RPC 客户端须单独创建原生目标；`/goal` 是 TUI 命令。

## 工作流

| 命令 | 用途 | 默认 OMP 关键词 |
| --- | --- | --- |
| `/ulw` | 为当前会话启用 ULW | — |
| `/ulw-plan` | 创建经过审查、可执行的计划，不进行实现 | `ultrathink` |
| `/ulw-execute` | 执行并跟踪计划 | `orchestrate` |
| `/ulw-loop` | 跟踪多个目标、依赖和证据 | `orchestrate` |
| `/mass-ulw` | 执行持久化依赖图 | `workflowz` |
| `/ulw-research` | 记录来源、观察和反证的研究 | `workflowz` |

通过 TUI 或 RPC `prompt` 输入专业命令时，若未指定原生关键词，扩展会添加默认关键词，并遵守 OMP 的关键词设置和工具要求。RPC `steer` 和 `follow_up` 请求会跳过原生关键词处理；请改用带相应 `streamingBehavior` 的 `prompt` 请求。直接调用 `/skill:` 以及绕过输入钩子的初始 CLI 文本需要显式指定关键词。

其他技能包括 `debugging`、`programming`、`review-work`、`visual-qa`、`frontend`、`ast-grep`、`lsp-setup` 和 `refactor`。普通 ULW 不会自动启用专业工作流。

## 模型提示词

- [`upstream/presets.js`](upstream/presets.js)：生成的上游模型预设和选择规则。
- [`presets.ts`](presets.ts)：将提示词适配到 OMP 的工具和异步契约。
- [`index.ts`](index.ts)：为主会话和受支持的子代理会话应用提示词。
- [`upstream/update.mjs`](upstream/update.mjs)：从固定的上游版本更新预设。
- [`upstream/omp-build.mjs`](upstream/omp-build.mjs)：避免重复注入 OMP 已提供的内容。

子代理使用各自选择的模型和可用工具。自定义或无法识别的系统模板保持不变；不受支持的模型保留 OMP 默认角色。更改已安装的扩展后，请重启 OMP。

## 更新预设

需要 Bun。更新时需要网络连接，正常运行 OMP 时不需要。

```bash
# 指定标签、提交 SHA 或分支
bun upstream/update.mjs --ref v2026.10.13

# 只检查更改，不更新
bun upstream/update.mjs --ref main --check

# 更新并测试
bun upstream/update.mjs --ref main
bun test
```

更新器会先将 ref 解析为提交 SHA，仅在验证成功后替换生成的预设文件。`--check` 在没有更改时返回 0，在发现更改或发生错误时返回 1。遇到 GitHub API 限流时可使用 `GITHUB_TOKEN`。更新不会覆盖本地适配代码或技能。

## 测试

```bash
bun test

# 使用本地 provider 验证已安装的 OMP 宿主路径
bun tests/ulw-host-check.ts
bun tests/ulw-goal-host-check.ts
bun tests/child-preset-host-check.ts
```

## 更新历史与来源

- [更新历史](CHANGELOG.md)
- 上游来源和许可证见 `upstream/` 及各技能目录。
