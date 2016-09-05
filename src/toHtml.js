import React from 'react';
import { Html } from 'slate';

const rules = [
  {
    deserialize(el, next) {
      const type = BLOCK_TAGS[el.tagName]
      if (!type) return
      return {
        kind: 'block',
        type: type,
        nodes: next(el.children)
      }
    },
    serialize(object, children) {
      if (object.kind != 'block') return
      switch (object.type) {
        case 'code': return <pre><code>{children}</code></pre>
        case 'paragraph': return <p>{children}</p>
        case 'quote': return <blockquote>{children}</blockquote>
        case 'image': return <img src={object.data.get('src')} width={object.data.get('width') || 768} />
        case 'blockquote': return <blockquote>{children}</blockquote>
        case 'ul': return <ul>{children}</ul>
        case 'heading-one': return <h1>{children}</h1>
        case 'heading-two': return <h2>{children}</h2>
        case 'li': return <li>{children}</li>
        case 'numbered-list': return <ol>{children}</ol>
        case 'h': 
          const level = object.data.get('level')
          const Tag = `h${level}`
          return <Tag >{children}</Tag>
      }
    }
  },
  // Add a new rule that handles marks...
  {
    deserialize(el, next) {
      const type = MARK_TAGS[el.tagName]
      if (!type) return
      return {
        kind: 'mark',
        type: type,
        nodes: next(el.children)
      }
    },
    serialize(object, children) {
      if (object.kind != 'mark') return
      switch (object.type) {
        case 'bold': return <strong>{children}</strong>
        case 'italic': return <em>{children}</em>
        case 'underline': return <u>{children}</u>
        case 'code': return <span style={{
      fontFamily: 'monospace',
      backgroundColor: '#eee',
      padding: '3px',
      borderRadius: '4px'
    }}>{children}</span>
      }
    }
  }
]

// Create a new serializer instance with our `rules` from above.
const html = new Html({ rules })

export default function(state) {
  console.log(state)
  const htmlText = html.serialize(state)
  return htmlText;
}
