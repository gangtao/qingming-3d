# Gemini 4 Hydrogen 版

来自 Google AI Studio 的应用构建（Build）项目，模型 `gemini-4-hydrogen`。和聊天对话不同，这里它有运行环境：自己写文件、构建、用无头浏览器截图自查。输入是合并提示词和原画参照图。

- `index.html`：它自己打包出来的离线单页（项目里的 `standalone/index.html`），原样发布，没有任何改动。在无头浏览器里打开没有报错。
- `project/`：从 AI Studio 导出的项目源码，去掉了 AI Studio 的内部缓存目录、锁文件和模板自带的说明。模块在 `project/src/qingming/`（`primitives.ts`、`materials.ts`、`world.ts`、`actors.ts`、`architecture.ts`、`boats.ts`、`sections.ts`、`camera.ts`、`ui.ts`、`engine.ts`）；`npm run build:standalone` 调用 `scripts/build-standalone.mjs` 打包成单页。
- `preview/`：截图。

它用的是 three.js 0.187，不是提示词里举例的 r128（提示词允许内嵌任意版本）。

页面加载时实际创建了 329 个人物、32 头牲口（10 驴、6 牛、4 马、4 骆驼、4 猪、4 狗）、17 条船、43 座房屋（35 座瓦房、6 座茅舍、2 座酒楼），另有城门 1 座、彩楼欢门 2 座、车轿 14 件（6 独轮车、5 牛车、3 轿子）、货摊 13 个、柳树 46 棵、枯树 46 棵。这些是在加了计数的副本里实测的。

用时：AI Studio 页面上显示 “Ran for 7m 21s”。项目缓存里参照图和自查截图的时间戳前后跨了约 16 分钟。页面不显示 token 用量，无法统计。

这一版替换了之前收录的聊天对话版（那一版模型没有运行环境，代码需要改一个名字才能打开）；旧版在仓库的提交历史里。
