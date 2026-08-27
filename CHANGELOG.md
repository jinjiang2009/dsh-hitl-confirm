# Changelog

本项目的用户可见变更记录在此文件中。版本号遵循 [Semantic Versioning](https://semver.org/)。

## [0.1.0] - 2026-08-27

### Added

- 新增模型工具 `hitl_confirm`，在互斥候选项无法自动决策时暂停执行并请求人工确认。
- 新增 `/hitl-confirm` 命令，允许用户手动打开相同的确认流程。
- 新增 Web 确认弹窗、自由文本回答、多选支持及中英文界面。
- 使用 `HITL/Confirm` header 与内置 `ask_user_question` UI 和平共存。
- 提交可直接从 GitHub 安装的 host 与 client 构建产物。

[0.1.0]: https://github.com/jinjiang2009/dsh-hitl-confirm/releases/tag/v0.1.0
