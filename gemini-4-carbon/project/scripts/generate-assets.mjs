import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ALL_CHARS = Array.from(
  new Set(
    (
      '清明上河图北宋张择端故宫博物院藏本绢本设色' +
      '郊野春色汴河虹桥城门街市卷首卷尾中段后段' +
      '视角缩放俯仰旋转题签复位收起展开远近高低平视鸟瞰显示隐藏' +
      '左键拖动漫游右键或加滚轮单指双指捏合方向键与加减号点击底部长卷跳转任一位置松手拖拽当前视野框窄屏全卷导览操作提示按住上下左右前后空格' +
      '晨雾初散，疏林薄霭间小桥流水，驮炭驴队踏着乡间土路缓缓向城郊行进。农舍茅檐错落，早春枯木与新柳相映成趣。' +
      '官道旁老柳盘根错节、细枝初发鹅黄，扫墓踏青归来的轿马队伍插柳而行。田畴麦场与路边野店渐显近郊生气。' +
      '汴河水道渐宽，两岸粮仓茶肆鳞次栉比，十余艘漕船依岸停泊。挑夫踏着跳板往来卸粮，船身皆放下人字桅而无一张帆。' +
      '河面舟楫穿梭，岸边数名纤夫俯身弓步、合力曳船逆流而上。临水轩亭内茶客凭栏远眺，橹声水影交织。' +
      '木构无柱虹桥斜跨汴河，桥面摊贩云集、文武轿马争道。桥下一艘大船正急落人字桅杆，船工撑篙呼号，桥上众人凭栏施援。' +
      '桥西街市繁华，“十千脚店”门前彩楼欢门高耸，二层平座酒客盈门。汴河自此折向西北远去，岸畔车马喧阗。' +
      '城外大道车水马龙，修车木作坊与货摊沿街铺开，牛车、独轮车络绎不绝。行人与挑夫跨越护城河平桥，直趋城门。' +
      '高大砖砌城台之上木构城楼巍然耸立，一队双峰骆驼满载西域货包正穿城门洞而出。门内税务官吏查验商旅货担。' +
      '城内大街店铺林立，“孙羊正店”彩楼欢门华丽夺目，“久住王员外家”客舍幽深。至十字街口水井汲水繁忙，卷尾“赵太丞家”药铺招牌醒目。' +
      '乡间小桥驮炭驴队农家麦场古柳长堤踏青归轿路边野店汴河漕船卸粮码头临水茶肆纤夫曳船过桥大船放桅急渡桥上争道临河大酒楼修车木作铺席篷牛车砖筑城门楼西域骆驼队城内税务所香醪美酒神课看命刘家上色沉檀拣香四眼水井太医出丸医肠胃药治酒所伤真方集香丸茶酒饮子香药铺弓箭铺天之美禄万家生佛清茶细点' +
      '0123456789+-·、，。：“”‘’（）《》—/%°▾▴×Shift '
    ).split(''),
  ),
).join('');

console.log('Unique glyph count for LXGW WenKai subset:', ALL_CHARS.length);

// 1. Crop & resize scroll thumbnail from public/assets/aistudio/overview_686b9990.jpg
// Painting area is x=127..5874 (width 5747, height 281)
const thumbBuf = execSync(
  'convert public/assets/aistudio/overview_686b9990.jpg -crop 5747x281+127+0 +repage -resize 2200x108! -strip -sampling-factor 4:2:0 -quality 82 jpg:-',
);
const thumbBase64 = `data:image/jpeg;base64,${thumbBuf.toString('base64')}`;
console.log('Thumbnail JPEG bytes:', thumbBuf.length);

// 2. Fetch subsetted LXGW WenKai TC (400 & 700) WOFF2 from Google Fonts and inline as base64
const encodedText = encodeURIComponent(ALL_CHARS);
const ua =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
let fontCss = '';
try {
  const rawCss = execSync(
    `curl -s "https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@400;700&display=swap&text=${encodedText}" -A "${ua}"`,
  ).toString();

  const blocks = [...rawCss.matchAll(/@font-face\s*\{[^}]+\}/g)].map((m) => m[0]);
  const inlinedBlocks = [];
  for (const block of blocks) {
    const weightMatch = block.match(/font-weight:\s*(\d+)/);
    const urlMatch = block.match(/url\((https:\/\/[^)]+)\)/);
    if (weightMatch && urlMatch) {
      const weight = weightMatch[1];
      const woff2Buf = execSync(`curl -s "${urlMatch[1]}"`);
      console.log(`Fetched LXGW WenKai weight ${weight} WOFF2 bytes:`, woff2Buf.length);
      const b64 = woff2Buf.toString('base64');
      inlinedBlocks.push(
        `@font-face{font-family:'QmshtKaiti';font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`,
      );
    }
  }
  fontCss = inlinedBlocks.join('\n');
} catch (err) {
  console.warn('Warning: Could not inline remote subset font, falling back to local Kaiti stack:', err);
}

const outDir = path.resolve('src/qmsht');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, '00-embedded-assets.ts');

const content = `/**
 * 自动生成的内嵌资源模块：
 * 1. 故宫藏本《清明上河图》全卷画心缩略图（去除左右装裱题跋白边，与三维长卷坐标严格 1:1 对齐）
 * 2. 霞鹜文楷（LXGW WenKai）按需子集化 WOFF2 字体内嵌样式（离线可直接渲染）
 */

export const SCROLL_THUMB_DATA_URI = ${JSON.stringify(thumbBase64)};

export const WENKAI_FONT_CSS = ${JSON.stringify(fontCss)};
`;

fs.writeFileSync(outFile, content, 'utf8');
console.log('Wrote', outFile, 'size:', fs.statSync(outFile).size, 'bytes');
