# Gemini 4 Hydrogen 版

来自 Google AI Studio 里的一次对话（模型 `gemini-4-hydrogen`，思考级别 High）。它没有运行环境，不能自己构建、截图或自查，只在回答里写出了源码；一共三轮：给出合并提示词、“继续？”、“最终的html好了吗”。

- `src/` 和 `build.py`：按它最后给出的版本原样保存（`06-scenes.js` 用第三轮的修正版，`07-camera-ui.js`、`template.html`、`build.py` 用第二轮的完整版，其余用第一轮的）。
- `index.original.html`：原样构建（`python3 build.py --inline-three three.min.js`）的结果。打开是黑屏，报错 `ReferenceError: hatDouliGeo is not defined`。
- `index.html`：只改了一个名字之后的构建结果，便于对照观看。改动是 `src/03-entities.js` 第 134 行返回对象里的 `hatDouliGeo` 改成 `hatDouliGeo: douliGeo`（斗笠的几何体定义时叫 `douliGeo`，引用时写成了 `hatDouliGeo`）。`src/` 里保留的是没改的原文。
- `preview/`：用改过的 `index.html` 截的图。

AI Studio 页面显示这次对话共约 100,146 token，口径和其他版本的统计不同，不能直接比较。
