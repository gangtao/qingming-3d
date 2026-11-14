# Gemini 4 Hydrogen 版

来自 Google AI Studio 里的一次对话（模型 `gemini-4-hydrogen`，思考级别 High）。它没有运行环境，不能自己构建、截图或自查，只在回答里写出了源码；一共三轮：给出合并提示词、“继续？”、“最终的html好了吗”。

- `src/` 和 `build.py`：按它最后给出的版本原样保存（`06-scenes.js` 用第三轮的修正版，`07-camera-ui.js`、`template.html`、`build.py` 用第二轮的完整版，其余用第一轮的）。
- `index.original.html`：原样构建（`python3 build.py --inline-three three.min.js`）的结果。打开是黑屏，报错 `ReferenceError: hatDouliGeo is not defined`。
- `index.html`：只改了一个名字之后的构建结果，便于对照观看。改动是 `src/03-entities.js` 第 134 行返回对象里的 `hatDouliGeo` 改成 `hatDouliGeo: douliGeo`（斗笠的几何体定义时叫 `douliGeo`，引用时写成了 `hatDouliGeo`）。`src/` 里保留的是没改的原文。
- `preview/`：用改过的 `index.html` 截的图。

AI Studio 页面的 Token Usage 显示输入 1,158、输出 98,990、合计 100,148 token，是整段对话占用上下文的口径，和其他版本按调用累计的统计不能直接比较。

修复后的页面加载时实际创建了 378 个人物、46 头牲口（11 牛、8 驴、8 马、8 狗、6 骆驼、5 猪）、14 条船、28 座房屋，另有城门 1 座、桥 3 座、柳树 68 棵、枯树 56 棵。
