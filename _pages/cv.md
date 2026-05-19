---
layout: single
title: "CV"
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
      <a href="{{ base_path }}{{ site.data.cv.pdf }}" target="_blank" rel="noopener noreferrer">Download CV (PDF)</a>
      &nbsp;·&nbsp;
      {% endif %}
      <a href="https://scholar.google.com/citations?user=ey4rxTIAAAAJ" target="_blank" rel="noopener noreferrer">Google Scholar</a>
    </p>
  </div>

  {% include cv-timeline.html %}
</div>
