---
layout: single
title: "CV"
description: "Curriculum vitae of Xibin Zhou: education at Westlake University and Tongji University, research on protein language models, awards, and community impact."
description_zh: "周禧彬简历：西湖大学与同济大学教育背景、蛋白质语言模型研究、荣誉与社会影响。"
permalink: /cv/
author_profile: false
classes:
  - wide
redirect_from:
  - /resume
---

{% include base_path %}

<div class="page-shell fade-in">
  <div class="about-block" style="margin-bottom: 2.5rem;">
    {{ site.data.cv.summary | markdownify }}
    <p>
      {% if site.data.cv.pdf %}
      <a href="{{ base_path }}{{ site.data.cv.pdf }}" target="_blank" rel="noopener noreferrer">Download English CV (PDF)</a>
      {% endif %}
      {% if site.data.cv.pdf_zh %}
      {% if site.data.cv.pdf %}&nbsp;·&nbsp;{% endif %}
      <a href="{{ base_path }}{{ site.data.cv.pdf_zh }}" target="_blank" rel="noopener noreferrer" lang="zh-CN">下载中文简历（PDF）</a>
      {% endif %}
      {% if site.author.googlescholar %}
      {% if site.data.cv.pdf or site.data.cv.pdf_zh %}&nbsp;·&nbsp;{% endif %}
      <a href="{{ site.author.googlescholar }}" target="_blank" rel="noopener noreferrer">Google Scholar</a>
      {% endif %}
    </p>
  </div>

  {% include cv-timeline.html %}
</div>
