# 一 Team 一 VoxYZ：产品愿景与路线图

## 1. 愿景

**目标**：把 agent-teams 中的每个 **team** 打造成「一个 VoxYZ」——  
即一个由多 Agent 协作、实时可见、任务/使命驱动的「小公司」或「作战室」。

参考 [VoxYZ The Stage](https://www.voxyz.space/stage)：

- 多个 Agent 以「角色」形式呈现（如 Chief of Staff、Head of Research）。
- **实时动态**：谁在做什么、当前任务/使命、情绪或状态标签。
- **协作可见**：Last talked to、消息与任务流转。
- **管道视图**：想法 → 验证 → 构建 → 已上线（Demand Radar 风格）。

在 agent-teams 中：

- **一个 team** = 一个 VoxYZ 实例。
- **成员 (members)** = 多个 Agent（Codex / Claude / Gemini）。
- **任务 (tasks)** = 当前工作项；可对应 VoxYZ 的 mission/step。
- **Stage 视图** = 该团队的「实时作战室」页面。

---

## 2. 现状 vs 目标（差距）

| 能力 | 当前 agent-teams | VoxYZ / 目标 |
|------|------------------|--------------|
| 多 Agent 身份 | ✅ 成员 name/platform/description | ✅ 可扩展为 role（如 Head of Research） |
| 任务与认领 | ✅ 任务 + assignee，看板 | ✅ 保持；可增加「使命」分组（可选） |
| 成员状态 | ✅ 运行中/已停止 | ✅ 增加「当前任务」「最近活动」 |
| 消息/协作 | ✅ Mailbox（成员↔成员、成员↔lead） | ✅ 用于「Last talked to」与动态 |
| 实时推送 | ✅ WebSocket（任务变更） | ✅ 扩展为「活动流」推送 |
| **Stage 视图** | ❌ 无 | ✅ 每团队一个「Stage」页：成员卡片 + 实时动态 + 任务进度 |
| **活动流** | ❌ 无统一事件 | ✅ 认领/完成/消息等 → 时间线 |
| **管道视图** | ❌ 仅看板三列 | ✅ 可选：Watching → Validating → Building → Shipped |

---

## 3. 核心功能设计

### 3.1 Stage 视图（每团队一个「舞台」）

- **路由**：`/teams/:name/stage`（与现有 `/teams/:name` 详情并列，可用 Tab 或导航切换）。
- **布局**：
  - **顶部**：团队名 + 简要说明；可选「Next in Ns」「Live」「Pause」控制刷新或实时开关。
  - **成员卡片区**：每个成员一张卡片，展示：
    - 头像/图标、名称、平台（如 Claude Opus 4.6）、角色（description 或新字段 role）。
    - **当前任务**：若该成员为某任务的 assignee 且状态为 in_progress，显示任务标题与状态。
    - **状态**：运行中 / 已停止；可选「状态标签」（如 Hit a snag / Idle / Working）。
    - **Last talked to**：最近一条消息的对方（from/to 取最近一条）。
    - **Affect / 状态标签**：可选，后期用简单规则或配置扩展。
  - **实时动态 (Live Feed)**：按时间排序的「活动」列表：
    - 任务被认领、任务完成、状态变更；
    - 消息发送（可摘要：A → B）。
  - **Mission / 任务组**：当前可复用「任务看板」或增加「当前焦点任务」区块（如 1/6 Heartbeat pulse）。

### 3.2 活动流（Activity Feed）数据来源

用现有数据即可做出第一版：

- **任务事件**：认领 (claim)、完成 (complete)、状态更新 → 由服务端在写入时生成「活动」或由前端根据 tasks 历史/updatedAt 推断。
- **消息事件**：`getAllMessages(teamName)` 取最近消息，按 `createdAt` 排序，展示为「A 对 B 说」或「A 发给 lead」。

**后端扩展（可选，用于更清晰的时间线）**：

- 新增 **活动事件** 存储（如 `teams/<name>/activity.json` 或按时间分片）：
  - `task_claimed`, `task_completed`, `task_updated`, `message_sent`, `member_spawned`, `member_shutdown`。
- WebSocket 在任务/成员变更时已推送；可增加 `activity:new` 事件，前端追加到 Live Feed。

### 3.3 数据模型扩展（可选）

- **TeammateMember**：增加可选 `role?: string`（如 "Chief of Staff"），与 `description` 并存（description 偏职责说明，role 偏头衔）。
- **Task**：现有结构已满足「当前任务」展示；若要做「使命」可后续增加 `missionId?: string` 或用标签分组。
- **Pipeline 视图**：可复用 `Task.status`（pending → in_progress → completed）映射为 Watching → Building → Shipped；或引入 `stage?: 'watching'|'validating'|'building'|'shipped'` 与 status 并存。

---

## 4. API 与 WebSocket

### 4.1 现有可复用

- `GET /api/teams/:teamName`：团队 + 成员。
- `GET /api/teams/:teamName/tasks`：任务列表（含 assignee、status）。
- `GET /api/teams/:teamName/members`：成员列表（含 isRunning）。
- `GET /api/teams/:teamName/messages`：全部消息（或按 memberId 过滤）。
- WebSocket：`subscribe` 按 team，已推送 `tasks:updated`、`team:updated`。

### 4.2 建议新增（按阶段）

- **Stage 聚合接口**（推荐先做）：
  - `GET /api/teams/:teamName/stage`  
    返回：`{ team, members, tasks, recentMessages, recentActivity? }`  
    便于前端一次请求渲染 Stage；`recentActivity` 可由服务端从 tasks + messages 拼凑。
- **活动流**（可选）：
  - `GET /api/teams/:teamName/activity?limit=50`  
    返回按时间排序的活动列表（任务事件 + 消息事件）。
- **WebSocket**：  
  若新增 activity 存储，可在任务/消息变更时广播 `activity:new`，前端追加到 Live Feed。

---

## 5. UI 路由与导航

- 在团队详情页增加 **Tab 或链接**：「概览」(当前) | 「Stage」。
- 或：`/teams/:name` = 概览（成员画廊 + 任务看板），`/teams/:name/stage` = Stage 视图。
- Layout 内导航保持：首页团队列表 → 进入某团队 → 概览 / Stage 切换。

---

## 6. 实施阶段建议

### Phase 1：Stage 页面与静态数据（最小可行）

- 新增路由 `/teams/:name/stage`。
- 新页面组件：成员卡片（来自现有 members API）、当前任务（从 tasks 中按 assignee + in_progress 取）、最近消息（getAllMessages 取最近 N 条）。
- 暂不要求「活动」表，用 tasks + messages 在前端或后端拼「最近动态」列表。
- WebSocket 沿用现有：任务/团队变更时刷新 Stage 数据（或轮询）。

### Phase 2：实时与体验

- Stage 页订阅 WebSocket（subscribe team），任务/团队更新时自动刷新。
- 可选：`GET /api/teams/:teamName/stage` 聚合接口，减少前端请求与逻辑。
- 「Last talked to」：从 `getAllMessages` 中按成员取最近一条的 to/from。

### Phase 3：活动流与管道（可选）

- 后端：活动事件存储 + `GET /api/teams/:teamName/activity`。
- WebSocket：`activity:new`。
- 管道视图：新 Tab 或新路由，用 status 或 stage 映射为 Watching → Building → Shipped；可与 Ship Faster 的「Demand Radar」概念对齐。

### Phase 4：角色与扩展

- 成员 `role` 字段；Stage 卡片展示 role。
- 可选：Mission 分组、Affect/状态标签（配置或简单规则）。

---

## 7. 与 Ship Faster / VoxYZ 的对照

- **Ship Faster**：流程与技能、审批门控、runs 落盘；偏「单 Agent 的流程与证据」。
- **VoxYZ 官网 /stage**：多 Agent 状态与活动「直播」；偏「对外展示与品牌」。
- **agent-teams（本方案）**：每个 team = 一个可运行的「多 Agent 作战室」，既有任务与认领（已有），又有 Stage 式实时可见与活动流（新增），便于每个团队自己成为「一个小 VoxYZ」。

---

## 8. 总结

- **一 team 一 VoxYZ**：通过为每个团队提供 **Stage 视图**（成员卡片 + 当前任务 + 最近消息 + 实时动态）和可选的管道/活动流，用现有数据与少量扩展即可实现。
- 优先实现 **Stage 页面 + 聚合 API**，再补实时与活动流，最后再考虑 Mission、Pipeline、role 等扩展，可逐步把 agent-teams 打造成「每个 team 都是一个 VoxYZ」的协作平台。
