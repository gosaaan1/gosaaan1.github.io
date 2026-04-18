'use strict'

module.exports.register = function () {
  this.on('documentsConverted', ({ contentCatalog }) => {
    const posts = collectPosts(contentCatalog)
    if (!posts.length) return

    posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''))

    const months = groupByMonth(posts)
    const tags = groupByTag(posts)
    const recent = posts.slice(0, 5)

    const targetLayouts = new Set(['home', 'timeline', 'tags'])
    contentCatalog.getPages().forEach((page) => {
      const attrs = page.asciidoc && page.asciidoc.attributes
      if (!attrs) return
      if (!targetLayouts.has(attrs['page-layout'])) return

      attrs['page-rippo-posts'] = posts
      attrs['page-rippo-recent'] = recent
      attrs['page-rippo-months'] = months
      attrs['page-rippo-tags'] = tags
      attrs['page-rippo-total'] = posts.length
    })
  })
}

function collectPosts (contentCatalog) {
  const posts = []
  contentCatalog.getPages().forEach((page) => {
    if (!page.asciidoc) return
    const attrs = page.asciidoc.attributes || {}
    if (attrs['page-role'] !== 'post') return

    posts.push({
      title: page.asciidoc.doctitle || '(無題)',
      url: page.pub.url,
      mood: attrs['page-mood'] || 'standard',
      tags: splitTags(attrs['page-tags']),
      date: attrs['page-date'] || '',
    })
  })
  return posts
}

function splitTags (raw) {
  if (!raw) return []
  return String(raw)
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

function groupByMonth (posts) {
  const byMonth = {}
  posts.forEach((p) => {
    const month = (p.date || '').substring(0, 7) || 'unknown'
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push(p)
  })
  return Object.keys(byMonth)
    .sort()
    .reverse()
    .map((key) => ({
      key,
      label: formatMonth(key),
      count: byMonth[key].length,
      posts: byMonth[key],
    }))
}

function groupByTag (posts) {
  const byTag = {}
  posts.forEach((p) => {
    p.tags.forEach((tag) => {
      if (!byTag[tag]) byTag[tag] = []
      byTag[tag].push(p)
    })
  })
  return Object.keys(byTag)
    .sort()
    .map((name) => ({
      name,
      count: byTag[name].length,
      posts: byTag[name],
    }))
}

function formatMonth (yyyymm) {
  const parts = (yyyymm || '').split('-')
  if (parts.length !== 2) return yyyymm
  return parts[0] + '年' + parseInt(parts[1], 10) + '月'
}
