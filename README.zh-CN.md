# OpenIM Electron 💬💻

<p>
  <a href="https://docs.openim.io/">OpenIM Docs</a>
  •
  <a href="https://github.com/openimsdk/open-im-server">OpenIM Server</a>
  •
  <a href="https://github.com/openimsdk/open-im-sdk-web-wasm">openim-sdk-wasm</a>
  •
  <a href="https://github.com/openimsdk/openim-sdk-core">openim-sdk-core</a>
</p>

<br>

OpenIM Electron 是一个基于`openim-sdk-wasm`、`openim-server`和`Electron`构建的即时通讯应用程序。它演示了如何使用 OpenIM 快速的将即时通讯功能集成到任何 Web 应用程序中。

## 技术栈 🛠️

- 这是一个使用 [`Electron`](https://www.electronjs.org/) 和 [`Vite`](https://vitejs.dev/) 构建的项目。
- 应用程序使用了 [openim-sdk-wasm](https://github.com/openimsdk/open-im-sdk-web-wasm) 库构建。

## **第三方依赖**

- **Twemoji**
  - 作者：Twitter, Inc.
  - 许可：CC BY 4.0
  - 许可链接：https://creativecommons.org/licenses/by/4.0/
  - 说明：本项目使用 [Twemoji](https://github.com/twitter/twemoji) 图标库，遵循 CC BY 4.0 协议，使用时已添加相应署名与许可声明。

## 开发设置 🛠️

> 建议使用 node 版本 22.18.0。

按照以下步骤设置本地开发环境：

1. 运行 `npm install` 来安装所有依赖项。
2. 解压 `ffi-assets.zip`，并将每个平台的资源(dylib、dll、so)移动到 `node_modules/@openim/electron-client-sdk/assets` 相应的架构目录中。
3. 配置环境变量：

   > 注意：您需要先[部署](https://docs.openim.io/zh-Hans/guides/gettingStarted/dockerCompose) OpenIM 服务器，默认端口为 10001、10002、10008。

   创建或修改环境配置文件：

   - `.env.development` - 开发环境配置
   - `.env.production` - 生产环境配置

   配置示例：

   ```env
   # 服务器地址
   VITE_WS_URL=ws://your-server-ip:10001
   VITE_API_URL=http://your-server-ip:10002
   VITE_CHAT_URL=http://your-server-ip:10008
   VITE_AGENT_URL=http://your-server-ip:10010

   # 应用信息
   VITE_APP_NAME=DEV-ER  # 生产环境使用 OpenCorp-ER
   VITE_SDK_VERSION=SDK(ffi) v3.8.4-alpha.4-e-v1.1.11
   ```

   **注意**：应用版本在 `version.json` 文件中统一管理：

   ```json
   {
     "prod": "3.8.4+2",
     "dev": "1.0.0-dev"
   }
   ```

4. 运行 `npm run dev` 来启动开发服务器。访问 [http://localhost:5173](http://localhost:5173) 查看结果。默认情况下将启动 Electron 应用程序。
5. 开始开发！ 🎉

## 构建 🚀

> 该项目支持开发环境和生产环境的独立构建配置。

### Web 应用程序

1. 运行以下命令来构建 Web 应用程序：

   ```bash
   # 开发环境构建
   npm run build:dev

   # 生产环境构建
   npm run build:prod
   ```

2. 构建结果将位于 `dist` 文件夹中。

### Electron 应用程序

项目现在包含自动化构建脚本，可以自动处理包准备和恢复：

#### 开发环境构建

```bash
# 构建所有平台
npm run electron:build:dev

# 特定平台构建
npm run electron:build:mac:dev    # macOS ARM64
npm run electron:build:win:dev    # Windows x64
npm run electron:build:linux:dev  # Linux
```

#### 生产环境构建

```bash
# 构建所有平台
npm run electron:build:prod

# 特定平台构建
npm run electron:build:mac:prod    # macOS ARM64
npm run electron:build:win:prod    # Windows x64
npm run electron:build:linux:prod  # Linux
```

#### 构建流程详情

1. **自动版本管理**：构建脚本会根据环境自动设置相应的版本号。
2. **包准备**：脚本会自动准备构建用的 package.json（移除不必要的依赖）。
3. **构建配置**：
   - 开发环境使用 `electron-builder.dev.json5`
   - 生产环境使用 `electron-builder.prod.json5`
4. **包恢复**：构建完成后，原始的 package.json 会自动恢复。
5. **输出目录**：构建结果位于 `release/ER/${version}` 文件夹中。

#### 构建配置文件

- `electron-builder.dev.json5` - 开发环境构建配置

  - App ID: `io.opencorp.dev.desktop.er`
  - 产品名称: `DEV-ER`
  - NSIS GUID: `f7d2e3a1-8b9c-4d5e-a6f3-9e8c7b6d5a4f`

- `electron-builder.prod.json5` - 生产环境构建配置
  - App ID: `io.opencorp.desktop.er`
  - 产品名称: `OpenCorp-ER`
  - NSIS GUID: `a8f5e9c4-3b2d-4e1f-9c8a-7d6b5e4a3c2b`

## 谁在使用 OpenIM :eyes:

查看我们的[用户案例](https://github.com/OpenIMSDK/community/blob/main/ADOPTERS.md)页面，以获取正在使用改项目用户的列表。不要犹豫留下[📝 评论](https://github.com/openimsdk/open-im-server/issues/379)并分享您的使用情况。

## LICENSE :page_facing_up:

OpenIM Electron 在 AGPL 3.0 许可下发布。
