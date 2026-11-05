---
layout: archive
title: "Sitemap"
description: "Explore the pages, posts, and research collections on this site."
permalink: /sitemap/
author_profile: false
classes:
  - wide
---

{% include base_path %}

<div class="page-shell directory-page">
  <p class="directory-intro">Explore the pages, posts, and research collections on this site. <a href="{{ base_path }}/sitemap.xml">XML sitemap</a></p>

  <section class="directory-section" aria-labelledby="sitemap-pages">
    <h2 id="sitemap-pages" class="directory-section__title">Pages</h2>
    {% include directory-pages.html %}
  </section>

  {% if site.posts.size > 0 %}
  <section class="directory-section" aria-labelledby="sitemap-posts">
    <h2 id="sitemap-posts" class="directory-section__title">Posts</h2>
    {% for post in site.posts %}
      {% include archive-entry.html %}
    {% endfor %}
  </section>
  {% endif %}

  {% include directory-collections.html %}
</div>
