# omp-superkit

[English](README.md) | [한국어](README.ko.md) | 简体中文

面向 [Oh My Pi (OMP)](https://github.com/can1357/oh-my-pi) 的模型提示词、代码模式和原生 ULW 工作流扩展。工具、权限和执行仍由 OMP 管理；扩展适配模型的工作方式，并提供规划、研究及专业技能。

## 快速开始

安装 Git、Bun 和 OMP 后运行：

```bash
git clone --recurse-submodules https://github.com/dbc-hbin/omp-superkit.git
bun ./omp-superkit/upstream/materialize-frontend-refs.mjs
omp -e ./omp-superkit
```

在交互式 TUI 中输入 `/ulw <任务>` 或 `ulw <任务>`，即可启用 ULW 和原生目标。已有目标（包括暂停或达到预算限制的目标）保持不变。RPC 客户端须单独创建原生目标。

命令必须位于输入开头；`Explain /ulw` 等提及不会启用工作流。普通 ULW 不会自动启用专业工作流。修改已安装的扩展后，请重启 OMP。

## 工作流与技能

| 命令 | 用途 | 默认 OMP 关键词 |
| --- | --- | --- |
| `/ulw` | 为当前会话启用 ULW | — |
| `/ulw-plan` | 创建经过审查的计划，不进行实现 | `ultrathink` |
| `/ulw-execute` | 执行并跟踪计划 | `orchestrate` |
| `/ulw-loop` | 跟踪目标、依赖和证据 | `orchestrate` |
| `/mass-ulw` | 执行持久化依赖图 | `workflowz` |
| `/ulw-research` | 包含来源与反证的研究 | `workflowz` |

专业命令会在尚未指定关键词时添加默认关键词，并遵守 OMP 的关键词设置与工具要求。RPC 请使用带相应 `streamingBehavior` 的 `prompt`；独立的 `steer` 和 `follow_up` 请求会跳过关键词处理。直接调用 `/skill:` 或使用绕过输入钩子的初始 CLI 文本时，需要显式指定关键词。

其他入口：

- **代码与审查：** `/debugging`、`/programming`、`/review-work`、`/ast-grep`、`/lsp-setup`、`/refactor`
- **UI 与评估：** `/frontend`、`/visual-qa`、`/visualize`、`/data-scientist`、`/eval-integrity`
- **浏览器与桌面：** `/web-browser`、`/ultimate-browsing`、`/computer-use` 使用 OMP 的原生 Eval API 和权限；OMP 自带的 `/browser`、`/computer` 控制保持不变。
- **会话与记忆：** `/coding-agent-sessions`、`/init-deep`、`/reflection`、`/memory-advisor`

详细说明见 [skills/](skills/)。跨产品会话发现需要 Python 3.11+；OMP 会话历史和摘要使用原生 Eval `archive` 查看。

## 提示词与代码模式

受支持的模型提示词会适配到 OMP，并分别应用于主会话和受支持的子会话。专业角色、项目指令、权限与完成协议保持不变。自定义模板和不受支持的模型保留原生行为。明确的调查或仅规划请求会暂时抑制 prewalk；转入实现时，只恢复本扩展拥有的 override。

所有 Gemini 模型均使用适配 OMP 的 AGY（Antigravity CLI）提示词，并保留原生工具的直接调用。其他模型依据请求能力启用代码模式：

- 普通工作工具不再直接暴露 schema，而是在原生 JavaScript eval 中提供 `tool.<name>(args)` 调用说明。
- 会话控制、`write`、`apply_patch`、bridge 保留名称（`defined`、`undefine`）、无法映射的工具及强制选择的工具保持直接调用。
- 独立的读取、搜索和查询并行执行。代码模式使用 `Promise.allSettled`；修改、审批、等待和有依赖的调用顺序执行。
- 需要已启用且支持 JavaScript 的 eval，以及受支持的 provider 请求 hook。不会给受限代理增加工具或权限；不支持的请求保持原样并发出提示。

Kiro、Cursor Agent、GitLab Duo Agent 和 Apple Foundation Models 的请求 hook 存在限制，无法保证在这些路径上应用代码模式。目录缓存按会话隔离，并跟随当前工具元数据。**代码模式是面向模型的调用策略，不是执行安全边界。**

实现位置：[模型适配](presets.ts)、[代码模式](code-mode.ts)、[会话集成](index.ts)、[原生指令](host-guidance.ts)。

## 更新与测试

更新仓库后，从固定版本的子模块重新生成前端参考：

```bash
git submodule update --init --recursive
bun upstream/materialize-frontend-refs.mjs
```

GitHub 源码压缩包不包含子模块和生成的参考文件。无需 Git 的部署应复制生成后的完整 `skills/` 目录。初始化和上游更新需要网络；参考生成在本地完成。

更新模型预设：

```bash
bun upstream/update.mjs --ref main --check
bun upstream/update.mjs --ref main
```

`--ref` 接受分支、标签或提交 SHA。更新器验证成功后才替换生成的预设，不覆盖本地适配代码或技能。`--check` 在没有更改时返回 0，发现更改或错误时返回 1；遇到 API 限流时可使用 `GITHUB_TOKEN`。

```bash
bun test
bun run typecheck
bun run test:host
```

宿主检查在隔离状态下使用已安装的 OMP 和脚本化本地 provider，验证集成与传输路径，而非外部模型是否遵循指令。

## 更新历史与来源

[更新历史](CHANGELOG.md)。上游版本、来源和许可证保留在 [upstream/](upstream/) 及各技能的 attribution 文件中。
