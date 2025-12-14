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

OpenIM Electron is a instant messaging application built on OpenIM SDK Wasm, OpenIM Server, and Electron. It demonstrates how to quickly integrate instant messaging capabilities into any web app using OpenIM.

## Tech Stack 🛠️

- This is a [`Electron`](https://www.electronjs.org/) project bootstrapped with [`Vite`](https://vitejs.dev/).
- App is built with [openim-sdk-wasm](https://github.com/openimsdk/open-im-sdk-web-wasm) library.

## Third-Party Dependencies

- **Twemoji**
  - **Author:** Twitter, Inc.
  - **License:** CC BY 4.0
  - **License URL:** https://creativecommons.org/licenses/by/4.0/
  - **Repository:** https://github.com/twitter/twemoji
  - **Notes:** This project uses the Twemoji icon library under CC BY 4.0. Proper attribution is provided here.

## Dev Setup 🛠️

> It is recommended to use node version 22.18.0.

Follow these steps to set up a local development environment:

1. Run `npm install` to install all dependencies.
2. Unzip `ffi-assets.zip`, and move every platform assets(dylib、dll、so) into the `node_modules/@openim/electron-client-sdk/assets` corresponding architecture directory.
3. Configure environment variables:

   > Note: You need to [deploy](https://docs.openim.io/guides/gettingStarted/dockerCompose) OpenIM Server first, the default port of OpenIM Server is 10001, 10002, 10008.

   Create environment files or modify the existing ones:

   - `.env.development` - Development environment configuration
   - `.env.production` - Production environment configuration

   Example configuration:

   ```env
   # Server URLs
   VITE_WS_URL=ws://your-server-ip:10001
   VITE_API_URL=http://your-server-ip:10002
   VITE_CHAT_URL=http://your-server-ip:10008
   VITE_AGENT_URL=http://your-server-ip:10010

   # App Info
   VITE_APP_NAME=DEV-ER  # or OpenCorp-ER for production
   VITE_SDK_VERSION=SDK(ffi) v3.8.4-alpha.4-e-v1.1.11
   ```

   **Note**: App version is managed in `version.json` file:

   ```json
   {
     "prod": "3.8.4+2",
     "dev": "1.0.0-dev"
   }
   ```

4. Run `npm run dev` to start the development server. Visit [http://localhost:5173](http://localhost:5173) to see the result. An Electron application will be launched by default.
5. Start development! 🎉

## Build 🚀

> This project supports building for both development and production environments with separate configurations.

### Web Application

1. Run the following commands to build the web application:

   ```bash
   # Development build
   npm run build:dev

   # Production build
   npm run build:prod
   ```

2. The build result will be located in the `dist` folder.

### Electron Application

The project now includes automated build scripts that handle package preparation and restoration:

#### Development Build

```bash
# Build for all platforms
npm run electron:build:dev

# Platform-specific builds
npm run electron:build:mac:dev    # macOS ARM64
npm run electron:build:win:dev    # Windows x64
npm run electron:build:linux:dev  # Linux
```

#### Production Build

```bash
# Build for all platforms
npm run electron:build:prod

# Platform-specific builds
npm run electron:build:mac:prod    # macOS ARM64
npm run electron:build:win:prod    # Windows x64
npm run electron:build:linux:prod  # Linux
```

#### Build Process Details

1. **Automatic Version Management**: The build scripts automatically set the appropriate version based on the environment.
2. **Package Preparation**: The scripts automatically prepare the package.json for building (removing unnecessary dependencies).
3. **Build Configuration**:
   - Development builds use `electron-builder.dev.json5`
   - Production builds use `electron-builder.prod.json5`
4. **Package Restoration**: After building, the original package.json is automatically restored.
5. **Output Directory**: Build results are located in the `release/ER/${version}` folder.

#### Build Configuration Files

- `electron-builder.dev.json5` - Development build configuration

  - App ID: `io.opencorp.dev.desktop.er`
  - Product Name: `DEV-ER`
  - NSIS GUID: `f7d2e3a1-8b9c-4d5e-a6f3-9e8c7b6d5a4f`

- `electron-builder.prod.json5` - Production build configuration
  - App ID: `io.opencorp.desktop.er`
  - Product Name: `OpenCorp-ER`
  - NSIS GUID: `a8f5e9c4-3b2d-4e1f-9c8a-7d6b5e4a3c2b`

## Who are using OpenIM :eyes:

Check out our [user case studies](https://github.com/OpenIMSDK/community/blob/main/ADOPTERS.md) page for a list of the project users. Don't hesitate to leave a [📝comment](https://github.com/openimsdk/open-im-server/issues/379) and share your use case.

## License :page_facing_up:

OpenIM Electron is licensed under the AGPL 3.0 license.
