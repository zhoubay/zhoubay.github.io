---
title: "From hypothesis to experiment"
subtitle_zh: "中间层：Sub-claims 与 Assay"
subtitle_en: "The middle layer: from claims to sub-claims and assays"
series: "Function to Protocol schema"
series_part: 2
date: 2026-05-25
last_modified_at: 2026-05-25
permalink: /blog/from-hypothesis-to-experiment-part-2/
categories: [blog]
tags:
  - hypothesis
  - claims
  - sub-claims
  - assay
  - protein-function
  - ai4science
  - protocol
locale: zh
lang: zh-CN
excerpt: "在概念层的 hypothesis 与 claims 之后，中间层负责把 claim 拆解为可实验判定的 sub-claims，并为每个 sub-claim 匹配能够产生证据的 assay。本文系统梳理中间层的设计原则、对象定义与输出结构。"
author_profile: false
classes:
  - wide
math: true
toc: true
read_time: true
share: true
related: false
comments: false
---

随着越来越多的蛋白质被计算方法自动标注，社区中仍然存在一个明显的 gap：**我们生成蛋白质功能假设的速度越来越快，但验证这些功能假设的速度仍然非常慢**。

在这里，我们尝试对“从一个 hypothesis 开始，到最后完成实验验证”的过程进行一次系统性的归纳和梳理。

需要注意的是，在本文中，我们所说的 **hypothesis** 指的是一段描述蛋白质功能、性质或作用机制的自由文本。它可以来自传统的序列/结构比对方法，也可以来自机器学习模型、深度学习模型，或者最近的多模态大模型。

从 hypothesis 到最终实验验证，我们可以把整个过程大致分成三个层面：

- **概念层**
  - hypothesis
  - claims
- **中间层**
  - sub-claims
  - assays
- **物理层**
  - protocols
  - devices / human operators

接下来，我们分层进行阐述。
## 中间层

中间层是连接概念层和物理层的层次。

概念层处理的是 hypothesis、claim 这类自然语言或半结构化的科学命题；物理层处理的是 protocol、instrument、sample、operator、device 这类可以被实验室系统执行的对象。中间层的作用，就是把一个上游 claim 转换成物理层能够理解、执行和回填结果的形式。

换句话说，中间层回答的问题不是：

> 这个 hypothesis 听起来是否合理？

也不是：

> 实验人员应该一步一步怎么操作？

而是：

> 为了判断这个 claim 是否成立，我们需要拆成哪些更小的、可实验判定的 sub-claims？  
> 每个 sub-claim 应该由什么类型的 assay 来产生证据？  
> 什么样的实验结果支持它，什么样的实验结果拒绝它，什么样的结果只能说明证据不足？

因此，中间层主要包含两个核心对象：

1. **Sub-claim**
2. **Assay**

Sub-claim 和 Assay 是一体两面的关系。
- **Sub-claim** 更接近概念层。它的任务是把上游 claim 拆解成若干个更小、更明确、更可实验判定的命题。
- **Assay** 更接近物理层。它的任务是把某个 sub-claim 绑定到一套可以产生证据的实验设计中，包括 readouts、controls、replicates、support criteria、refutation criteria 等。

可以简单理解为：

| 层次        | 主要问题                      | 输出对象                                 |
| --------- | ------------------------- | ------------------------------------ |
| Claim     | 我们想判断的科学命题是什么？            | 一个相对完整的 statement                    |
| Sub-claim | 为了判断这个 claim，需要拆成哪些更小的命题？ | 可实验判定的局部 statement                   |
| Assay     | 用什么实验计划产生证据？              | readouts、controls、criteria、resources |
| Protocol  | 实验具体怎么做？                  | 可执行步骤、仪器参数、操作流程                      |

需要注意的是，**凭空生成 assay 是不可靠的**。一个 sub-claim 是否可以被某类 assay 支持，应该尽量依赖已有的人类知识库、标准实验范式、文献、数据库或实验室内部 SOP，而不是只由语言模型直接想象出来。

因此，从 sub-claim 到 assay 的过程更合理的方式是：

1. **Retrieve**：从已有知识库、文献、protocol database 或实验室 SOP 中检索相关 assay。
2. **Rank**：根据 sub-claim 的对象、关系、条件、readout 需求，对候选 assay 进行排序。
3. **Adapt**：如果已有 assay 不能完全匹配当前 sub-claim，则以已有 assay 作为模板进行微调。
4. **Justify**：记录为什么选择这个 assay，它对应哪个 sub-claim，哪些地方是从已有模板修改而来。
5. **Validate**：检查 assay 的 readouts 是否真的能够支持或拒绝对应的 sub-claim。

最后，在中间层结束之前，需要安排一次内容检查。因为中间层的输出会直接影响物理层的实验执行，所以必须确保这里的逻辑拆解、assay 选择和判定标准都是一致的。否则，上游 claim 的表达错误、sub-claim 的拆解错误，或者 assay 与 sub-claim 的错配，都会污染最后的实验结果。

---
### Sub-claims

Sub-claim 是从 claim 中拆解出来的、更小的、可实验判定的科学命题。

一个 claim 往往太大、太抽象，不能直接进入实验层。例如：

> This protein functions as a receptor for insulin-like growth factors \(IGFs\).

这个 claim 看起来很清楚，但如果要实验验证，就会立刻遇到很多问题：

- 这里的 IGFs 指的是 IGF-1、IGF-2，还是更广义的 IGF-like ligands？
- “functions as a receptor” 是只要求 ligand binding，还是还要求 downstream signaling？
- 这个 receptor function 是在体外体系中判断，还是在细胞环境中判断？
- 如果这个蛋白能结合 IGF-1 但不能结合 IGF-2，算不算支持原始 claim？
- 如果它能结合 IGF ligand，但不能激活下游 signaling，算不算 receptor？

这些问题说明，claim 需要被拆成更明确的 sub-claims。

Sub-claim 的目标不是把一句话机械地切成更短的句子，而是要把 claim 拆成**可以分别获得证据、分别判断状态、并最终组合回原始 claim 的局部命题**。

一个好的 sub-claim 通常应该满足以下条件：

1. **对象明确**  
   例如，不只是说 “binds IGFs”，而是明确为 “binds IGF-1” 或 “binds IGF-2”。

2. **关系明确**  
   例如，是 binding、activation、inhibition、localization，还是 pathway regulation。

3. **判定方向明确**  
   应该能说清楚什么结果支持它，什么结果拒绝它，什么结果只能算 inconclusive。

4. **能够映射到 assay**  
   Sub-claim 本身仍然是概念层命题，但它必须足够具体，以便后续可以找到对应的 assay。

每一个 sub-claim 至少需要包含以下信息：

| 字段                      | 含义                             |
| ----------------------- | ------------------------------ |
| `sub_claim_id`          | sub-claim 的唯一 ID。              |
| `parent_claim_id`       | 它来自哪个上游 claim。                 |
| `statement`             | sub-claim 的自然语言陈述。             |
| `support_criteria`      | 什么样的证据在概念上支持这个 sub-claim。      |
| `refutation_criteria`   | 什么样的证据在概念上拒绝这个 sub-claim。      |
| `inconclusive_criteria` | 什么情况不能支持也不能拒绝，只能认为证据不足。        |
| `safety_notes`          | 与这个 sub-claim 相关的安全、伦理或材料风险提示。 |

这里需要区分三种状态：

| 状态             | 含义                           |
| -------------- | ---------------------------- |
| `supported`    | 当前证据支持 sub-claim。            |
| `refuted`      | 当前证据拒绝 sub-claim。            |
| `inconclusive` | 当前证据不足、实验失败、上下文不匹配，或者结果互相矛盾。 |

也就是说，sub-claim 的结果不应该被强行二分成“支持”和“拒绝”。在真实实验中，很多结果既不能支持也不能拒绝，只能说明当前 assay、样本、条件或 readout 不足以做出判断。

---
#### 例子：将 IGF receptor claim 拆解为 sub-claims

假设上游 claim 是：

| claim id | statement                                                                      |
| -------- | ------------------------------------------------------------------------------ |
| `C0`     | This protein functions as a receptor for insulin-like growth factors \(IGFs\). |

如果我们暂时采用一个相对弱的定义：

> 只要该蛋白能特异性结合至少一种 IGF ligand，就认为它在 ligand-binding 意义上支持 IGF receptor claim。

那么可以拆成两个 sub-claims：

| sub-claim id | statement                              |
| ------------ | -------------------------------------- |
| `S1`         | This protein specifically binds IGF-1. |
| `S2`         | This protein specifically binds IGF-2. |

这时，支持或拒绝上游 claim 的规则可以写成：

```text
support(C0) = supported(S1) OR supported(S2)
refute(C0) = refuted(S1) AND refuted(S2)
inconclusive(C0) = NOT support(C0) AND NOT refute(C0)
```

也就是说：

| S1: binds IGF-1 | S2: binds IGF-2 | C0 判断           |
| --------------- | --------------- | --------------- |
| supported       | supported       | support C0      |
| supported       | refuted         | support C0      |
| refuted         | supported       | support C0      |
| refuted         | refuted         | refute C0       |
| inconclusive    | supported       | support C0      |
| supported       | inconclusive    | support C0      |
| inconclusive    | refuted         | inconclusive C0 |
| refuted         | inconclusive    | inconclusive C0 |
| inconclusive    | inconclusive    | inconclusive C0 |

但是，如果我们采用一个更强的定义：

> 一个 functional IGF receptor 不仅要能结合 IGF ligand，还需要在相关 context 中触发 receptor activation 或 downstream signaling。

那么上面的拆解就不够了。我们还需要增加一个 sub-claim：

| sub-claim id | statement                                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `S3`         | Binding of IGF-1 or IGF-2 to this protein leads to receptor activation or downstream signaling in a relevant biological context. |

这时，强版本 claim 可以写成：

```text
support(C0_strong) = (supported(S1) OR supported(S2)) AND supported(S3)
refute(C0_strong) = (refuted(S1) AND refuted(S2)) OR refuted(S3)
inconclusive(C0_strong) = NOT support(C0_strong) AND NOT refute(C0_strong)
```

这说明，同一个原始 claim 可以有不同强度的形式化版本。中间层需要明确当前使用的是哪一种定义，否则后面的 assay 设计会变得混乱。

---

#### Sub-claim 形式化表示

对于上面的例子，可以把 sub-claims 写成下面的结构：

| sub_claim_id | parent_claim_id | statement                                                                         | support_criteria                                                       | refutation_criteria                                                               | inconclusive_criteria                                                 | safety_notes                       |
| ------------ | --------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------- |
| `S1`         | `C0`            | This protein specifically binds IGF-1.                                            | 存在可重复的、特异性的 IGF-1 binding evidence，并且能够排除明显的 nonspecific binding。      | 在蛋白质量、ligand 质量和检测系统均合格的情况下，反复未观察到 IGF-1 specific binding。                        | 蛋白不稳定、ligand 失活、背景过高、positive control 失败、不同实验结果矛盾。                    | 如果使用细胞系统，需要考虑细胞来源、培养条件和生物安全等级。     |
| `S2`         | `C0`            | This protein specifically binds IGF-2.                                            | 存在可重复的、特异性的 IGF-2 binding evidence，并且能够排除明显的 nonspecific binding。      | 在蛋白质量、ligand 质量和检测系统均合格的情况下，反复未观察到 IGF-2 specific binding。                        | 蛋白不稳定、ligand 失活、背景过高、positive control 失败、不同实验结果矛盾。                    | 如果使用细胞系统，需要考虑细胞来源、培养条件和生物安全等级。     |
| `S3`         | `C0`            | IGF binding to this protein leads to receptor activation or downstream signaling. | IGF stimulation 后出现与该蛋白相关的 activation 或 downstream signaling evidence。 | 在系统有效、表达正常、ligand 有效的情况下，IGF stimulation 不引起相关 activation 或 downstream signaling。 | 细胞模型不表达必要 cofactor、readout 不敏感、内源性 receptor 干扰、activation marker 不明确。 | 细胞实验可能涉及人源细胞、转染或刺激处理，需要根据材料进行安全审查。 |

这个例子展示了 sub-claim 的作用：它不是直接给出实验步骤，而是把一个较大的 claim 拆成可以被 assay 分别判断的小命题，并且为每个小命题定义清楚支持、拒绝和不确定的条件。

---

### Assay

Assay 可以定义为：

> "a planned process with the objective to produce information about the material entity that is the evaluant, by physically examining it or its proxies"

也就是说，assay 是一个有计划的过程，它的目标是通过对评估对象 \(evaluant\) 本身或其替代物 \(proxies\) 进行物理检查，从而产生关于该实体的信息。[引用](https://doi.org/10.1093/database/baab040)

用更通俗的话来说，一个 assay 至少包含四个关键点：

1. **它是一个有计划的过程**  
   Assay 不是随便观察一下，而是事先设计好的检测过程。  
   例如，随手拿起一管蛋白对着灯看一下，不算 assay；按照一个明确方案测定蛋白浓度，则可以算 assay。

2. **它的目标是产生信息**  
   Assay 的直接目标是获得数据或判断，而不是获得产物。  
   例如，纯化蛋白的主要目标是得到蛋白样品，因此它本身通常不是 assay；测定蛋白浓度的目标是获得关于蛋白样品的信息，因此它是 assay。

3. **它需要物理检查 evaluant 或 proxy**  
   Assay 不是纯粹的推理、想象或文献检索，而是需要对某个物质实体或其替代信号进行检测。  
   例如，测量吸光度、荧光、质谱信号、结合响应、细胞成像信号，都属于通过物理手段获取信息。

4. **它可以直接检查对象本身，也可以检查 proxy**  
   有些性质不能直接观察，因此需要通过 proxy 来判断。  
   例如，酶活性本身不是一个可以直接“看见”的物体，但底物消耗、产物生成、吸光度变化或荧光变化可以作为 enzyme activity 的 proxy。

因此，assay 的作用不是重复 sub-claim，而是把 sub-claim 转换成一套可以获得证据的实验设计。

---

#### Assay 和 Sub-claim 的区别

Sub-claim 和 Assay 都包含 criteria，但二者的 criteria 含义不同。

| 对象 | criteria 的含义 |
|---|---|
| Sub-claim criteria | 概念层面的判定标准，说明什么样的证据在科学意义上支持或拒绝该命题。 |
| Assay criteria | 实验层面的判定标准，说明某个具体 readout 达到什么条件时，认为该 assay 支持或拒绝对应 sub-claim。 |

例如，对于 sub-claim：

> This protein specifically binds IGF-1.

它的 sub-claim support criteria 可以是：

> 存在可重复的、特异性的 IGF-1 binding evidence，并且能够排除明显的 nonspecific binding。

但是到了 assay 层，就必须进一步绑定到具体 readout。例如，如果选择 SPR binding assay，那么 assay criteria 可能会写成：

> 观察到浓度依赖的 binding response；可以拟合出合理的 binding curve；negative control 不显示明显结合；competition 或 reference ligand 能够支持结合特异性。

也就是说：

```text
sub-claim criteria = 概念上的证据要求

assay criteria = 绑定具体 readout 后的操作性判定标准
```

二者必须一致。一个 assay 不能只因为产生了某种信号就自动支持 sub-claim。它必须产生与 sub-claim statement 直接相关的证据。

---

#### Assay 至少需要包含的信息

对于一个 assay 来说，至少需要记录以下信息：

| 字段 | 含义 |
|---|---|
| `assay_id` | assay 的唯一 ID。 |
| `sub_claim_id` | 该 assay 对应哪个 sub-claim。 |
| `operational_statement` | 该 assay 经过重写的，可以被执行的statement |
| `assay_type` | assay 类型，例如 ligand binding assay、cell-based activation assay、localization assay 等。 |
| `assay_template_id` | assay 来源，例如文献、数据库、SOP 或已有实验模板的唯一id。 |
| `assay_template_reviewed` | assay template 是否被人类专家review过。 |
| `evaluant` | 被评估的物质实体，例如某个蛋白、细胞、复合体或样品。 |
| `proxy` | 如果不能直接测 evaluant 的目标性质，则需要说明使用什么 proxy。 |
| `readouts` | assay 产生的可观测数据。 |
| `required_instruments` | 所需仪器。 |
| `required_consumables` | 所需试剂、耗材、样品或标准品。 |
| `support_criteria` | 什么样的 readout 结果支持对应 sub-claim。 |
| `refutation_criteria` | 什么样的 readout 结果拒绝对应 sub-claim。 |
| `inconclusive_criteria` | 什么样的情况说明 assay 无法判断。 |
| `limitations` | assay 的局限性和可能的混杂因素。 |
| `safety_notes` | 与该 assay 相关的安全、伦理和材料处理提示。 |

需要注意，assay 仍然不是 protocol。Assay 说明“要测什么、用什么类型的方法测、读出什么信号、如何判定结果”；而 protocol 才说明“第一步加什么、第二步孵育多久、第三步用什么参数上机”。

这里的 “具体” 不是指 assay 已经包含逐步操作流程。  
Assay 应该具体到足以让系统选择或生成 protocol，但不直接替代 protocol。

更准确地说，assay 是一个 **execution-ready test specification**：

- 它需要绑定 experimental context、instrument class 或具体仪器平台、consumables、controls、readouts 和 criteria；
- 它需要说明什么样的仪器输出会被解释为 support、refutation 或 inconclusive；
- 但它不规定每一步操作的体积、时间、温度、plate layout、仪器 method file 和 operator action sequence。

这些逐步执行细节属于 protocol 层。
---

#### Assay 不应该脱离 Sub-claim

一个常见错误是：先想到某个常见 assay，然后强行把它绑定到 claim 上。

例如，对于 claim：

> This protein functions as a receptor for IGFs.

如果我们直接说：

> 做一个 Western blot。

这其实是不充分的。因为 Western blot 本身只是一个技术平台，它可以用于检测蛋白表达、蛋白大小、磷酸化状态或其他修饰，但它并不自动回答“这个蛋白是否是 IGF receptor”。

只有当我们明确了 sub-claim，比如：

> IGF stimulation leads to phosphorylation of this protein.

这时，Western blot 才可能成为一个 assay 的组成部分：

| sub-claim | assay 设计方向 |
|---|---|
| IGF stimulation leads to phosphorylation of this protein. | 检测 IGF stimulation 后该蛋白的 phosphorylation signal 是否增加。 |

因此，assay 的选择必须由 sub-claim 驱动，而不是由实验技术本身驱动。

---

### 从 Sub-claim 到 Assay 的匹配过程

从 sub-claim 生成 assay 时，不应该直接让模型凭空创造实验方案。更合理的流程是：

```text
sub-claim
  -> generate operational statement
  -> match assay type from top hierarchy of assay database
  -> retrieve and rank assay candidates from assay database
  -> review if assay candidates need modification
  -> adapt selected assay and record parent assay id
  -> define readouts, criteria and metadata
```

具体来说：

#### 1. Generate operational statement

虽然 sub-claim 已经是一个较小的科学命题，但它通常还不是一个可以直接匹配 assay 的实验性陈述。

例如：

> This protein specifically binds IGF-1.

这个 sub-claim 仍然缺少很多实验上下文信息，例如：

- 是在 purified protein 体系中检测 binding，还是在细胞表面检测 ligand binding？
- evaluant 是重组蛋白、表达该蛋白的细胞，还是膜组分？
- ligand 是 purified IGF-1、标记后的 IGF-1，还是固定在 sensor chip 上的 IGF-1？
- readout 预期是 binding response、fluorescence signal、competition signal，还是其他 proxy？

因此，第一步需要把 sub-claim 改写成一个更接近实验设计的 **operational statement**。

例如：

> Test whether the purified candidate protein shows specific, concentration-dependent binding to recombinant IGF-1 in an in vitro ligand-binding assay.

或者：

> Test whether cells expressing the candidate protein show specific IGF-1 binding compared with matched negative-control cells.

Operational statement 的作用是把原始 sub-claim 中隐含的对象、关系、上下文和 readout 需求显式化。它仍然不是 protocol，但已经足够用于后续匹配 assay type 和 assay template。

---

#### 2. Match assay type from top hierarchy of assay database

Assay database 可以被组织成一个树状结构。第一层通常是最粗粒度的 assay type，例如：

- ligand binding assay
- enzyme activity assay
- cell-based activation assay
- localization assay
- interaction assay
- expression assay

在这一步，我们需要把 operational statement 先绑定到一个或多个高层 assay type。

例如，对于：

> Test whether the purified candidate protein shows specific, concentration-dependent binding to recombinant IGF-1.

它首先应该被匹配到：

```text
ligand binding assay
```

而不是直接跳到某个具体 protocol。

这样做的好处是，中间层可以先确定“这个 sub-claim 需要哪一类证据”，再进入更细粒度的 assay 检索。否则系统可能会因为看到某些关键词，就过早选择一个并不真正对齐 sub-claim 的实验技术。

---

#### 3. Retrieve and rank assay candidates from assay database

确定高层 assay type 之后，下一步是在 assay database 中检索候选 assay。

检索可以基于多种信息进行，例如：

- sub-claim statement
- operational statement
- evaluant 类型
- ligand、substrate、analyte 或 perturbation
- readout 需求
- experimental context
- required instruments
- organism、cell type 或 sample type
- 已有 assay template 的标签、描述和适用范围

检索方式可以是关键词检索、结构化字段过滤、embedding 相似度检索，也可以由 LLM 先拆解 operational statement，再生成检索条件。

候选 assay 返回后，需要进行排序。排序时不应该只看文本相似度，而应该重点考虑 assay 是否真正匹配当前 sub-claim 的证据需求。

例如可以考虑：

| 排序因素 | 说明 |
|---|---|
| evaluant 是否匹配 | assay 检测的对象是否就是当前要评估的蛋白、细胞或样品。 |
| target relation 是否匹配 | assay 是否真的检测 binding、activation、localization 等目标关系。 |
| readout 是否合适 | readout 是否能支持或拒绝 sub-claim。 |
| context 是否匹配 | 体外、细胞、组织或体内环境是否与 operational statement 一致。 |
| controls 是否充分 | 是否包含 positive control、negative control、blank、competition control 等。 |
| source 是否可靠 | assay 是否来自文献、数据库、SOP 或专家审核模板。 |
| 可执行性是否合理 | 所需仪器、材料和样本是否在当前实验环境中可获得。 |

这一步的输出不是最终 assay，而是一组排序后的 candidate assays。

---

#### 4. Review whether assay candidates need modification

对于排序靠前的 assay candidates，需要检查它们是否可以直接用于当前 operational statement。

如果某个 candidate assay 在 evaluant、context、readout、controls 和 criteria 上都与 operational statement 对齐，那么它可以被直接选中，并绑定到当前 sub-claim。

例如：

```yaml
selected_assay_id: A123
sub_claim_id: S1
assay_template_id: T_ligand_binding_SPR_001
assay_template_reviewed: true
adaptation_required: false
```

但如果候选 assay 只是部分匹配，就不能直接使用。例如：

- assay 检测的是 EGF binding，但当前 sub-claim 是 IGF-1 binding；
- assay 使用的是 purified protein，但当前需要 cell-surface binding；
- assay 有 readout，但缺少 competition control；
- assay 能检测 binding signal，但不能判断 specificity；
- assay 的 refutation criteria 不适用于当前样本或 context。

这时就需要进入 adaptation，而不是把 candidate assay 原样绑定到 sub-claim。

---

#### 5. Adapt selected assay and record parent assay id

如果没有完全匹配的 assay，可以选择一个或多个最相关的 assay 作为 parent assays，并在此基础上生成新的 assay specification。

这里的 adaptation 应该是对已有 assay 模板的受控修改，而不是凭空生成。

需要记录的信息至少包括：

```yaml
assay_id: A_new
parent_assay_ids:
  - A123
  - A087
adaptation_required: true
assay_template_reviewed: false
adaptation_summary:
  - replaced original ligand with IGF-1
  - added competition control to assess binding specificity
  - changed evaluant from purified receptor domain to full-length protein-expressing cells
adaptation_reason: >
  No existing assay template directly matched the operational statement.
  The selected parent assays were adapted because they share the same
  target relation, similar readout logic, and compatible control structure.
```

一个 adapted assay 必须显式标记为：

```yaml
assay_template_reviewed: false
```

除非它之后经过人类专家或实验负责人 review。

这样做的目的有两个：

1. 保留 assay 来源的可追溯性；
2. 区分“已有、经过审核的 assay template”和“由系统基于已有模板改写出的 assay specification”。

这对于后续质量控制非常重要。因为 adapted assay 虽然可能合理，但它仍然需要经过人工审查，才能进入物理层生成 protocol 或直接执行。

---

#### 6. Define readouts, criteria and other metadata

选定或改写 assay 之后，需要把 assay 中与执行和判定相关的 metadata 明确记录下来。

这一步不是写 protocol，而是把 assay specification 补全到足以支撑后续 protocol generation。

至少需要明确：

| 字段 | 说明 |
|---|---|
| `assay_id` | assay 的唯一 ID。 |
| `sub_claim_id` | 该 assay 对应的 sub-claim。 |
| `operational_statement` | assay 实际要测试的操作性陈述。 |
| `assay_type` | assay 所属的高层类型。 |
| `assay_template_id` | 所使用的模板或来源 ID。 |
| `parent_assay_ids` | 如果是 adapted assay，记录其来源 assay。 |
| `assay_template_reviewed` | 是否经过人类专家 review。 |
| `evaluant` | 被评估的实体。 |
| `proxy` | 如果不能直接检测目标性质，记录使用的 proxy。 |
| `readouts` | assay 产生的可观测数据。 |
| `controls` | positive、negative、blank、vehicle、competition 等 controls。 |
| `replicates` | 技术重复和生物重复的要求。 |
| `support_criteria` | 什么样的 readout 支持 sub-claim。 |
| `refutation_criteria` | 什么样的 readout 拒绝 sub-claim。 |
| `inconclusive_criteria` | 什么情况下 assay 不能做出判断。 |
| `required_instruments` | 所需仪器或仪器类型。 |
| `required_consumables` | 所需样品、试剂、耗材或标准品。 |
| `limitations` | assay 的局限性和可能的混杂因素。 |
| `safety_notes` | 安全、伦理或材料处理提示。 |

其中最关键的是：criteria 必须绑定到具体 readouts，而不能只写成泛泛的“结果显著”或“有阳性信号”。

例如，对于 IGF-1 binding assay，criteria 应该围绕 binding response、dose-dependence、negative control、competition control、background signal 等 readouts 来定义。只有这样，assay result 才能被稳定地转换成 sub-claim status。

---

### Iteration

由于中间层的下一步就是物理层，因此这里必须进行严格的内容检查。

如果中间层中任何一个环节出现问题，例如 sub-claim 拆解不完整、Boolean 逻辑不准确、assay 与 sub-claim 不匹配、readout 不能支持判定、缺少 controls 或 criteria 不清晰，都应该进入 iteration，而不是直接进入物理层执行。

中间层的检查可以分成以下几类。

---

#### 1. Claim-to-Sub-claim 逻辑检查

需要检查的问题包括：

| 检查项 | 说明 |
|---|---|
| sub-claims 是否覆盖了 claim 的关键含义？ | 如果 claim 中包含 binding 和 signaling，但 sub-claims 只覆盖 binding，那么拆解不完整。 |
| sub-claims 是否过度扩展了 claim？ | 不应该加入原始 claim 没有暗示的新命题。 |
| sub-claims 是否粒度合适？ | 太粗会难以验证，太细会导致组合逻辑复杂。 |
| support/refutation 逻辑是否合理？ | 需要明确哪些 sub-claims 支持时可以支持 claim，哪些 sub-claims 被拒绝时可以拒绝 claim。 |
| 是否允许 inconclusive 状态？ | 不能把所有 negative 或 failed assay 都当成 refutation。 |

例如，对于弱版本 IGF receptor claim：

```text
support(C0) = supported(S1) OR supported(S2)

refute(C0) = refuted(S1) AND refuted(S2)

inconclusive(C0) = NOT support(C0) AND NOT refute(C0)
```

这个逻辑是合理的，因为只要支持 IGF-1 或 IGF-2 binding 中任意一个，就可以支持“该蛋白是某种 IGF ligand 的 receptor”这个较弱版本 claim。

但是，对于强版本 claim，就必须加入 activation 或 signaling：

```text
support(C0_strong) = (supported(S1) OR supported(S2)) AND supported(S3)
```

否则，系统可能会把一个只能结合 IGF ligand、但没有 receptor activation 功能的蛋白错误地判断为 functional receptor。

---

#### 2. Sub-claim-to-Assay 对齐检查

每一个 sub-claim 都需要至少有一个对应 assay。

需要检查的问题包括：

| 检查项 | 说明 |
|---|---|
| 每个 sub-claim 是否都有对应 assay？ | 如果没有 assay，就无法进入物理层。 |
| assay 是否真的测试了 sub-claim？ | 不能用不相关 readout 间接替代。 |
| assay 的 proxy 是否合理？ | 如果 proxy 与目标性质关系太远，结果解释会不可靠。 |
| assay 是否有 positive control 和 negative control？ | 没有 controls 的结果很难解释。 |
| assay 是否有明确的 support/refutation/inconclusive criteria？ | 如果没有 criteria，实验结果无法自动回填到 sub-claim 状态。 |

例如：

| sub-claim | 错误 assay 匹配 | 问题 |
|---|---|---|
| This protein specifically binds IGF-1. | 只检测该蛋白的表达量。 | 表达量不能说明它是否结合 IGF-1。 |
| This protein activates downstream signaling after IGF stimulation. | 只做 in vitro ligand binding。 | ligand binding 不能证明 downstream signaling。 |
| This protein localizes to mitochondria. | 只做 sequence similarity search。 | 序列相似性可以作为预测证据，但不是物理检查意义上的 localization assay。 |

---

#### 3. Assay 可执行性检查

Assay 需要足够具体，才能交给物理层继续转换为 protocol。

需要检查的问题包括：

| 检查项 | 说明 |
|---|---|
| readouts 是否明确？ | 例如 binding response、fluorescence intensity、phosphorylation level、cell count 等。 |
| required instruments 是否明确？ | 例如 SPR、plate reader、flow cytometer、microscope、LC-MS 等。 |
| required consumables 是否明确？ | 例如 ligand、antibody、substrate、cell line、buffer、sensor chip 等。 |
| controls 是否明确？ | 包括 positive control、negative control、blank、vehicle control 等。 |
| replicates 是否明确？ | 至少需要说明技术重复和生物重复的要求由 assay template 或实验上下文决定。 |
| criteria 是否绑定 readouts？ | support/refutation 不能只写“结果显著”，而要说明针对哪个 readout。 |
| limitations 是否记录？ | 例如 proxy 不直接、背景高、内源性通路干扰、样本质量依赖等。 |

---

#### 4. 信源检查

Assay 选择需要有可追溯来源。

需要检查的问题包括：

| 检查项 | 说明 |
|---|---|
| assay 是否来自已有知识库、文献、数据库或 SOP？ | 避免凭空生成 assay。 |
| 是否记录了 source 或 template？ | 后续可以追踪 assay 的来源。 |
| 是否说明了 adaptation？ | 如果对已有 assay 做了修改，需要记录修改内容和原因。 |
| source 是否与当前 sub-claim 匹配？ | 不能引用一个看似相关但实际 evaluant、readout 或 context 不匹配的 assay。 |

可以为每个 assay 记录：

```yaml
source_or_template:
  type: literature | database | internal_SOP | expert_defined_template
  citation: ...
  matched_components:
    - evaluant
    - analyte_or_ligand
    - readout
    - controls
  adaptations:
    - replaced ligand with IGF-1
    - changed readout from endpoint signal to dose-response curve
    - added competition control
  justification: >
    This assay template directly measures ligand-protein binding,
    which is aligned with the sub-claim that the candidate protein
    specifically binds IGF-1.
```

---

#### 5. 结果模拟检查

在真正进入物理层之前，最好先做一次“结果模拟”。

也就是说，假设每个 assay 最后返回不同结果，检查系统是否能够根据这些结果自动判断最终 claim 的状态。

例如，对于弱版本 claim：

```text
C0: This protein functions as a receptor for IGFs.

S1: This protein specifically binds IGF-1.
S2: This protein specifically binds IGF-2.

support(C0) = supported(S1) OR supported(S2)
refute(C0) = refuted(S1) AND refuted(S2)
inconclusive(C0) = NOT support(C0) AND NOT refute(C0)
```

可以模拟如下结果：

| A1 result | S1 status | A2 result | S2 status | final C0 status |
|---|---|---|---|---|
| positive binding | supported | negative binding | refuted | supported |
| negative binding | refuted | positive binding | supported | supported |
| negative binding | refuted | negative binding | refuted | refuted |
| assay failed | inconclusive | negative binding | refuted | inconclusive |
| assay failed | inconclusive | assay failed | inconclusive | inconclusive |
| positive binding | supported | assay failed | inconclusive | supported |

如果这个模拟表无法填写，或者填写后无法得到稳定判断，就说明中间层设计还不完整，需要回到 sub-claim 或 assay 层重新修改。

---

### 中间层的最终输出

一个完整的中间层输出，至少应该包含以下几个部分：

1. **Sub-claim table**
   - 每个 sub-claim 的 ID、statement、scope、support criteria、refutation criteria、inconclusive criteria。

2. **Claim decision rules**
   - 如何由 sub-claims 的状态组合得到最终 claim 的状态。
   - 最好使用 Boolean logic 或更明确的 decision rules 表示。

3. **Assay table**
   - 每个 sub-claim 对应哪些 assays。
   - 每个 assay 的 readouts、controls、replicates、criteria、resources 和 limitations。

4. **Assay-source mapping**
   - 每个 assay 来自哪个知识库、文献、SOP 或模板。
   - 如果做了 adaptation，需要记录 adaptation 的内容和理由。

5. **Alignment report**
   - 检查每个 assay 是否真的能支持或拒绝对应 sub-claim。

6. **Simulation report**
   - 模拟不同 assay 结果是否可以推出最终 claim 的状态。

7. **Iteration flags**
   - 标记哪些地方需要人工审查、补充信息或重新设计。

可以用下面这个结构概括中间层的工作流：

```text
Claim
  -> decompose into Sub-claims
  -> define decision rules
  -> retrieve candidate Assays
  -> rank and adapt Assays
  -> define readouts and criteria
  -> validate Sub-claim-Assay alignment
  -> simulate possible outcomes
  -> output to physical layer
```

因此，中间层的核心任务可以总结为：

> 将概念层中的 claim 转换成一组可实验判定的 sub-claims，并为每个 sub-claim 匹配能够产生证据的 assay，同时定义清楚从 assay result 到 sub-claim status，再到 final claim status 的判断规则。

只有完成这一步之后，物理层才能真正开始生成 protocol、分配仪器、安排实验人员或调用自动化设备。