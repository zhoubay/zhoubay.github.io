---
title: "From hypothesis to experiment"
subtitle_zh: "物理层：Procedure、Transport 与 Resources"
subtitle_en: "The physical layer: procedures, transport, and resources"
series: "Function to Procedure schema"
series_part: 3
date: 2026-06-01
last_modified_at: 2026-06-01
permalink: /blog/from-hypothesis-to-experiment-part-3/
categories: [blog]
tags:
  - hypothesis
  - claims
  - procedure
  - transport
  - resources
  - protein-function
  - ai4science
locale: zh
lang: zh-CN
excerpt: "概念层与中间层之后，物理层负责把已确定的 assay 转换成可执行的 procedure、transport 与 resources。本文系统梳理 Procedure、Transport 及各类 Resource 的定义、关系与输出结构。"
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
  - procedures / transport
  - resources

接下来，我们分层进行阐述。

# 物理层：Procedure、Transport 与 Resources

在前两篇中，我们把“从 hypothesis 到 experiment”的过程分成了三个层面：

- 概念层  
  hypothesis、claims

- 中间层  
  sub-claims、assays

- 物理层  
  procedures、transport、resources

概念层处理的是自然语言或半结构化的科学命题。中间层处理的是如何把 claim 拆解成 sub-claims，并为每个 sub-claim 匹配能够产生证据的 assay。到了物理层，问题进一步改变。

物理层不再回答：

- 这个 hypothesis 是否合理？
- 这个 claim 应该如何拆成 sub-claims？
- 这个 sub-claim 应该用什么 assay 来产生证据？
- 某个 readout 最终是否支持或拒绝 claim？

这些问题都属于概念层或中间层。

物理层真正要回答的是：

> 给定一个已经确定的 assay specification，实验室系统应该执行哪些 procedure？  
> 这些 procedure 之间的样品、数据或中间产物如何流转？  
> 每个 procedure 需要调用哪些 resource？  
> 如果执行失败，应该停止、重试、上报，还是继续但标记异常？

因此，物理层是实验室中真实执行的部分。它的核心任务不是科学解释，而是执行。更准确地说，物理层不承担 scientific reasoning，不负责 claim interpretation，也不负责 assay selection；它只负责把中间层给出的 assay 转换成可以被人、仪器、自动化系统或计算工具执行的操作结构。

换句话说：

> 中间层决定“需要什么证据”。  
> 物理层负责“如何把产生这些证据的过程真实跑起来”。

在本文中，我们将物理层拆成两个主要部分：

- Procedure & Transport
- Resources

其中，Procedure 是物理层的最小执行单元，Transport 是连接不同 Procedure 的有向边，而 Resources 是 Procedure 执行过程中被消耗或被调用的实体与能力。

可以用下面的结构概括：

    Physical Layer
    ├── Procedure & Transport
    │   ├── Procedure：可执行的操作节点
    │   └── Transport：连接 Procedure 的流转边
    │
    └── Resources
        ├── Material Resource
        ├── Device
        ├── Human Operator
        └── Acquisition Channel

接下来，我们分别讨论这两个部分。

---

## Procedure & Transport

在中间层中，assay 被定义为一个能够为 sub-claim 产生证据的实验设计。它包含 evaluant、readout、criteria、controls、resources 等 metadata，也包含一个由多个执行单元组成的过程结构。

但是，assay 本身并不是一个最小执行单元。

一个 assay 往往需要由多个更小的实验操作组合而成。例如，一个 cell-based ligand binding assay 可能包括：

- 细胞培养或复苏
- 细胞表面染色
- ligand incubation
- washing
- flow cytometry acquisition
- data export
- MFI calculation

这些步骤并不应该全部写进一个巨大而臃肿的 protocol 里。相反，它们应该被拆成若干个高内聚、低耦合、可以被复用的执行模块。这里我们把这种最小执行模块称为 Procedure。

### Procedure 的定义

Procedure 可以定义为：

> A procedure is a self-contained, ordered sequence of parameterizable and reproducible steps, executed by a human or machine, that transforms a defined input into a defined output.

也就是说：

> Procedure 是一个自包含的、有序的、可参数化且可复现的步骤序列。它由人或机器执行，并将一个明确的 input 转换为一个明确的 output。

这个定义包含五层含义。

| 内涵 | 说明 |
|---|---|
| 必须由人类或机器执行 | Procedure 必须是可执行的操作，而不是概念判断、文献检索或科学解释。执行者可以是实验人员、自动化设备、仪器软件或计算脚本。 |
| 必须有明确的 input | Procedure 不能凭空开始。它必须声明自己需要什么输入，例如蛋白样品、细胞、染色后的样品、raw signal file 等。 |
| 必须有明确的 output | Procedure 执行后必须产生某种输出，例如处理后的样品、仪器原始文件、浓度数值、图像文件或分析表格。 |
| 步骤必须有序、可参数化、可复现 | Procedure 中的步骤有明确顺序，关键变量必须被显式声明为参数，并且在相同条件下可以被重复执行。 |
| 必须自包含 | 只要 input 和必要 resources 就绪，Procedure 就应该可以独立执行，而不依赖其他 procedure 的内部状态。 |

这里需要特别强调一点：

> Procedure 描述的是一个可复用的操作模板，而不是某个具体 claim 或 sub-claim 的科学含义。

例如，`SPR Ligand Binding Acquisition` 这个 procedure 可以用于检测 IGF-1 binding，也可以用于检测其他 ligand-protein interaction。它本身不应该写死“这个蛋白是否是 IGF receptor”。具体的 evaluant、ligand、浓度梯度和仪器参数可以作为 input 或 parameter 传入；但 procedure 本身应该保持通用和可复用。

因此，我们可以区分两个层次：

| 层次 | 含义 |
|---|---|
| Procedure template | 可复用的操作定义，例如 “SPR Ligand Binding Acquisition”。 |
| Procedure run | 某一次具体执行，例如 “在 2026-05-23 使用 protein X 和 IGF-1 执行 SPR acquisition”。 |

前者是设计对象，后者是执行记录。

---

### Procedure 的三种常见类型

按照在 assay DAG 中所处的位置，一个 procedure 通常可以分为三类：

| 类型 | 作用 | 示例 |
|---|---|---|
| Preparation procedure | 将物料从原始状态转换成 assay-ready 状态 | protein buffer exchange、cell seeding、sample dilution、fluorescent ligand preparation |
| Execution procedure | 在仪器或实验系统中执行主要物理检测 | SPR acquisition、flow cytometry acquisition、plate reader measurement、microscopy imaging |
| Analysis procedure | 将 raw signal 转换成 assay 所需 readout | MFI calculation、binding curve fitting、image segmentation、peak integration |

这三类 procedure 对应 assay 执行过程中的不同阶段：

- preparation procedure 负责准备输入；
- execution procedure 负责产生原始信号；
- analysis procedure 负责把原始信号转换成可用于 assay criteria 的 readout。

需要注意的是，analysis procedure 仍然属于物理层，是因为它是一个可执行、可复现、可参数化的数据处理过程。它不负责解释 readout 是否支持 claim。它只负责把 raw data 转换成预定义的 readout。

例如：

- `Flow Cytometry Acquisition` 输出 FCS 文件；
- `Flow Cytometry MFI Calculation` 从 FCS 文件中计算 gated live cells 的 median fluorescence intensity；
- assay criteria 再根据 MFI 是否达到预设标准，判断 sub-claim 是 supported、refuted 还是 inconclusive。

也就是说：

> Analysis procedure 负责产生 readout；  
> assay criteria 负责解释 readout；  
> claim decision rules 负责组合 sub-claim status。

这三者不应该混在一起。

---

### Procedure 的设计原则

Procedure 的设计可以类比软件工程中的 function 设计。一个好的 function 应该职责单一、接口清晰、命名准确、内部结构简单、副作用明确、错误处理清楚。Procedure 也应该遵循类似原则。

这里我们从六个方面讨论 Procedure 的设计原则：

- 职责
- 接口
- 命名
- 内部结构
- 副作用
- 错误处理

---

#### 1. 职责：一个 Procedure 只做一件事

一个 procedure 应该只负责一个明确的物理或计算操作。

例如：

- 一个 SPR procedure 只负责 SPR acquisition；
- 一个 flow cytometry acquisition procedure 只负责流式上机采集；
- 一个 BCA protein quantification procedure 只负责蛋白浓度测定；
- 一个 image segmentation procedure 只负责从图像中分割对象。

它不应该同时包含样品制备、仪器检测和数据解释。

例如，如果一个 procedure 叫做：

> Cell Lysis and Western Blot

这通常说明它做了不止一件事。Cell lysis 是一个 preparation procedure，而 Western blot detection 是另一个 execution procedure。它们应该拆开，然后在 assay DAG 中通过 transport edge 连接起来。

此外，procedure 内部所有 step 应该处在同一个抽象层级。

例如，如果一个 procedure 中出现下面两步：

1. 准备样品  
2. 用 P200 移液器吸取 25 μL Reagent A 加入 A1 孔

这两步的抽象层级明显不同。第一步“准备样品”本身可以展开成多个具体操作，而第二步已经是一个具体物理动作。它们不应该出现在同一个 procedure 的同一层级中。

一个实用的判断标准是：

> 如果你能从一个 procedure 中提取出一组步骤，而这组步骤可以独立成为另一个 procedure，并被其他 assay 复用，那么原 procedure 很可能做了不止一件事，应该拆分。

---

#### 2. 接口：所有影响结果的变量都必须显式声明

Procedure 必须有清晰的接口。

这里的接口包括：

- input
- output
- parameters
- required resources
- expected state changes
- failure modes

每一个会影响实验结果的变量都应该被显式声明为参数，而不是硬编码在叙述性文本里。

例如，不应该只写：

> incubate for a while at room temperature

而应该声明：

| 参数 | 示例 |
|---|---|
| incubation_time | 30 min |
| incubation_temperature | 25 °C |
| shaking_speed | 300 rpm |
| reagent_volume | 25 μL |
| sample_volume | 100 μL |

参数可以按照逻辑分组，以降低认知负担。例如可以分成：

- sample parameters
- reagent parameters
- incubation parameters
- instrument parameters
- analysis parameters

但是，逻辑分组不意味着减少参数。只要变量会影响结果，就应该显式暴露。

此外，procedure 设计中应尽量避免 boolean flag。

例如，如果一个 procedure 有参数：

> with_competition_control = true / false

并且这个参数会导致整个操作流程出现明显分支，那么这通常说明它其实是两个不同的 procedure：

- ligand binding staining without competition
- ligand binding staining with competition

这种情况下，应该把它们拆开，而不是在一个 procedure 里面用 boolean flag 控制两条不同路径。

Procedure 的 output 也必须可预测。

这里的“可预测”不是说每次数值完全相同，而是说：

> 给定同一类 input、同一组 parameters 和同一套 resources，procedure 应该产生同一类 output，并且 output 的结构、格式和状态应该是预先定义好的。

例如，一个 flow cytometry acquisition procedure 的 output 应该是 FCS 文件，而不是有时候输出 FCS、有时候输出 PDF、有时候输出人工判断结论。

---

#### 3. 命名：名称应该描述唯一效果

Procedure 的命名应该清楚表达它的唯一作用。

一个好的 procedure 名称通常是动作性名词短语或动词短语，例如：

- BCA Protein Quantification
- SPR Ligand Binding Acquisition
- Flow Cytometry Cell Surface Staining
- Fluorescence Plate Reader Measurement
- Confocal Microscopy Image Acquisition
- Flow Cytometry MFI Calculation

一个不好的名称通常包含多个动作，或者需要用 “and” 连接多个任务，例如：

- Cell Culture and Flow Cytometry
- Cell Lysis and Western Blot
- Protein Purification and Activity Assay
- Sample Preparation and Data Analysis

如果你发现一个 procedure 的名字很难起，或者必须用 “and” 才能说清楚，那通常说明它的职责不够单一，应该继续拆分。

换句话说：

> 难以命名，往往意味着边界不清。  
> 边界不清，往往意味着 procedure 做了不止一件事。

---

#### 4. 内部结构：步骤应尽量短、平、清晰

Procedure 没有固定的最大步骤数。因为真实实验的复杂度取决于实验体系、仪器和样品，而不是由设计者人为规定。

但是，一个 procedure 仍然应该尽可能短、平、清晰。

如果一个 procedure 的步骤多到需要翻好几页才能看完，它大概率应该被拆成多个 procedure，然后在 assay DAG 中组合。

Procedure 内部也不应该有太深的嵌套。

例如，如果某个条件判断会导致两条完全不同的操作路径：

- 如果使用 adherent cells，走一套流程；
- 如果使用 suspension cells，走另一套流程；

那么这通常应该拆成两个 procedure，而不是在一个 procedure 中写复杂分支。

但是，简单的 checkpoint 可以保留在 procedure 内部。

例如：

- 如果溶液未完全混匀，重复 vortex 10 s；
- 如果离心后 pellet 松散，标记 warning；
- 如果仪器 QC 未通过，停止执行并上报 failure。

这些 checkpoint 属于操作控制，不属于科学解释，因此可以保留在 procedure 层。

---

#### 5. 副作用：区分预期状态变化和非预期状态变化

Procedure 一定会改变某些东西。关键在于，这些状态变化应该被显式声明。

状态变化可以分成两类：

| 类型 | 含义 |
|---|---|
| Intended state change | Procedure 本来就希望造成的变化，即它的主要 output。 |
| Unintended state change | Procedure 执行过程中产生的副作用，可能影响后续使用。 |

例如，在 BCA protein quantification 中，预期 output 是一个蛋白浓度数值。这个数值是 assay 或后续 procedure 所需要的 readout。

但是，BCA procedure 也可能产生一个副作用：加入 BCA reagent 后，剩余样品被污染，不能再用于某些下游实验。

这就是 unintended state change。

类似地：

- 某些染色 procedure 会消耗细胞；
- 某些 fixation procedure 会杀死细胞；
- 某些 lysis procedure 会破坏细胞结构；
- 某些高温处理会改变蛋白状态；
- 某些光照步骤可能导致荧光染料 photobleaching。

这些副作用不一定会导致 procedure 失败，但必须被记录。因为它们会影响 assay DAG 中后续 procedure 是否还能使用同一个 output。

因此，一个 procedure 不应该只声明“产生了什么”，还应该声明“改变了什么”。

---

#### 6. 错误处理：操作失败与证据不充分必须分开

Procedure 必须定义什么情况构成失败，以及失败后应该怎么处理。

例如：

| Failure condition | Possible handling |
|---|---|
| 仪器 QC 未通过 | stop and report |
| 样品体积不足 | stop and request new input |
| 温度未达到设定值 | wait and retry |
| 溶液出现沉淀 | mark warning or stop |
| 细胞 viability 低于阈值 | stop or mark sample quality issue |
| 数据文件导出失败 | retry export or report failure |

错误处理本身也应该和正常流程分离。

正常流程描述的是：

> 在一切满足条件时，procedure 应该如何执行。

错误处理描述的是：

> 当某个操作性条件不满足时，系统应该如何响应。

这里需要特别区分 procedure error handling 和 assay inconclusive criteria。

Procedure 层面的错误是操作性的。例如：

- 温度没到怎么办？
- 样品浑浊怎么办？
- 仪器 QC 失败怎么办？
- 数据文件损坏怎么办？

Assay 层面的 inconclusive 是证据性的。例如：

- readout 落在灰区；
- positive control 成功但样品信号不稳定；
- negative control 背景过高；
- 三次重复之间差异太大；
- proxy readout 不能稳定支持任何方向的判断。

这两层不能混在一起。

Procedure 只负责：

> 操作出了问题，应该如何补救、停止或上报。

Assay criteria 才负责：

> 这个 readout 是否足以支持、拒绝或无法判断 sub-claim。

也就是说：

> Procedure failure 不等于 claim refutation。  
> Assay inconclusive 也不一定意味着 procedure failure。

一个实验可能因为操作失败而没有产生有效 readout；也可能操作成功，但 readout 仍然不足以支持或拒绝 sub-claim。这两种情况必须分开记录。

---

### Assay 与 Procedure 的关系

Assay 和 Procedure 的关系可以类比为软件工程中的 class / object 与 function 的关系。

Procedure 更像 function。它接收 input 和 parameters，调用 resources，执行一组有序步骤，然后产生 output。

Assay 则更像一个更高层级的 test specification。它把多个 procedure 按照逻辑依赖关系组合成一个 DAG，并附带 evaluant、readout、controls、criteria、limitations 等 metadata。

更具体地说：

| 对象 | 类比 | 作用 |
|---|---|---|
| Procedure | function | 最小执行单元，负责把 defined input 转换为 defined output。 |
| Transport | function call 之间的数据或物料传递 | 连接 procedure output 和下一个 procedure input。 |
| Assay template | class-like specification | 定义一类 assay 的 procedure DAG、metadata 和判定逻辑。 |
| Assay instance | object-like execution specification | 针对某个具体 sub-claim、evaluant 和实验上下文实例化后的 assay。 |

因此，可以写成：

> Procedure 是最小执行单元。  
> Assay 是由多个 procedure 组成的 DAG，加上 metadata、readouts、controls 和 criteria。  
> Transport 是 DAG 中连接 procedure 的 edge。

这也解释了为什么 assay 不应该直接写成一个巨大的 protocol。

如果把所有步骤都塞进一个 assay 里面，就会出现几个问题：

- 无法复用某个中间步骤；
- 难以替换某个 procedure；
- 难以追踪哪个步骤失败；
- 难以明确资源需求；
- 难以管理样品在不同步骤之间的状态变化；
- 难以自动化执行和调度。

相反，如果 assay 被表示为 procedure DAG，那么每个 procedure 都可以独立设计、测试、复用、替换和记录。

---

### Transport

Transport 是连接 procedure 的有向 edge。

它表示一个 procedure 的 output 如何流转到另一个 procedure 的 input。

例如：

- 某个 sample preparation procedure 产生 diluted protein sample；
- 这个 output 被 transport 到 SPR acquisition procedure；
- SPR acquisition procedure 再产生 raw sensorgram file；
- raw sensorgram file 被 transport 到 binding curve fitting procedure。

在 DAG 中可以表示为：

    Protein Dilution Procedure
        -> diluted protein sample
        -> SPR Ligand Binding Acquisition
        -> raw sensorgram file
        -> Binding Curve Fitting
        -> KD / kon / koff / fitting quality metrics

一般情况下，transport 不需要额外复杂描述。因为大多数 procedure 之间的流转可以由 input-output 类型自动推断。

但是，在某些情况下，transport 必须显式声明。

例如：

| 情况 | 需要声明的 transport 信息 |
|---|---|
| 低温运输 | 温度范围、最长运输时间、是否需要冰盒或干冰 |
| 避光保存 | 是否需要避光容器、允许暴露时间 |
| 密封保存 | 容器类型、是否需要防蒸发或防污染 |
| 无菌转运 | sterile container、biosafety cabinet、aseptic handling |
| 时间敏感样品 | 从上一个 procedure 结束到下一个 procedure 开始的最大间隔 |
| 危险材料 | 生物安全等级、化学品危害、废弃物处理 |
| 数据文件转运 | 文件格式、命名规则、存储位置、校验方式 |

因此，transport 可以理解为：

> 在默认情况下，transport 是隐式的；  
> 只有当流转条件会影响 output 状态、实验结果或安全性时，transport 才需要显式描述。

Transport 本身通常不需要一个独立数据库来存储。它不是一个可复用的实验模块，而是 assay DAG 中的 edge。也就是说，transport 应该直接写在 assay 的 DAG 结构中，用来描述两个 procedure 之间的连接关系。

一个 transport edge 至少可以包含：

| 字段 | 含义 |
|---|---|
| from_procedure | 上游 procedure |
| to_procedure | 下游 procedure |
| transferred_entity | 被转运的物料、样品、文件或信息 |
| required_condition | 特殊转运条件，例如温度、避光、无菌、密封 |
| time_window | 允许的最大时间间隔 |
| container_or_format | 容器类型或数据格式 |
| notes | 其他注意事项 |

但在普通情况下，这些字段可以为空或使用默认值。

---

## Resources

Procedure 要真实执行，必须调用或消耗某些资源。这里的资源不仅包括试剂和耗材，也包括仪器、软件、操作者和获取资源的渠道。

Resource 可以定义为：

> A Resource is an identifiable entity or established capability that is consumed or engaged in support of the execution of procedures.

也就是说：

> Resource 是一个可标识的实体，或一个已经建立好的能力通道；它在 procedure 执行过程中被消耗或被调用，用来支持 procedure 的真实执行。

这个定义可以拆成三层含义。

---

### 1. Resource 必须是可标识的实体或已建立的能力通道

Resource 首先必须是某种可以被识别、记录和管理的东西。

它可以是一个有形实体，例如：

- 一管蛋白样品；
- 一瓶 recombinant IGF-1；
- 一块 96 孔板；
- 一台 flow cytometer；
- 一个 sensor chip；
- 一支抗体；
- 一台 plate reader。

它也可以是一个无形但可标识的实体，例如：

- 分析软件；
- LIMS 系统；
- 仪器 method file；
- 数据处理脚本；
- 已验证的 gating template。

此外，Resource 也可以是一个已经建立好的能力通道，例如：

- 采购流程；
- 供应商；
- CRO 服务；
- 公共平台预约系统；
- MTA；
- 样品寄送渠道。

这些 channel 本身不一定直接参与某个实验步骤，但它们决定了某些 procedure 是否可以在现实中执行。因此，它们也应该被视为 resource。

例如，如果一个 assay 需要 recombinant IGF-1，而实验室当前没有现货，那么“可靠供应商 + 可接受采购周期”就是执行该 assay 的前提资源。

---

### 2. Resource 的参与方式是被消耗或被调用

Resource 是被动的一方。

它不会自己决定实验怎么做，也不会解释实验结果。它只是被 procedure 消耗或调用。

根据参与方式，可以分成两类：

| 参与方式 | 说明 | 示例 |
|---|---|---|
| consumed | 执行后被消耗、改变或不可完全复用 | 试剂、抗体、培养基、细胞、96 孔板、枪头、sensor chip |
| engaged | 执行过程中被调用，但不会被一次性消耗 | 仪器、软件、操作员、公共平台、CRO 服务 |

例如：

- BCA reagent 是 consumed resource；
- 96 孔板是 consumed resource；
- plate reader 是 engaged resource；
- 操作 plate reader 的实验人员是 engaged resource；
- 用于分析 absorbance 的软件也是 engaged resource。

这种区分很重要，因为它会影响：

- 成本计算；
- 库存管理；
- 实验调度；
- 可重复执行次数；
- 是否需要提前采购；
- 是否需要预约仪器或人员。

---

### 3. Resource 服务于 Procedure 的执行

Resource 存在的意义是让 procedure 能够真实执行。

它不是 claim，不是 sub-claim，也不是 assay criteria。它不回答“这个结果是否支持某个科学命题”。它只回答：

> 要执行这个 procedure，需要什么东西？  
> 这些东西是否存在？是否可用？是否合格？是否能按时获得？

因此，Resource 与 Procedure 的关系可以理解为：

> Procedure 描述要做什么操作；  
> Resource 描述这个操作需要调用或消耗什么。

例如，对于一个 `Flow Cytometry Cell Surface Staining` procedure，它可能需要：

| Resource type | 示例 |
|---|---|
| Material Resource | cells、fluorescent ligand、FACS buffer、viability dye |
| Hardware Consumable | tubes、tips、filter plate |
| Device | centrifuge、flow cytometer |
| Human Operator | trained flow cytometry operator |
| Acquisition Channel | reagent purchasing channel、core facility booking system |

如果这些 resource 缺失，procedure 就不能直接执行。

---

### Resource 的类型

在本文中，可以把 Resource 分成四大类：

    Resource
    ├── Material Resource
    │   ├── Substance
    │   │   蛋白、ligand、抗体、底物、buffer、染料、培养基……
    │   │
    │   └── Hardware Consumable
    │       96 孔板、枪头、tube、sensor chip、比色皿、滤纸、膜……
    │
    ├── Device
    │   ├── Physical Instrument
    │   │   SPR、流式细胞仪、离心机、酶标仪、显微镜、移液器……
    │   │
    │   └── Computational Tool
    │       分析软件、LIMS、成像软件、数据处理脚本……
    │
    ├── Human Operator
    │   具备特定技能或资质的人，例如流式操作员、动物手术人员、生信分析师……
    │
    └── Acquisition Channel
        获取资源的渠道或流程，例如采购流程、供应商、CRO 服务、公共平台预约、MTA……

下面分别说明。

---

### Material Resource

Material Resource 是 procedure 执行过程中被消耗、改变或作为样品参与实验的物质资源。

它可以继续分成两类：

- Substance
- Hardware Consumable

#### Substance

Substance 指化学或生物物质，例如：

- protein sample
- ligand
- antibody
- enzyme substrate
- buffer
- dye
- culture medium
- cell suspension
- recombinant growth factor
- inhibitor
- standard compound

对于 Substance，通常需要记录：

| 字段 | 含义 |
|---|---|
| name | 物质名称 |
| role | 在 procedure 中的角色，例如 sample、reagent、ligand、substrate、control |
| vendor / source | 来源 |
| catalog_number | 商品编号 |
| lot_number | 批号 |
| concentration | 浓度 |
| volume_or_amount | 可用量 |
| storage_condition | 储存条件 |
| expiration_date | 有效期 |
| quality_status | 是否通过 QC |
| safety_notes | 安全说明 |

这些信息会直接影响 procedure 是否可执行，以及 assay result 是否可信。

例如，同样是 recombinant IGF-1，不同供应商、不同批号、不同保存条件都可能影响 binding assay 的结果。因此，Substance 不能只记录“有 IGF-1”，而应该记录具体来源和状态。

#### Hardware Consumable

Hardware Consumable 指一次性或有限次使用的硬件耗材，例如：

- 96 孔板；
- 枪头；
- tube；
- sensor chip；
- 比色皿；
- 滤纸；
- PVDF membrane；
- cell culture dish；
- microfluidic chip。

这些耗材看似只是“辅助材料”，但很多时候会显著影响实验结果。

例如：

- 不同类型 plate 的背景荧光不同；
- sensor chip 的表面化学会影响 SPR immobilization；
- low-bind tube 会影响低浓度蛋白回收率；
- filter membrane 的孔径会影响样品损失。

因此，Hardware Consumable 也必须作为 Resource 进行记录，而不能只写在 procedure 的叙述性步骤中。

---

### Device

Device 是 procedure 执行过程中被调用的可重复使用工具。

它可以分成：

- Physical Instrument
- Computational Tool

#### Physical Instrument

Physical Instrument 指真实实验室仪器，例如：

- SPR instrument
- flow cytometer
- plate reader
- centrifuge
- microscope
- incubator
- liquid handler
- qPCR machine
- LC-MS
- pipette

对于 Physical Instrument，通常需要记录：

| 字段 | 含义 |
|---|---|
| instrument_class | 仪器类别，例如 flow cytometer、plate reader |
| model | 仪器型号 |
| location | 所在位置 |
| booking_status | 是否可预约 |
| calibration_status | 校准状态 |
| method_file | 使用的仪器方法文件 |
| required_operator | 是否需要专门操作员 |
| output_format | 输出文件格式 |
| limitations | 仪器限制，例如检测范围、通道数、灵敏度 |

Device 与 Procedure 的关系通常非常紧密。一个 execution procedure 往往对应某类仪器。例如：

- SPR acquisition procedure 需要 SPR instrument；
- flow cytometry acquisition procedure 需要 flow cytometer；
- absorbance measurement procedure 需要 plate reader；
- confocal imaging procedure 需要 microscope。

但是，procedure 不应该写死某一台具体仪器。更好的做法是声明所需 instrument class 和关键 capability，然后在物理层执行时绑定具体设备。

例如：

> procedure 需要 “flow cytometer with FITC channel and 488 nm laser”；  
> physical layer 再根据预约和可用性绑定到某一台具体 flow cytometer。

#### Computational Tool

Computational Tool 指 procedure 执行过程中用于数据转换、处理或管理的软件工具，例如：

- flow cytometry analysis software；
- image analysis software；
- LC-MS peak integration software；
- LIMS；
- custom Python script；
- R analysis pipeline；
- instrument vendor software。

这里需要注意：

> Computational Tool 可以属于物理层，但前提是它执行的是预定义的数据处理 procedure，而不是开放式科学推理。

例如，使用一个固定脚本从 FCS 文件中计算 MFI，可以是 analysis procedure 的一部分。  
但是，让模型自由判断“这个蛋白是否是 IGF receptor”，不属于 physical layer procedure，而属于更上游的解释或推理过程。

---

### Human Operator

Human Operator 是具备特定技能、权限或资质的人。

虽然物理层强调执行，而不是科学解释，但执行本身仍然可能需要专业技能。例如：

- flow cytometry operator；
- animal surgery operator；
- cell culture technician；
- confocal microscopy specialist；
- mass spectrometry operator；
- biosafety officer；
- bioinformatics analyst。

Human Operator 作为 Resource，通常需要记录：

| 字段 | 含义 |
|---|---|
| role | 操作员角色 |
| required_skill | 所需技能 |
| certification | 是否需要资质或培训记录 |
| availability | 可用时间 |
| permission_level | 是否有权限操作特定仪器或样品 |
| safety_requirement | 是否涉及特殊安全要求 |
| responsibility | 在 procedure 中承担的操作职责 |

这里的 Human Operator 与概念层中的 human expert 不同。

Human Operator 负责执行或监督操作，例如上机、培养细胞、手术、数据导出。  
Human Expert 负责审核 assay 设计、判断 criteria 是否合理、确认结果解释是否可信。

二者不应该混淆。

换句话说：

> Human Operator 是 physical resource。  
> Human Expert 是 review or decision role。

在某些情况下，同一个现实中的人可以同时承担这两个角色，但在 schema 中应该分开建模。

---

### Acquisition Channel

Acquisition Channel 是获取资源的渠道或流程。

这类对象容易被忽略，但在真实实验中非常重要。很多 assay 之所以无法执行，不是因为缺少想法，而是因为某个关键 resource 无法获得。

例如：

- 某个 recombinant protein 没有现货；
- 某个 antibody 采购周期太长；
- 某个 CRO 服务不接受当前样品类型；
- 某个公共平台仪器排期已经满了；
- 某个细胞系需要 MTA；
- 某个试剂涉及进出口或生物安全审批。

因此，Acquisition Channel 也应该作为 Resource 的一种。

常见 Acquisition Channel 包括：

- vendor purchasing channel；
- CRO service；
- core facility booking system；
- MTA process；
- internal inventory request；
- collaborator-provided material；
- sample shipping channel。

对于 Acquisition Channel，通常需要记录：

| 字段 | 含义 |
|---|---|
| channel_type | 采购、外包、平台预约、MTA、合作方提供等 |
| provider | 供应商、平台或合作方 |
| lead_time | 获取周期 |
| cost | 费用 |
| availability | 是否当前可用 |
| constraints | 限制条件 |
| required_documents | 所需文件 |
| failure_risk | 获取失败风险 |

这类 resource 不直接产生 readout，但决定 procedure 是否可以真实落地。

例如，在中间层中，某条 assay path 可能被认为科学上合理；但到了物理层，如果关键 reagent 无法采购，或者仪器无法预约，那么这条路径就不能立即执行。

因此，Resource 检查是物理层可执行性判断的重要组成部分。

---

## Resource 与 Procedure 的边界

Resource 和 Procedure 容易混淆，因此需要明确边界。

Procedure 是操作过程。  
Resource 是被该操作过程消耗或调用的对象。

例如：

| 对象 | 应该建模为 | 原因 |
|---|---|---|
| BCA protein quantification | Procedure | 它是一组有序操作，会把 protein sample 转换成 concentration readout。 |
| BCA reagent | Resource | 它被 procedure 消耗。 |
| Plate reader | Resource | 它被 procedure 调用。 |
| Plate reader measurement | Procedure | 它是在仪器上执行的测量操作。 |
| Flow cytometer | Resource | 它是被调用的仪器。 |
| Flow cytometry acquisition | Procedure | 它是上机采集过程。 |
| CRO binding assay service | Acquisition Channel 或 Assay template，取决于建模粒度 | 如果只是获取能力的渠道，是 Resource；如果 CRO 返回的是完整 assay specification，可以作为 assay template。 |
| Data analysis script | Resource | 它是被调用的计算工具。 |
| Running the data analysis script | Procedure | 它是一个执行过程。 |

一个简单判断标准是：

> 如果它描述“怎么做”，通常是 Procedure。  
> 如果它描述“用什么做”，通常是 Resource。  
> 如果它描述“如何获得某个东西或能力”，通常是 Acquisition Channel。

---

## 物理层的最终输出

物理层执行完成后，不应该直接输出 claim status。  
它应该输出的是执行记录、原始数据、readout 以及 failure / warning 信息。

一个完整的物理层输出至少应该包括：

| 输出对象 | 含义 |
|---|---|
| Procedure execution log | 每个 procedure 是否执行、何时执行、由谁执行、使用哪些 parameters 和 resources。 |
| Transport log | 样品、数据或中间产物如何在 procedure 之间流转。 |
| Resource usage record | 哪些 resource 被消耗或调用，使用量、批号、仪器编号、操作者等。 |
| Raw output | 仪器原始文件、图像、信号文件、原始记录等。 |
| Readout | 经过 analysis procedure 转换后的可用于 assay criteria 的数值或结构化结果。 |
| Failure / warning report | 操作失败、异常、偏离 SOP、样品质量问题等。 |

这些输出会回到中间层，由 assay criteria 进一步解释。

例如：

- 如果 procedure failure 导致没有有效 readout，那么 assay 可能被标记为 inconclusive 或需要 repeat；
- 如果 readout 落在灰区，那么 assay criteria 可能给出 inconclusive；
- 如果 readout 达到 support threshold，那么 sub-claim 可能被标记为 supported；
- 如果 readout 达到 refutation threshold，那么 sub-claim 可能被标记为 refuted。

但是，这些解释不属于 physical layer 本身。

物理层只负责：

> 执行 procedure，调用 resources，记录 transport，产生 raw output 和 readout，并上报执行状态。

中间层负责：

> 根据 assay criteria 将 readout 转换成 sub-claim status。

概念层负责：

> 根据 claim decision rules 将 sub-claim status 组合成 claim status。

---

## 小结

物理层是整个 “hypothesis to experiment” 流程中最接近真实实验室的一层。

它不再处理自然语言 hypothesis，也不再拆解 claim 或选择 assay。它处理的是更具体的问题：

- 哪些 procedure 需要执行？
- procedure 之间如何连接？
- 每个 procedure 需要哪些 resource？
- resource 是否可用？
- 样品和数据如何流转？
- 执行失败时如何处理？
- 最终产生哪些 raw output 和 readout？

因此，物理层可以概括为：

> Physical layer = Procedure DAG + Transport edges + Resource binding + Execution records

其中：

- Procedure 是最小执行单元；
- Transport 是 procedure 之间的流转关系；
- Resource 是 procedure 执行时被消耗或被调用的实体与能力。

如果说中间层的核心任务是把 sub-claim 转换成 assay，那么物理层的核心任务就是把 assay 转换成可以真实执行、可以追踪、可以复现、可以审计的实验操作过程。

只有当物理层能够稳定地产生 readout，中间层的 assay criteria 才能进一步判断 sub-claim 的状态，最终再回到概念层判断 claim 是否被支持、拒绝或仍然无法判断。