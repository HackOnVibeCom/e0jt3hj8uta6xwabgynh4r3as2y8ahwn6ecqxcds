StockPilot Local ML - 离线版
============================

这个版本把 StockPilot 的 Random Forest 分类模型和回归模型嵌入 index.html。
打开网页时，Machine Learning 推理在当前设备的浏览器内执行，不需要：
- Python / pip
- Enzonic 或其他云端服务器
- ML API Key
- 网络连接来执行预测

开始使用
--------
1. 解压整个 ZIP 文件。
2. 打开 StockPilot_Local_ML 文件夹。
3. 使用 Chrome / Edge / Safari 打开 index.html，即可直接进入 Owner Workspace；无需 Sign In。
4. Staff Management 只用于维护员工姓名、用户名和账号状态，不再提供密码查看、设置或修改，也不提供员工 Sign In。
5. 在 Inventory 中新增/编辑食材，或对 Demo/新食材执行 Stock In、Stock Out → Usage、Waste、库存盘点或到期设置。
5. 每次成功保存库存操作后，StockPilot 会自动对该食材运行本地 ML；不需要手动添加到 AI 页面。
6. 打开 AI Inventory Intelligence，只显示已经发生过实际库存操作的食材；尚未操作的 Demo 目录项目不会预先列出。
7. 需要未来的到期日期才能产生到期预测；未设置日期或到期日已过时会显示原因，而不会伪造预测。

重要说明
--------
- 每个人的数据保存在自己的浏览器 localStorage 中，不会自动同步给你或其他朋友。
- 清除浏览器网站数据可能会删除本地库存记录；请自行定期导出/备份（如产品提供导出功能）。
- 本机预测不代表模型已具备真实商业准确性。当前优化模型仍使用合成/模拟情境训练，尚未使用真实餐厅到期结果验证。
- “Expiry Risk”是模型对“到期时仍有库存”的代理目标概率，不是直接预测会丢弃多少食物。
- Dairy、Fruits、Meat、Vegetables 使用模型训练过的类别特征；其他类别也会执行预测，但使用中性类别回退（one-hot 全零），结果应视为探索性原型输出。
- 这是可运行的本地 ML 原型，不是多用户共享数据库或正式生产系统。

技术说明
--------
- RandomForestClassifier：150 棵树，预测到期时仍有库存的代理风险概率。
- RandomForestRegressor：350 棵树，预测到期时剩余库存数量。
- 模型树结构已转换为 JavaScript 数据并内嵌在 index.html。
- 预测逻辑在浏览器本地执行，不再请求 http://127.0.0.1:8000。

模型优化记录（Version 2.0）
--------------------------
- 使用 16 个现有 Demo 食材作为模拟情境基础；另生成 3 组明确为合成的 Fruits 类别原型，以保留模型现有四类输入支持。
- 共生成 2,280 条合成情境记录；按食材/原型分组留出 480 条进行独立测试。
- 对比旧模型与新模型时，使用同一组模拟测试情境。新模型在该测试中的 F1-score 为 0.903（旧模型 0.584），剩余库存 MAE 为 0.692（旧模型 1.450）。
- 这些指标只代表对本项目模拟情境生成器的表现，不是现实餐厅的准确率或保证。
- 详细参数、指标和限制请查看 ML_MODEL_INFO.txt。


V5 修正：AI Inventory Intelligence 改为库存事件触发。只有发生过库存操作记录的项目才会显示；Demo 食材和用户新增食材使用相同触发逻辑。每次库存操作后自动重新分析该项目。


V6 修改：每次新增/编辑食材、Stock In、Stock Out、Stock Taking、Stock Adjustment、Waste 或追踪设置更新，都会重新评估该食材。少于 3 次明确标记为 Usage 的 Stock Out 时，只显示数据不足状态，不显示数值预测；达到 3 次后自动执行现有本地 ML 模型。此 3 次是产品数据门槛，不代表预测准确度保证。


V9 比赛演示数据流程
-------------------
- Settings > ML Data Collection 现在分别显示 Synthetic / Demo Dataset 和 User / Operational Dataset 的数量。
- Demo 目录食材产生的库存事件、Waste、预测快照和到期结果会保留，并在导出 JSON 的 syntheticDemoDataset 节点中单独输出。
- 用户新增食材及其数据会进入 operationalDataset。顶层兼容字段仍然只包含 User / Operational 数据。
- 导出的 supervisedTrainingExamples 只会把同一 itemId + expiryDate 的成功预测输入快照与 outcomeStatus=observed 的到期结果配对。模型自身的预测输出绝不作为训练标签。
- Demo 训练样本明确标记 isSynthetic=true；它们可用于比赛演示、模拟实验和实验性模型训练，不可用来宣称真实餐厅准确率。
- 未确认到期结果不会自动变成 0，也不会被生成成虚假的监督学习标签。
- 导出 JSON 只准备并分离数据，不会自动训练或替换网页内嵌 Random Forest 模型。重新训练仍需在 Python/Colab 等训练环境中进行，并经独立评估后再部署。


V10：浏览器内自动 Random Forest 再训练
-------------------------------------
- 自动再训练在本地浏览器运行，不需要 Python、服务器或 API。
- 触发时机：新增/更新“已确认到期结果”时，以及打开 AI Inventory Intelligence 检查是否有尚未处理的新标签时。普通 Stock In / Stock Out 会重新评估预测，但不会单独触发模型训练。
- 训练样本：每个 itemId + expiryDate 只取到期前最近一次成功预测的 apiRequestFeatures，并与相同 itemId + expiryDate 的 expiryOutcome 配对。
- 分类目标：remainingAtExpiry > 0 表示到期时仍有剩余库存（1），否则为 0。
- 回归目标：remainingAtExpiry / snapshot current_stock 的比例；只使用分母大于 0 且剩余量不超过快照库存的可兼容样本，推理时再乘以当前库存数量。
- 最低门槛：至少 12 个不同 item/expiry 标签，并且分类目标两类各至少 3 个；否则保持当前模型并显示等待状态。
- 验证方式：按目标类别分层留出约 25% 的 item/expiry 样本；候选分类器需改善 Brier score 且 F1 不明显下降，候选回归器需降低留出集 MAE，才会替换对应模型组件。
- 训练器使用浏览器 JavaScript 建立 CART 决策树，并以 bootstrap bagging 形成 Random Forest。模型保存到当前浏览器 localStorage 的 StockPilot 数据中。
- 若候选模型没有在留出集上超过当前模型，系统保留原模型；不会因为有新记录就强行替换。
- Demo 工作流产生的已确认结果会标记为 Synthetic/Demo 来源；User 工作流结果标记为 Operational 来源。二者来源计数分开保存，但本地自动训练可使用两类已确认结果。Demo 训练不代表真实餐厅准确率。
- 预测快照不是标签。只有过期处理流程成功重建到期库存余额并记录 outcomeStatus=observed，才可作为训练目标。Unknown 结果一律不参加训练。
- 当前模型按“食材 + 到期日期”选最近预测快照，每个到期批次贡献一个样本，避免重复快照造成同一批次过度加权。
- 本地训练模型只保存在当前浏览器；不会自动同步到朋友设备。若需让其他设备使用训练后的模型，需要导出训练状态/模型并部署到对应设备；当前 ZIP 没有云端同步功能。

V12：Hackathon Login & Staff Account Management
-----------------------------------------------
- 新增 Username + Password 登录页，替代原本无需验证即可切换 Owner / Staff 的角色菜单。
- 登录页提供小型 Use Demo Account 链接；点击后可选择 Fill Owner Account 或 Fill Staff Account，自动填入账号及密码，但不会自动登录。
- 比赛演示账号：
  Owner：stockpilot_owner / Owner@2026Demo
  Staff：stockpilot_staff / Staff@2026Demo
- Owner 的 Staff Management 可查看员工 Username 和演示密码，可新增员工账号、修改密码、启用/停用及删除员工账号。
- Owner 可查看 Successful login、Failed login、Logged out 事件及马来西亚时间（MYT）；本版本不收集设备或浏览器信息。
- 登出时间只会在用户点击 Log Out 时记录；直接关闭浏览器或标签页不保证产生登出记录。
- 重要限制：当前仍是纯前端 localStorage 演示版本。账号、密码和登录记录都保存在当前浏览器，不会跨电脑/手机同步；评审在另一台设备登录时，Owner 的浏览器不会自动看到那台设备的记录。
- 这是比赛演示登录，不是正式安全认证。为满足演示中 Owner 查看 Staff 密码的要求，Staff 密码以可查看的演示字段保存在本地浏览器。请勿使用真实员工密码、重复使用的密码或真实业务资料。
- 若要让评审在自己的手机/电脑登录后，Owner 即时看到跨设备登录记录及共享库存数据，下一阶段必须接入线上 Backend 和中央数据库；仅靠此 HTML/localStorage 版本无法实现。


V15：Competition Demo Complete Dataset
-------------------------------------
- 首次打开 V15 时，会将内置 Competition Demo 工作区初始化为完整的合成演示数据；只替换内置 Demo 数据，不删除用户自己新增的 Operational 数据。
- 预载 8 种食材，包含正常库存、低库存、缺货、即将到期和已过期样例。
- 预载 64 条库存事件（Stock In、Usage、Waste、Stock Taking），以及 8 条 Waste Ledger 记录，数量前后保持一致。
- 预载 12 组明确标记为 Synthetic/Demo 的历史到期标签，用于演示浏览器内 Random Forest 自动再训练评估；加上 Lettuce 的一条到期处理结果。该数据不是真实餐厅观测值。
- V16 比赛演示默认只预载一个 Staff 账号：stockpilot_staff / Staff@2026Demo。Owner 仍可在 Staff Management 中自行新增其他员工；重置 Demo Data 会恢复为一个内置比赛 Staff 账号。
- 预载该 Staff 账号及带有 Demo sample 标记的登录活动。真实登录/登出仍会在当前浏览器新增记录。
- 各食材有至少 3 条明确的 Stock Out → Usage 记录和未来到期日期，AI 页面打开时会调用嵌入式模型实际生成当前预测快照；Waste Analytics 图表根据记录的 Waste 成本和模型预测计算显示。
- Settings > ML Data Collection 可查看 Synthetic/Demo 与 Operational 数据分区。点击 Reset Demo Data 会重新建立完整演示数据集；注意：重置会清除此浏览器内的用户新增食材、库存记录及员工账号，请先备份需要保留的数据。
- 为透明起见，合成样例与真实运营记录会在数据字段中分开标记。不要把演示记录、自动再训练结果或模型预测描述成经真实餐厅验证的结果。
- 所有数据仍保存在当前浏览器 localStorage；不同设备之间不会同步。


V40：移除登录与员工密码管理
--------------------------
- 网站启动后直接进入 Owner Workspace，不再显示 Sign In 页面或 Log Out 控件。
- 移除用户名/密码验证及登录会话流程。
- Staff Management 不再显示员工密码，也不能新增或修改密码；员工姓名、用户名、启用/停用和删除功能保留。
- 旧版本 localStorage 中的 Owner / Staff 密码字段会在载入时清除。
- Login Activity 仅保留已有历史记录展示；由于登录功能已移除，不会再产生新的登录/登出事件。
