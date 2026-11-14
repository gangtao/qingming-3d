# Gemini 4 Carbon 版

来自 Google AI Studio 的应用构建（Build）项目，模型 `gemini-4-carbon`。和聊天对话不同，这里它有运行环境，可以自己写文件和构建。输入是合并提示词和原画参照图，一轮完成。

- `index.html`：离线单页。导出的项目里 `standalone/index.html` 是一个 0 字节的空文件，所以这一份是收录时用它自己的构建脚本 `scripts/build-standalone.mjs` 重新打包出来的（three 0.187.0、esbuild 0.25，脚本和源码都没有改动）。在无头浏览器里打开没有报错。
- `project/`：从 AI Studio 导出的项目源码，去掉了 AI Studio 的内部缓存目录、锁文件、模板自带的说明和那个空的 `standalone/index.html`。模块在 `project/src/qmsht/`（`00-embedded-assets.ts`、`01-primitives.ts`、`02-world.ts`、`03-actors.ts`、`04-architecture.ts`、`05-vessels.ts`、`06-scenes.ts`、`07-camera-ui.ts`）；`npm run build:standalone` 调用 `scripts/build-standalone.mjs` 打包成单页。
- `preview/`：截图。

它用的是 three.js 0.187，不是提示词里举例的 r128（提示词允许内嵌任意版本）。

页面加载时实际创建了 607 个人物、29 头牲口（9 驴、5 牛、5 马、5 骆驼、3 狗、2 猪）、17 条船、44 座房屋（36 座瓦房、8 座茅舍），另有城门 1 座、彩楼欢门 2 座、车轿 15 件（6 独轮车、4 牛车、1 平板车、4 轿子）、伞摊 17 个、柳树 43 棵、枯树 62 棵。这些是在加了计数的副本里实测的。

用时：AI Studio 页面上显示 “Ran for 19m 2s”。页面不显示 token 用量，也看不到模型调用和工具调用次数，无法统计。

这一版替换了之前收录的聊天对话版（那一版模型没有运行环境，分 7 轮写完，要补实例颜色才能完整显示）；旧版在仓库的提交历史里。
