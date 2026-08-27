# Contributing

欢迎通过 issue 报告问题，或通过 pull request 提交修复。

## 开发环境

- Node.js `^22.19.0 || >=24.0.0`
- pnpm `10.4.1`

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

本仓库提交 `lib/`，修改 `src/` 或构建配置后请同步重新构建，并确认没有未提交的构建差异：

```sh
git diff --exit-code -- lib
```

请保持一次 pull request 只处理一个问题，并说明验证方式。运行逻辑变化应同时补充可重复的测试或明确的手动验收步骤。
