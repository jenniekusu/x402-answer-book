## Answer Book

“Answer Book” 是一个基于星座的小占卜 / 自我反思 Web 应用。用户：

- 输入个人信息（姓名、出生信息，仅保存在会话中）
- 提问一个问题
- 点击 “翻开答案书” 按钮
- 支付一次性费用后，获得一句简短的中文回答 + 一条轻量星象提示

本项目只用于 **自我反思与娱乐，不构成任何专业建议**。

技术栈：

- **Next.js App Router + TypeScript**
- **Tailwind CSS**
- **Prisma + SQLite**
- **Coinbase x402 v2**（基于 HTTP 402 的付费接口）

---

## 目录结构（核心部分）

主要相关文件：

- `prisma/schema.prisma`：答案与星象提示的数据库结构
- `prisma/seed.ts`：初始答案库与星象提示 seed 脚本
- `src/lib/astro.ts`：太阳星座计算逻辑（MVP）
- `src/lib/selection.ts`：带权重的随机选择工具
- `src/app/api/answer/route.ts`：付费的 `/api/answer` 接口业务逻辑
- `middleware.ts`：x402 v2 支付中间件，拦截 `/api/answer`

---

## 环境变量

在根目录创建 `.env.local`：

```env
# x402 支付配置
X402_FACILITATOR_URL=   # 由 x402 提供的 facilitator URL
PAY_TO_ADDRESS=0x...    # 接收付款的钱包地址（Base 网络）
CHAIN_ID=base           # 使用 Base 主网 / 测试网时按官方要求填写
TOKEN_ADDRESS=0x...     # Base 上 USDC 合约地址
PRICE=0.5               # 单次提问价格（单位：USDC）
```

如果以上变量未全部配置，`middleware.ts` 会直接放行请求（不做收费），方便本地开发调试。

---

## 数据库与 Seed

### 1. 生成 Prisma Client

```bash
npm run prisma:generate
```

### 2. 运行迁移（SQLite）

```bash
npm run prisma:migrate
```

### 3. 导入初始答案与 astro hints

```bash
npm run prisma:seed
```

`prisma/seed.ts` 会：

- 为 `answers` 表写入不同分类、不同语气、带权重的中文一句话回答
- 为 `astro_hints` 表写入 12 星座 × 多类别 × 多条提示

---

## 付费接口：`POST /api/answer`

- 请求体：

```json
{
  "profile": {
    "name": "你的名字",
    "birthDate": "1995-08-01",
    "birthTime": "12:00",
    "gender": "F",
    "birthPlace": "Shanghai, China"
  },
  "question": "我接下来半年的事业重点是什么？",
  "category": "career"
}
```

- 行为概览：
  - `middleware.ts` 使用 `x402-next` 的 `paymentMiddleware` 对 `/api/answer` 做 402 支付保护
  - 未支付时返回 **HTTP 402**，携带 x402 所需的支付信息
  - 支付完成并带上支付凭证后，请求才会被转发到 `route.ts`
  - `route.ts` 会：
    - 通过生日计算太阳星座
    - 基于分类与 24 小时内的会话历史，从 `answers` 做带权重随机选择，避免重复
    - 从 `astro_hints` 为对应星座与分类挑选一条轻量提示
    - 仅持久化：
      - `sessionId`（cookie）
      - 太阳星座
      - 答案历史（用于 24 小时去重）

返回示例：

```json
{
  "answer": "在事业上，一点点稳步前进，会带来意想不到的转机。放轻一点期待，让一切自然展开。（career·gentle·1）",
  "astroHint": "在事业上，你的独特节奏比外界的催促更值得相信。作为Leo，你最近的直觉特别值得信赖。",
  "cost": "0.5",
  "txRef": "0x...",
  "sunSign": "Leo",
  "disclaimer": "仅供自我反思与娱乐使用，不构成任何专业建议。"
}
```

---

## 开发与测试

### 启动开发服务器

```bash
npm install
npm run dev
```

### 运行单元测试（Vitest）

```bash
npm test
```

目前包含的最小测试：

- `src/lib/astro.test.ts`：太阳星座计算
- `src/lib/selection.test.ts`：带权重随机选择的基本行为

