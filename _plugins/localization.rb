# Build both languages from shared facts and explicitly maintained translations.
# This runs in the existing GitHub Actions Jekyll build, not in visitors' browsers.
module HomepageLocalization
  LANG = 'zh-CN'.freeze
  TRANSLATED_FIELDS = %w[title description excerpt summary content type venue location subtitle_zh subtitle_en series cartoon_alt cartoon_caption illustration_notes featured badge].freeze
  CONTENT_DATA = %w[about authors community_impact cv hero honors interests languages news research sports_awards water_sports navigation talk_languages].freeze

  def self.localized(value)
    case value
    when Array then value.map { |item| localized(item) }
    when Hash
      original = value.reject { |key, _| key == 'i18n' }
      overlay = value.dig('i18n', 'zh') || {}
      original.merge(overlay).transform_values { |item| localized(item) }
    else value
    end
  end

  class Generator < Jekyll::Generator
    safe true
    priority :high

    def generate(site)
      translations = site.data.fetch('page_translations', {})
      sources = site.pages.select { |p| p.data['translation_key'] } +
                site.collections.values.flat_map(&:docs).select { |p| p.data['translation_key'] }
      keys = sources.map { |p| p.data['translation_key'] }
      abort_build('duplicate translation_key') unless keys.uniq.size == keys.size
      missing = keys - translations.keys
      extra = translations.keys - keys
      abort_build("missing page translations: #{missing.join(', ')}") unless missing.empty?
      abort_build("unknown page translations: #{extra.join(', ')}") unless extra.empty?
      site.data['localized'] = {
        'en' => CONTENT_DATA.to_h { |key| [key, site.data[key]] },
        'zh' => CONTENT_DATA.to_h { |key| [key, HomepageLocalization.localized(site.data[key])] }
      }
      site.data['localized_documents'] = {}
      site.data['language_urls'] = {}
      site.data['article_languages'] = {}
      sources.each do |source|
        key = source.data.fetch('translation_key')
        translation = translations.fetch(key)
        abort_build("missing Chinese title: #{key}") if translation['title'].to_s.strip.empty?
        forbidden = translation.keys - TRANSLATED_FIELDS
        abort_build("translated facts are not allowed for #{key}: #{forbidden.join(', ')}") unless forbidden.empty?
        source.data['lang'] = 'en'
        source.data['locale'] = 'en-US'
        source.data['original_url'] = source.url
        source.data['alternate_urls'] = { 'en' => source.url, LANG => "/zh#{source.url}" }
        source.data['canonical_path'] = source.url
        source.data['content_lang'] ||= 'en'
        site.data['article_languages'][source.url] = source.data['content_lang']
        source.data['original_title'] = source.data['title']
        source.data['source_collection'] = source.respond_to?(:collection) ? source.collection.label : nil
        zh = Jekyll::PageWithoutAFile.new(site, site.source, 'zh', "#{key}.html")
        zh.data = source.data.reject { |name, _| %w[redirect_from description_zh].include?(name) }.merge(translation.reject { |name, _| name == 'content' })
        zh.data.merge!('lang' => LANG, 'locale' => LANG, 'permalink' => "/zh#{source.url}",
                       'canonical_path' => "/zh#{source.url}", 'localized_page' => true,
                       'content_lang' => LANG)
        zh.content = translation.fetch('content', source.content)
        # PageWithoutAFile inherits .html; translated prose still needs Markdown.
        source_extension = source.is_a?(Jekyll::Document) ? source.extname : source.ext
        zh.instance_variable_set(:@ext, source_extension)
        if source.data['content_lang'] == LANG
          # English chrome around a Chinese article is not an English translation.
          source.data['canonical_path'] = zh.data['canonical_path']
          source.data['sitemap'] = false
          zh.data['sitemap'] = true
          source.data['untranslated_body'] = zh.data['untranslated_body'] = true
        end
        site.pages << zh
        source.data['translated_url'] = zh.url
        site.data['language_urls'][source.url] = zh.url
        site.data['localized_documents'][key] = zh.data.merge('url' => zh.url, 'content' => zh.content)
      end
      # Neighbours come from the original collections, never from translated pages.
      sources.each do |source|
        next unless source.respond_to?(:collection)
        docs = source.collection.docs.sort_by { |doc| [doc.data['date'] || Time.at(0), doc.basename] }
        position = docs.index(source)
        next unless position
        %w[previous next].each do |direction|
          neighbour = direction == 'previous' ? (position.positive? ? docs[position - 1] : nil) : docs[position + 1]
          next unless neighbour
          source.data["#{direction}_item"] = neighbour.data.slice('title', 'translation_key').merge('url' => neighbour.url)
          site.data['localized_documents'][source.data['translation_key']]["#{direction}_item"] = source.data["#{direction}_item"]
          site.pages.find { |p| p.data['localized_page'] && p.data['translation_key'] == source.data['translation_key'] }.data["#{direction}_item"] = source.data["#{direction}_item"]
        end
      end
    end

    def abort_build(message)
      raise Jekyll::Errors::FatalException, "Localization: #{message}"
    end
  end

  module Filters
    def t(text, lang = nil)
      return text unless lang.to_s.start_with?('zh')
      data = @context.registers[:site].data
      (data['translations'] || {}).fetch(text.to_s) { (data['page_ui'] || {}).fetch(text.to_s, text) }
    end

    def localize_doc(doc, lang = nil)
      return doc unless doc && lang.to_s.start_with?('zh')
      @context.registers[:site].data.fetch('localized_documents', {}).fetch(doc['translation_key'], doc)
    end

    def locale_url(url, lang = nil)
      return url if url.to_s.empty? || !lang.to_s.start_with?('zh')
      site = @context.registers[:site]
      path, suffix = url.to_s.split(/(?=[?#])/, 2)
      site.data.fetch('language_urls', {}).fetch(path, path) + suffix.to_s
    end

    def localized_date(value, lang = nil, format = '%B %-d, %Y')
      time = value.respond_to?(:strftime) ? value : Date.parse(value.to_s)
      time.strftime(lang.to_s.start_with?('zh') ? '%Y年%-m月%-d日' : format)
    rescue ArgumentError
      value
    end
  end
end
Liquid::Template.register_filter(HomepageLocalization::Filters)

# jekyll-feed uses post.lang for entry language; our lang describes the chrome.
# Correct only feed metadata, keeping entry IDs, URLs, and body generation intact.
require 'nokogiri'
Jekyll::Hooks.register :pages, :post_render do |page|
  next unless page.url == (page.site.config.dig('feed', 'path') || '/feed.xml')
  xml = Nokogiri::XML(page.output)
  xml.xpath('//atom:entry', 'atom' => 'http://www.w3.org/2005/Atom').each do |entry|
    link = entry.at_xpath('atom:link[@rel="alternate"]', 'atom' => 'http://www.w3.org/2005/Atom')
    next unless link
    origin = page.site.config['url'].to_s + page.site.config['baseurl'].to_s
    path = link['href'].to_s.delete_prefix(origin)
    language = page.site.data.fetch('article_languages', {})[path]
    entry['xml:lang'] = language if language
  end
  page.output = xml.to_xml
end
