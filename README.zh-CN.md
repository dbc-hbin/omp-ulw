# omp-ulw

[English](README.md) | [한국어](README.ko.md) | 简体中文

面向 [Oh My Pi (OMP)](https://github.com/can1357/oh-my-pi) 的模型专用提示词和原生 ULW 工作流扩展。模型预设负责工作方式，OMP 保留工具协议、权限与原生模式功能；扩展还提供会话级 ULW 启用、规划、执行、研究及专业技能。

## 快速开始

安装 Git、Bun 和 OMP 后运行：

```bash
git clone --recurse-submodules https://github.com/dbc-hbin/omp-ulw.git
bun ./omp-ulw/upstream/materialize-frontend-refs.mjs
omp -e ./omp-ulw/index.ts
```

在交互式 TUI 中，使用 `/ulw <任务>`、`ulw <任务>` 或 `/goal ulw <任务>` 同时启用 ULW 和原生目标。已有目标不会被替换。RPC 客户端须单独创建原生目标；`/goal` 是 TUI 命令。

命令或别名必须位于输入开头，可带前导空白。`Explain ulw`、`Explain /ulw` 等讨论不会启用工作流。暂停或达到预算限制的现有目标也保留所有权。

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

其他技能包括 `debugging`、`programming`、`review-work`、`eval-integrity`、`visual-qa`、`frontend`、`ast-grep`、`lsp-setup` 和 `refactor`。`/eval-integrity` 以只读方式检查基准、A/B 和 LLM 评判的独立性与有效性，不修改评估输入。普通 ULW 不会自动启用专业工作流。

`/web-browser` 加载 `browser` 技能，使用 OMP Eval 的原生 `browser` 对象处理交互页面、快照、框架、网络证据和截图，先读取 `xd://eval/browser`。OMP 自带的 `/browser` headless/visible 切换保持不变。`/ultimate-browsing` 通过 `read`、`web_search` 和同一浏览器处理不完整或受阻来源、平台 API、档案和媒体前提。保留宿主的浏览器路由与权限；普通托管浏览器不需要中继，真实 Chrome 会话可使用已授权的中继或 CDP。不安装 OmOWright、BrowserSkill daemon、Cookie 提取器或额外爬虫；各技能的 attribution 保留来源覆盖表和许可证。

浏览器参考补充 OMP 18.20 的诊断返回结构、Eval 超时继承及 WebKit/Chromium 能力差异。桌面技能说明 macOS 安全输入开启时，输入仍可发送，但 Escape 和用户键入可能无法触发中断。以当前宿主契约为准，不自动升级 OMP 或启用可选后端。

`/coding-agent-sessions` 使用随附的 Python 3.11+ 工具，通过 `list`、`find` 和 `search` 发现多个编码代理产品的本地会话。按平台、项目、时间及多个查询词缩小范围；预览可能含有私密信息，只查询和报告已授权范围。特定 OMP 会话的详细咨询仍使用带 `sourceSession` 的原生 `seance`，不添加独立的对话读取命令、日志索引或服务。来源和许可证保留在 `skills/coding-agent-sessions/ATTRIBUTION.md`。

研究与 mass-research 直接包含来源访问契约，适用于没有共享 ULW 指令的 `/skill:ulw-research` 和 `/mass-ulw research`。网页收集任务明确向有能力的子代理传递浏览器、受阻来源读取参考及状态和证据要求。动态参考页面与 HTML 报告探针使用同一原生浏览器；静态来源继续使用 `read`。

## 模型提示词

- [`upstream/presets.js`](upstream/presets.js)：生成的上游模型预设和选择规则。
- [`presets.ts`](presets.ts)：将提示词适配到 OMP 的工具和异步契约。
- [`index.ts`](index.ts)：为主会话和受支持的子代理会话应用提示词。
- [`host-guidance.ts`](host-guidance.ts)：移除与模型工作方式重复的 OMP 默认指令，同时保留工具与权限契约。
- [`upstream/update.mjs`](upstream/update.mjs)：从固定的上游版本更新预设。
- [`upstream/omp-build.mjs`](upstream/omp-build.mjs)：避免重复注入 OMP 已提供的内容。

受支持模型的工作方式优先于通用 OMP 指令，重复的规划、重读、委派和验证要求会被移除。每次请求前刷新可用工具。子代理保留其专业角色、权限与完成协议。自定义或无法识别的系统模板保持不变；不受支持的模型及其回退保留 OMP 默认行为。更改已安装的扩展后，请重启 OMP。

角色路由和回复格式说明已压缩；ULW 将调用解析交给宿主，浏览器和桌面契约按需读取。剩余的原生编辑前重复规则仅在当前模型或保留的宿主指令已覆盖时删除，覆盖条件变化时恢复；原生交付规则按原文保留，包括运行中的新增和修改。模型专属的重读、验证层级和工具预算保持不变。

原生 todo/sh 说明中的重复仅在当前模型提示词明确包含等同要求且原生文本匹配时删除。独有的工具机制和自定义说明保持不变；不支持的模型保留原生说明。

33 个预设包含 Claude Fable / Mythos 5.2 专用提示词，替代临时 Fable 5.5 条目。研究及 mass-research 的交接为每项结论保留观察证据，为关闭的线索记录探查过程；记忆中的断言在核实前仍是线索。有效的已记录证据可以复用，无需重复已通过的检查。

GPT-6.1 Terra 在主会话和子代理中均使用 `gpt-6-astra`，支持 provider 前缀、Fast 后缀及显示名称。这里只改变提示词，实际请求的模型和 provider 保持不变；上游已有的匹配优先。

## 生成前端参考文件

第三方设计参考、UI/UX 研究数据和 designpowers 参考正文由 `upstream/skills/` 下四个 Git 子模块的固定提交生成。生成文件不纳入 Git，仍使用 `skills/frontend/references/` 下的原有路径；OMP 专用指南与集成规则继续跟踪。

更新仓库后，初始化记录的版本并重新生成：

```bash
git submodule update --init --recursive
bun upstream/materialize-frontend-refs.mjs
```

初始化子模块需要网络，生成和正常运行 OMP 均在本地完成。无需 Git 的部署应复制生成后的完整 `skills/` 目录。GitHub 源码压缩包本身不包含子模块内容和生成参考。

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
