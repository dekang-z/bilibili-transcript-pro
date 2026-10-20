# B站字幕提取器 / Bilibili Subtitle Extractor

> 基于原版优化增强，所有已知问题均已修复，支持单视频/分P合集全量批量字幕下载，开箱即用。

中文 | [English](#english)

---

## 中文

### 简介
B站字幕提取器是一款高效的油猴脚本，帮助用户从B站（Bilibili）视频页面快速提取字幕内容。支持单个视频、多分P视频以及合集视频的字幕提取，可导出为10种常见格式，并提供强大的字幕搜索定位功能。

经实测全场景适配，所有带字幕的视频均可正常提取，覆盖上传字幕、AI生成字幕等多种字幕类型。

### 功能特点

#### 核心功能
- 字幕提取：自动检测并提取B站视频的字幕内容
- 多格式导出：支持 TXT、MD、CSV、XML、HTML、SRT、VTT、ASS、LRC、JSON 等10种格式
- 分P支持：可单独提取某个分P或批量提取整个系列
- 合集支持：一次性提取合集中所有视频的字幕
- 字幕搜索：支持关键词搜索，高亮显示匹配结果，快速定位到目标位置
- 批量下载：可选择多个视频同时下载字幕

#### 自定义选项
- 自定义扩展名：可根据需要添加自定义文件扩展名和MIME类型
- 灵活的文件名设置：
  - 可选择是否包含BV号
  - 可选择是否包含时间戳
  - 可选择是否包含视频时长
- 灵活的字幕导出设置：
  - 可选择是否包含字幕时间轴
- 下载方式选择：支持直接下载或新标签页打开

### 版本修改说明
本仓库基于原版项目 [DFameMaster/bilibili-transcript](https://github.com/DFameMaster/bilibili-transcript) v1.0.0 进行优化与修复，主要修改内容如下：

#### 功能修复
- **修复分P切换同步问题**：修复合集内切换分P后，顶部视频信息（标题、BV号、CID、时长）不更新、选择框显示不匹配的问题，切换分P后自动重载对应字幕与元数据
- **优化分P列表获取**：采用「页面初始化数据 > DOM解析 > API接口」三重兜底机制，提升不同页面结构下的合集识别成功率
- **修复批量下载列表异常**：优化分P列表加载逻辑，页面未识别到合集时自动调用接口拉取完整分P列表

#### 下载逻辑重构
- **先确认后下载机制**：批量下载前弹出确认框，明示文件数量、保存路径、浏览器多文件下载提示，用户确认后再开始下载；点击取消直接终止，不会强制下载
- **批量文件名修正**：分P字幕默认使用分P自身标题作为文件名，不再使用合集总标题，文件命名更准确
- **合集文件夹功能**：新增批量下载自动创建合集标题子文件夹功能，文件自动分类整理；可在设置中开关，首次使用弹出引导提示
- **路径自动创建**：自定义保存子目录与合集文件夹支持自动创建多级目录，无需手动新建

#### 设置与体验优化
- **默认配置调整**：字幕时间轴、BV号、时间戳、时长等文件名附加项默认关闭；单个下载询问保存位置默认关闭，批量下载自动静默保存
- **自定义保存路径**：支持设置全局保存子目录，设置自动持久化到浏览器本地存储，下次打开自动沿用
- **界面样式优化**：统一视觉规范，优化间距、配色与交互反馈，新增移动端响应式适配
- **提示信息完善**：批量下载前明确提示浏览器多文件下载安全确认事项，避免用户错过系统提示

### 支持的导出格式

| 格式 | 说明 | 适用场景 |
| :---: | :---: | :---: |
| TXT | 纯文本 | 最广泛的兼容性 |
| MD | Markdown | 笔记整理、文档编写 |
| CSV | 表格格式 | 数据分析、表格处理 |
| XML | XML格式 | 专业技术处理 |
| HTML | 网页格式 | 浏览器直接查看 |
| SRT | 字幕标准格式 | 视频压制、播放器 |
| VTT | WebVTT格式 | 网页嵌入字幕 |
| ASS | ASS字幕格式 | 高质量视频压制 |
| LRC | 歌词同步格式 | 音乐播放、歌词展示 |
| JSON | JSON数据格式 | 程序处理、数据交换 |

### 安装要求
- 浏览器：支持用户脚本的浏览器（如 Chrome、Firefox、Edge 等）
- 脚本管理器：需要安装 Tampermonkey、Violentmonkey 或 Greasemonkey 等脚本管理器
- 网络环境：需要能够正常访问B站

### 安装步骤

#### 方法一：ScriptCat（推荐）
直接访问 ScriptCat 脚本市场安装：
B站字幕提取器 - ScriptCat

#### 方法二：手动安装
1. 安装适合你浏览器的脚本管理器扩展
   - [Tampermonkey](https://www.tampermonkey.net/)（推荐）
   - [Violentmonkey](https://violentmonkey.github.io/)
   - Greasemonkey
2. 点击安装脚本：[bilibili-transcript.user.js](./bilibili-transcript.user.js)
3. 访问B站视频页面，脚本自动生效

### 使用方法
1. 打开任意B站视频页面
2. 页面右下角会出现悬浮按钮
3. 点击按钮打开字幕提取面板
4. 选择字幕来源（当前视频/分P列表/合集）
5. 选择要提取的字幕
6. 设置导出格式和文件名选项
7. 点击下载或复制

### 界面预览
- 悬浮按钮：页面右下角的圆形按钮，点击打开主面板
- 字幕面板：显示视频信息、字幕列表、搜索框和操作按钮
- 设置面板：可自定义文件名格式、下载方式等选项
- 批量下载面板：可选择多个视频进行批量下载

### 注意事项
- 本脚本仅用于个人学习研究，请勿用于商业用途
- 尊重字幕创作者的劳动成果，合理使用
- 部分视频可能没有字幕或字幕不可用
- 使用过程中请确保网络连接正常

### 常见问题
**Q: 为什么有些视频没有字幕？**
A: 并非所有B站视频都有字幕，通常只有用户主动上传字幕或开启AI字幕的视频才会有。

**Q: 如何提取合集的所有字幕？**
A: 在字幕面板中选择「批量」选项，即可看到合集中的所有视频列表，批量选择后下载。

**Q: 导出的文件乱码怎么办？**
A: 尝试使用不同的格式导出，TXT格式兼容性最好。

### 更新日志
#### v1.0.0（原版）
- 初始版本发布
- 支持10种格式导出
- 实现字幕搜索定位功能
- 支持批量下载

### 致敬
向伟大的先驱 UP 主 **王子周棋洛（bilidown）** 与 GitHub 用户 **leiurayer（downkyi）** 致敬，感谢前辈们的探索与付出为后续开发奠定了基础。
我们曾抵达过未来。

### 免责声明
1. 本脚本仅供个人学习与研究使用，禁止用于任何商业用途
2. 字幕内容的版权归原视频创作者及 Bilibili 所有，请尊重创作者劳动成果，合理使用
3. 本脚本仅作为字幕提取工具，不对字幕内容的准确性、完整性做任何保证
4. 使用本脚本产生的任何问题与后果，由使用者自行承担，与脚本修改者及原作者无关

### 许可证
本项目采用 MIT 许可证开源。

---

## English

### Overview
Bilibili Subtitle Extractor is an efficient userscript that helps you quickly extract subtitles from Bilibili videos. It supports single videos, multi-part videos, and entire series, with export capability to 10 popular formats and powerful subtitle search functionality.

All known issues from the original version have been fixed, with full support for batch download of entire video collections.

### Features

#### Core Features
- Subtitle Extraction: Automatically detects and extracts subtitles from Bilibili videos
- Multi-format Export: Supports 10 formats including TXT, MD, CSV, XML, HTML, SRT, VTT, ASS, LRC, and JSON
- Multi-part Support: Extract individual parts or batch download an entire series
- Series Support: Extract subtitles from all videos in a series at once
- Subtitle Search: Search by keywords with highlight matching and quick navigation
- Batch Download: Select multiple videos for simultaneous subtitle download

#### Customization Options
- Custom Extensions: Add custom file extensions and MIME types as needed
- Flexible Filename Settings:
  - Option to include/exclude BV number
  - Option to include/exclude timestamp
  - Option to include/exclude video duration
- Option to include/exclude subtitle timestamps
- Download Method: Direct download or open in new tab

### Modification Notes
This repository is modified and optimized based on the original project [DFameMaster/bilibili-transcript](https://github.com/DFameMaster/bilibili-transcript) v1.0.0. Main changes:

#### Bug Fixes
- Fixed multi-part video switching sync issue: video info and selector now update correctly when switching parts
- Optimized multi-part list fetching: triple fallback mechanism (page data > DOM parsing > API) for better compatibility
- Fixed batch download list anomaly: auto-fetch full part list when page detection fails

#### Download Logic Rebuild
- Confirmation before batch download: shows file count, save path, and browser multi-file download tips
- Fixed batch file naming: uses individual part title instead of collection title
- Collection folder feature: auto-create folder named after collection for batch download
- Auto path creation: automatically create multi-level directories

#### Experience Optimization
- Adjusted default settings for better out-of-box experience
- Custom global save path, with persistent storage
- Optimized UI style and responsive layout
- Improved prompt messages for multi-file download

### Supported Export Formats

| Format | Description | Use Case |
| :---: | :---: | :---: |
| TXT | Plain Text | Maximum compatibility |
| MD | Markdown | Note-taking, documentation |
| CSV | Spreadsheet Format | Data analysis |
| XML | XML Format | Technical processing |
| HTML | Web Page Format | Browser viewing |
| SRT | Subtitle Standard | Video encoding, players |
| VTT | WebVTT Format | Web subtitle embedding |
| ASS | ASS Subtitle Format | High-quality video encoding |
| LRC | Lyrics Sync Format | Music players, lyrics display |
| JSON | JSON Data Format | Program processing, data exchange |

### Installation Requirements
- Browser: Any browser supporting userscripts (Chrome, Firefox, Edge, etc.)
- Script Manager: Tampermonkey, Violentmonkey, or Greasemonkey extension
- Network: Must have access to Bilibili

### Installation Steps

#### Method 1: ScriptCat (Recommended)
Install directly from ScriptCat script marketplace.

#### Method 2: Manual Installation
1. Install a script manager extension for your browser
   - [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - Greasemonkey
2. Click to install: [bilibili-transcript.user.js](./bilibili-transcript.user.js)
3. Visit any Bilibili video page - the script activates automatically

### Usage Guide
1. Open any Bilibili video page
2. A floating button appears in the bottom-right corner
3. Click the button to open the subtitle extraction panel
4. Select subtitle source (current video / part list / series)
5. Choose the subtitle to extract
6. Configure export format and filename options
7. Click download or copy

### Interface Preview
- Floating Button: Circular button at bottom-right, opens main panel
- Subtitle Panel: Shows video info, subtitle list, search box, and action buttons
- Settings Panel: Customize filename format, download method, etc.
- Batch Download Panel: Select multiple videos for batch downloading

### Notes
- This script is for personal learning and research only, please do not use for commercial purposes
- Respect subtitle creators' work and use responsibly
- Some videos may not have subtitles or subtitles may be unavailable
- Ensure stable network connection while using

### FAQ
**Q: Why do some videos have no subtitles?**
A: Not all Bilibili videos have subtitles. Typically only videos with user-uploaded subtitles or AI-generated subtitles are available.

**Q: How to extract all subtitles from a series?**
A: Select the "Series" option in the subtitle panel to see all videos in the series, then batch select and download.

**Q: Exported files appear garbled, what to do?**
A: Try exporting in different formats - TXT has the best compatibility.

### Changelog
#### v1.0.0 (Original)
- Initial release
- 10 format export support
- Subtitle search and navigation
- Batch download functionality

### Credits
Tribute to the pioneer creators **王子周棋洛 (bilidown)** and **leiurayer (downkyi)**. Thank the predecessors for their exploration and contribution, which laid the foundation for subsequent development.

### Disclaimer
1. This script is for personal learning and research purposes only. Commercial use is strictly prohibited.
2. The copyright of subtitle content belongs to the original video creators and Bilibili. Please respect the creators' work and use it properly.
3. This script is only a subtitle extraction tool and makes no guarantees about the accuracy or completeness of the subtitle content.
4. Users shall bear all risks and consequences arising from the use of this script.

### License
This project is open source under the MIT License.
