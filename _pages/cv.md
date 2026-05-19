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
    <p><a href="https://scholar.google.com/citations?user=ey4rxTIAAAAJ" target="_blank" rel="noopener noreferrer">Google Scholar</a></p>
  </div>

  {% include cv-timeline.html %}

  {% if site.data.honors.size > 0 %}
  <section style="margin-top: var(--section-gap);">
    {% include section-header.html title="Honors & Awards" %}
    <ul class="honors-list">
      {% for item in site.data.honors %}
      <li>{{ item.text | markdownify | remove: "<p>" | remove: "</p>" }}</li>
      {% endfor %}
    </ul>
  </section>
  {% endif %}
</div>
