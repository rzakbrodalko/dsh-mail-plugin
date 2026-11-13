# Gitee 镜像指南

GitHub 是 `dsh-mail-plugin` 的主仓库。Gitee 只作为中国大陆访问的镜像，避免出现两个独立维护的 issue tracker。

## 1. 创建 Gitee 镜像

1. 登录 Gitee。
2. **新建仓库** → 选择从 GitHub 导入，或创建一个空仓库后推送。
3. 仓库名建议：`dsh-mail-plugin`。
4. 描述建议：`DeepSeek Harness 邮件插件：IMAP 读取、HTML 回复、审核与自动回复。`
5. 不要初始化 README、`.gitignore` 或 LICENSE，仓库中已有这些文件。

## 2. 推送镜像

在本地仓库添加 Gitee remote：

```powershell
git remote add gitee git@gitee.com:<你的Gitee用户名>/dsh-mail-plugin.git
git push gitee main --tags
```

之后每次发布：

```powershell
git push origin main --tags
git push gitee main --tags
```

如果使用 Gitee 的导入/镜像同步功能，请确认它只同步 `main` 和标签，不要覆盖 Gitee 上额外添加的中文说明。

## 3. 保持单一事实来源

- **GitHub**：源码、issues、pull requests、releases、安全公告。
- **Gitee**：只读镜像 + 中文入口页。
- 在 Gitee README 顶部保留：

  ```markdown
  > 这是 GitHub 主仓库的镜像：
  > https://github.com/rzakbrodalko/dsh-mail-plugin
  > 问题反馈、版本发布和安全公告请前往 GitHub。
  ```

- 如果 Gitee 开启 issues，请明确说明响应可能较慢，并链接 GitHub issues。
- 不要在两边的 README 中写出不同的安装命令或版本号。

## 4. 中文用户安装

主安装方式仍然是 npm：

```text
dsh-mail-plugin@1.1.0
```

中国大陆网络可选：

- 使用 npmmirror 镜像：`https://registry.npmmirror.com/dsh-mail-plugin`
- 直接从 Gitee 的标签源码安装时，使用 DSH 插件管理器的本地目录安装方式。

如需完全离线安装，请下载 npm tarball 或 Gitee 标签源码，再通过 **插件 → 添加插件** 指向本地目录。

## 5. 发布检查清单

- [ ] GitHub `main` 与 Gitee `main` 指向同一提交
- [ ] 两边标签一致（至少 `v1.0.1` 及以后）
- [ ] Gitee README 顶部有 GitHub 主仓库链接
- [ ] 中文 README 的版本号和安装命令与 npm 一致
- [ ] Gitee 没有包含密码、`$DSH_HOME` 数据或构建产物
- [ ] GitHub release 已创建，Gitee 只同步标签或镜像说明
