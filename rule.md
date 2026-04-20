# 万卷书 — 国漫角色知识库 项目规范

> **每次修改代码前请先读一遍本文件，避免上下文丢失。**

---

## 一、项目背景

### 痛点
国漫作品（《一人之下》《画江湖之不良人》等）人物多、关系杂、设定深，但目前缺乏一个结构化、有温度的角色百科。百度百科/萌娘百科的词条偏辞典式罗列，不够鲜活；粉丝自建 Wiki 分散在各平台，数据格式不统一，也无法直观展示人物关系。

### 解决方案
**万卷书** 是一个纯前端的国漫角色知识库 SPA，把每部作品的核心人物用结构化数据（身份、能力、关系、故事线）组织起来，提供：
- **角色详情页**：一目了然的人物档案（简介、性格、能力表、关系、故事线）
- **力导向关系图谱**：可视化呈现人物之间的关系网络，支持按季/按阵营筛选
- **双向链接**：文本中的 `[[人名]]` 可点击跳转，右侧面板即时预览
- **纠偏标注**：选中任意文本可添加纠偏意见，便于社区协作校验

---

## 二、数据

### 数据源优先级
1. 原著（起点读书等）
2. 漫画平台（腾讯动漫等）
3. 长视频平台（腾讯视频、B站、优酷）
4. 百科（萌娘百科）
5. 社区（小红书、微博超话）

AI 训练数据**不能**作为可靠数据源，必须有可追溯来源佐证。

### 角色获取：三层法则（yyn-dongman-wiki skill）

人物筛选遵循 `~/.claude/skills/yyn-dongman-wiki/SKILL.md` 中定义的三层法则：

| 层级 | 定义 | tier 值 | 示例 |
|------|------|---------|------|
| **第一层：核心主角团** | 故事绝对中心，贯穿始终 | `1` | 张楚岚、冯宝宝；李星云、姬如雪、张子凡、陆林轩 |
| **第二层：重大影响者** | 直接影响核心主角的命运走向 | `2` | 张之维、无根生；袁天罡、女帝、李嗣源 |
| **第三层：高光角色** | 出场不多但令人难忘的弧光角色 | `3` | 陈朵、萧霄；黑白无常 |

筛选顺序：先定第一层 → 以第一层为锚点扩展第二层 → 补充第三层。

### 写作风格要点
- 简介以角色最鲜明特质切入，不用辞典式开头
- 评价区用 `>` 引用格式，无广传评价则不写
- 出圈台词只收高传播度的，不硬凑
- 性格用概括性短句列点
- 能力保留准确性的同时加大白话解释
- 核心故事线是**完整时间线串联**，不是零散事件列点
- 整体语气：像老粉给朋友安利，鲜活有态度但信息准确
- 对主角客观有深度，不狂热赋魅也不贬义措辞

### 数据结构（src/data/works.ts）

```
Work
├── id, name, category ('ancient' | 'modern'), description
├── characters: Character[]
│   ├── id, name, aliases[], tier (1|2|3), gender
│   ├── summary        ← 简介，支持 [[双向链接]]
│   ├── quotes[]       ← { text, source }
│   ├── personality[]  ← 概括性短句
│   ├── abilities[]    ← { name, description }
│   ├── relations[]    ← { target(角色id), type, description, seasons?[] }
│   ├── background     ← 身世背景，支持 [[双向链接]]
│   ├── storyline[]    ← { phase, description, arc? }
│   ├── status, verified, stats (6维雷达)
├── factions: Faction[]
│   ├── id, name, description, members[] (角色id列表)
├── events: Event[]
│   ├── id, name, description
├── seasons?[]                       ← { number, name }，用于关系链按季筛选
└── factionClassification?           ← Record<阵营名, 角色id[]>，用于侧栏门派分类
```

### 当前作品

| 作品 | ID | 类型 | 角色数 | 分类模式 |
|------|-----|------|--------|---------|
| 一人之下 | `yi-ren-zhi-xia` | modern | 30 | 门派分类（factionClassification） |
| 画江湖之不良人 | `bu-liang-ren` | ancient | 8 | 门派分类（factionClassification） + 季度筛选 |

---

## 三、项目实现

### 技术架构

| 层面 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API + `<script setup>`) |
| 语言 | TypeScript |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS 4 + 自定义 CSS 变量（国风主题） |
| 力导向图 | `force-graph`（框架无关的 Canvas 库） |
| 状态管理 | 组件内 `ref()` / `computed()`，无全局 store |
| 数据层 | 纯静态 TS 文件（`src/data/works.ts`），无后端 |

### 目录结构

```
dongman-wiki/
├── public/
│   ├── avatars/          ← 角色头像（{character-id}.jpg 或 .png）
│   ├── backgrounds/      ← 角色背景图（{character-id}.jpg/.png/.jpeg）
│   └── favicon.svg, icons.svg
├── src/
│   ├── main.ts           ← Vue 入口
│   ├── App.vue           ← 根组件：F 型布局 + 全局状态
│   ├── index.css          ← 全局样式：CSS 变量 + 国风装饰类
│   ├── env.d.ts          ← Vue + force-graph 类型声明
│   ├── data/
│   │   └── works.ts      ← 全部作品/角色/阵营/事件数据
│   ├── composables/
│   │   └── useAnnotations.ts  ← 纠偏标注（localStorage 持久化）
│   ├── components/
│   │   ├── Sidebar.vue        ← 左侧导航：作品列表 + 角色列表（层级/门派分类）
│   │   ├── SearchBar.vue      ← 顶栏搜索：按名字/别名跨作品搜索
│   │   ├── RightPanel.vue     ← 右侧面板：6 种实体卡片（角色/阵营/能力/事件/作品/故事线）
│   │   ├── RadarChart.vue     ← 六维雷达图（战力/智谋/速度/防御/技巧/潜力）
│   │   ├── LinkedText.vue     ← [[双向链接]] 解析与渲染
│   │   ├── AnnotationTool.vue ← 选中文本浮动标注按钮
│   │   └── AnnotationList.vue ← 纠偏记录列表 + 导出
│   ├── pages/
│   │   ├── CharacterDetail.vue ← 角色详情页（主内容区）
│   │   └── RelationGraph.vue   ← 力导向关系图谱
│   └── themes/               ← 预留主题扩展
├── vite.config.ts
├── tsconfig.app.json / tsconfig.node.json / tsconfig.json
├── eslint.config.js
└── index.html
```

### 页面与模块

#### 1. 整体布局（App.vue）

```
┌──────────────────────────────────────────────────────┐
│ Header (sticky)                                       │
│ [侧栏开关] [万卷书] [SearchBar] [纠偏按钮]           │
├──────────┬─────────────────────────┬─────────────────┤
│ Sidebar  │ Main Content            │ RightPanel /     │
│ 210px    │ (flex-1, scrollable)    │ AnnotationList  │
│          │                         │ 360px            │
│ - 作品   │ viewMode=character:     │                  │
│ - 角色   │   背景图(sticky) +      │ 点击[[链接]]     │
│ - 关系链 │   CharacterDetail       │ 时打开           │
│          │                         │                  │
│          │ viewMode=graph:         │ ESC 关闭         │
│          │   RelationGraph         │                  │
└──────────┴─────────────────────────┴─────────────────┘
```

- **性别主题**：男性角色自动切换蓝色调（`.theme-male`），女性用默认粉色调
- **切换角色时**：重置主内容区滚动位置到顶部

#### 2. 角色详情页（CharacterDetail.vue）

从上到下依次展示：
1. **头像 + 名字 + 别名 + 简介**（LinkedText 支持 [[链接]]）
2. **评价引用块**（quote-block，可选）
3. **性格**（列点 + 圆点标记）
4. **能力表格**（名称可点击打开右侧面板）
5. **人物关系**（按关系类型分组，card-spring 卡片）
6. **身世背景**（LinkedText）
7. **核心故事线**（时间线 UI：timeline-dot + timeline-line，可点击展开右侧面板）

每个 section 之间用 `ink-divider` 花水渐变分割线分隔。

#### 3. 关系图谱（RelationGraph.vue）

- **库**：`force-graph`（底层 d3-force，Canvas 渲染）
- **节点大小**：T1=28px, T2=18px, T3=13px（按 `globalScale` 缩放 ×1.8）
- **初始布局**：T1 中心椭圆 → T2 外圈椭圆(380×200) → T3 最外圈(520×280)
- **着色模式**：
  - 一人之下：按阵营着色（factionClassification），多阵营角色用饼图分色
  - 其他作品：按性别着色（男蓝 #8ba7b8 / 女粉 #c4929e / 未知灰 #a0999f）
- **交互**：hover 高亮 + 聚焦（click）淡化无关节点 + 拖拽 + 缩放
- **季度筛选**：有 `seasons` 的作品（如不良人）显示季度按钮，筛选关系边
- **力模型**：T1 节点斥力 -600，其他 -300；最小距离 150px

#### 4. 右侧面板（RightPanel.vue）

处理 6 种实体类型：

| 类型 | 内容 |
|------|------|
| `character` | 头像 + 名字 + tier 印章 + 雷达图 + 阵营 + 能力 + 关系 + "跳转到人物页卡"按钮 |
| `faction` | 阵营名 + 描述 + 成员列表（可点击） |
| `ability` | 能力名 + 详细描述 |
| `event` | 事件名 + 描述 |
| `work` | 作品名 + 描述 + 角色数/阵营数 |
| `storyline` | 故事线节点 + 上/下节点导航 + 同步滚动主内容区 |

### 图片资源

| 类型 | 路径 | 命名规则 | 格式 | 回退链 |
|------|------|----------|------|--------|
| 头像 | `public/avatars/` | `{character-id}.jpg` | jpg 优先, png 备选 | `.jpg` → `.png` → 隐藏（显示姓名首字） |
| 背景 | `public/backgrounds/` | `{character-id}.jpg` | jpg 优先, png/jpeg 备选 | `.jpg` → `.png` → `.jpeg` → 隐藏 |

- 头像用于：侧栏列表（20×20）、详情页（120×120）、右侧面板（64×64）
- 背景用于：详情页 sticky 全屏背景（opacity 0.6 + 半透遮罩）

### 人物关系链构建标准

每条关系（`Relation`）包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| `target` | `string` | 目标角色的 `id`（必须是同一作品内已存在的角色） |
| `type` | `string` | 关系类型标签（如"搭档""师徒""恋人""敌对"） |
| `description` | `string` | 关系的具体描述，支持 [[双向链接]] |
| `seasons` | `number[]` | 可选，该关系存在的季数（用于关系图谱按季筛选） |

**去重规则**：关系图谱中，同一对角色的同类型关系只画一条边（按 `[id1, id2].sort().join('|') + type` 去重）。

**关系类型命名规范**：
- 用简短的中文名词/短语：搭档、师徒、恋人、师姐弟、亦敌亦友、养父子/仇敌
- 对称关系（如"搭档"）只需一方定义，图谱会自动双向展示
- 非对称关系（如"师父→徒弟"）需要从一方视角定义

### 国风主题系统

CSS 变量定义在 `src/index.css` 的 `:root` 中：
- **底色**：花笺白 `#faf6f8`
- **主色**：桃花粉 `#F3B9D2` + 水青蓝 `#A6D2EB`
- **强调色**：暗桃 `#a05070`（女性角色） / 暗青 `#3a7a9a`（男性角色）
- **字体**：标题用 Noto Serif SC（宋体），正文用 Noto Sans SC（黑体）
- **装饰类**：`ink-divider`（花水渐变线）、`seal-stamp`（印章标签）、`quote-block`（引用块）、`card-spring`（hover 水波卡片）

男性角色通过 `.theme-male` 类覆盖 CSS 变量，切换为蓝色调。

---

## 四、注意事项

1. **数据文件不要被 Tailwind 扫描**：`index.css` 中已配置 `@source not "../src/data/**"`，因为 `works.ts` 中的 CJK 字符会触发 Tailwind 4 的 `Invalid code point` 构建错误
2. **图片回退链**：修改图片加载逻辑时，务必保留 `.jpg → .png → .jpeg → 隐藏` 的完整回退链
3. **[[双向链接]]** 语法：在 `summary`、`background`、`relation.description`、`storyline.description` 中使用，由 `LinkedText.vue` 解析
4. **关系必须指向已存在的角色 ID**：删除角色时需同步清理其他角色的 `relations[]` 中对该 ID 的引用，以及 `factions.members[]` 和 `factionClassification`
5. **`force-graph` 类型声明**在 `src/env.d.ts` 中手动维护，因为该库无官方 TS 类型
