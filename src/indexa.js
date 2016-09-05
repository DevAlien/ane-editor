import { Editor, Mark, Raw } from 'slate'
import React from 'react'
import isImage from 'is-image'
import isUrl from 'is-url'
import DriprAPI from './driprClient';
import upload from './plugins/upload';
import NodeImage from './nodes/Image.js';
console.log(upload)
const plugins = [
  upload({
    extensions: ['png'],
    applyTransform: (transform, file, id) => {
      return transform.insertBlock({
        type: 'image',
        isVoid: true,
        key: id,
        data: { src: file }
      })
    }
  })
];
// import position from 'selection-position'
const position = function() {

  if (window.getSelection) {
    var selection = window.getSelection();
    if (!selection.rangeCount) return;

    var range = selection.getRangeAt(0);
    return range.getBoundingClientRect();
  }

  if (document.selection) {
    return document.selection
      .createRange()
      .getBoundingClientRect();
  }
};

const initialState = {"nodes":[{"kind":"block","type":"paragraph","nodes":[{"kind":"text","text":""}]}]};


/**
 * Tags to blocks.
 *
 * @type {Object}
 */

const BLOCK_TAGS = {
  p: 'paragraph',
  li: 'list-item',
  ul: 'bulleted-list',
  ol: 'numbered-list',
  blockquote: 'quote',
  pre: 'code',
  h1: 'heading-one',
  h2: 'heading-two',
  h3: 'heading-three',
  h4: 'heading-four',
  h5: 'heading-five',
  h6: 'heading-six'
}

/**
 * Tags to marks.
 *
 * @type {Object}
 */

const MARK_TAGS = {
  strong: 'bold',
  bold: 'bold',
  em: 'italic',
  u: 'underline',
  s: 'strikethrough',
  code: 'code'
}

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
        case 'image':
          return <img src={object.data.get('src')} />
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
      }
    }
  }
]

/**
 * Serializer rules.
 *
 * @type {Array}
 */

const RULES = [
  {
    deserialize(el, next) {
      console.log(el.tagName)
      const block = BLOCK_TAGS[el.tagName]
      if (!block) return
      return {
        kind: 'block',
        type: block,
        nodes: next(el.children)
      }
    }
  },
  {
    deserialize(el, next) {
      const mark = MARK_TAGS[el.tagName]
      if (!mark) return
      return {
        kind: 'mark',
        type: mark,
        nodes: next(el.children)
      }
    }
  },
  {
    // Special case for code blocks, which need to grab the nested children.
    deserialize(el, next) {
      if (el.tagName != 'pre') return
      const code = el.children[0]
      const children = code && code.tagName == 'code'
        ? code.children
        : el.children

      return {
        kind: 'block',
        type: 'code',
        nodes: next(children)
      }
    }
  },
  {
    // Special case for links, to grab their href.
    deserialize(el, next) {
      if (el.tagName != 'a') return
      return {
        kind: 'inline',
        type: 'link',
        nodes: next(el.children),
        data: {
          href: el.attribs.href
        }
      }
    }
  }
]
import { Html } from 'slate'

// Create a new serializer instance with our `rules` from above.
const html = new Html({ rules })

/**
 * Define the default node type.
 */

const DEFAULT_NODE = 'paragraph'

/**
 * Define a set of node renderers.
 *
 * @type {Object}
 */

const NODES = {
  'block-quote': (props) => <blockquote {...props.attributes}>{props.children}</blockquote>,
  'bulleted-list': props => <ul {...props.attributes}>{props.children}</ul>,
  'heading-one': props => <h1 {...props.attributes}>{props.children}</h1>,
  'heading-two': props => <h2 {...props.attributes}>{props.children}</h2>,
  'list-item': props => <li {...props.attributes}>{props.children}</li>,
  'numbered-list': props => <ol {...props.attributes}>{props.children}</ol>,
  'image': NodeImage
}

const schema = {
  nodes: NODES
};

import Portal from 'react-portal'

/**
 * Define a set of mark renderers.
 *
 * @type {Object}
 */

const MARKS = {
  bold: {
    fontWeight: 'bold'
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#eee',
    padding: '3px',
    borderRadius: '4px'
  },
  italic: {
    fontStyle: 'italic'
  },
  underlined: {
    textDecoration: 'underline'
  }
}

/**
 * The hovering menu example.
 *
 * @type {Component}
 */

class HoveringMenu extends React.Component {

  /**
   * Deserialize the raw initial state.
   *
   * @type {Object}
   */
  constructor(props) {
    super(props);
    this.state = {
      state: Raw.deserialize(initialState, { terse: true }),
      sideMenu: {},
      loading: false
    };
    this.driprAPI = DriprAPI();
  }

  /**
   * On update, update the menu.
   */

  componentDidMount = () => {
    this.updateMenu()
  }

  componentDidUpdate = () => {
    this.updateMenu()
  }

  /**
   * Check if the current selection has a mark with `type` in it.
   *
   * @param {String} type
   * @return {Boolean}
   */

  hasMark = (type) => {
    const { state } = this.state
    return state.marks.some(mark => mark.type == type)
  }

  hasBlock = (type) => {
    const { state } = this.state
    return state.blocks.some(node => node.type == type)
  }

  onKeyDown = (e, data, state) => {
    if (!data.isMod) return
    let mark

    switch (data.key) {
      case 'b':
        mark = 'bold'
        break
      case 'i':
        mark = 'italic'
        break
      case 'u':
        mark = 'underlined'
        break
      case '`':
        mark = 'code'
        break
      default:
        return
    }

    state = state
      .transform()
      .toggleMark(mark)
      .apply()

    e.preventDefault()
    return state
  }

  /**
   * On change, save the new state.
   *
   * @param {State} state
   */

  onChange = (state) => {
    this.setState({ state })
  }

  /**
   * When a mark button is clicked, toggle the current mark.
   *
   * @param {Event} e
   * @param {String} type
   */

  onClickMark = (e, type) => {
    e.preventDefault()
    let { state } = this.state

    state = state
      .transform()
      .toggleMark(type)
      .apply()

    this.setState({ state })
  }

  onClickBlock = (e, type) => {
    e.preventDefault()
    let { state } = this.state
    let transform = state.transform()
    const { document } = state
    if (type === 'image') {
      const src = window.prompt('Enter the URL of the image:')
      if (!src) return
      let { state } = this.state
      state = this.insertImage(state, src)
      return this.onChange(state)

    }
    // Handle everything but list buttons.
    if (type != 'bulleted-list' && type != 'numbered-list') {
      const isActive = this.hasBlock(type)
      const isList = this.hasBlock('list-item')

      if (isList) {
        transform = transform
          .setBlock(isActive ? DEFAULT_NODE : type)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list')
      }

      else {
        transform = transform
          .setBlock(isActive ? DEFAULT_NODE : type)
      }
    }

    // Handle the extra wrapping required for list buttons.
    else {
      const isList = this.hasBlock('list-item')
      const isType = state.blocks.some((block) => {
        return !!document.getClosest(block, parent => parent.type == type)
      })

      if (isList && isType) {
        transform = transform
          .setBlock(DEFAULT_NODE)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list')
      } else if (isList) {
        transform = transform
          .unwrapBlock(type == 'bulleted-list' ? 'numbered-list' : 'bulleted-list')
          .wrapBlock(type)
      } else {
        transform = transform
          .setBlock('list-item')
          .wrapBlock(type)
      }
    }

    state = transform.apply()
    this.setState({ state })
  }

  /**
   * When the portal opens, cache the menu element.
   *
   * @param {Element} portal
   */

  onOpen = (portal) => {
    this.setState({ menu: portal.firstChild })
  }

  /**
   * Render.
   *
   * @return {Element}
   */

  render = () => {
    return (
      <div>
      {this.renderMenu()}
        {this.renderEditor()}
        <div ref="preview">a</div>
      </div>
    )
  }

  /**
   * Render the hovering menu.
   *
   * @return {Element}
   */

  renderMenu = () => {
    return (
      <div ref="menu" className="menu hover-menu">
          {this.renderMarkButton('bold', 'format_bold')}
          {this.renderMarkButton('italic', 'format_italic')}
          {this.renderMarkButton('underlined', 'format_underlined')}
          {this.renderMarkButton('code', 'code')}
        </div>
    )
  }

  /**
   * Render a mark-toggling toolbar button.
   *
   * @param {String} type
   * @param {String} icon
   * @return {Element}
   */

  renderMarkButton = (type, icon) => {
    const isActive = this.hasMark(type)
    const onMouseDown = e => this.onClickMark(e, type)

    return (
      <span className="button" onMouseDown={onMouseDown} data-active={isActive}>
        <span className="material-icons">{icon}</span>
      </span>
    )
  }

  /**
   * Render the Slate editor.
   *
   * @return {Element}
   */

  renderEditor = () => {
    const onMouseDown = e => this.onClickBlock(e, 'image')
    return (
      <div className="editor" style={{position:'relative', width: '600px', margin: '0 auto', border: 'black 1px solid'}}>
        {!this.state.loading && <div ref="sideMenu" className="side-menu" style={{visible: 'none'}}>
          <span className="material-icons">person</span>
          <span className="material-icons" onMouseDown={onMouseDown}>image</span>
        </div>
        }
        <Editor
        schema={schema}
          plugins={plugins}
          className="aneeditor"
          style={{width: '500px', minHeight: '500px', margin: '0 auto'}}
          state={this.state.state}
          renderNode={this.renderNode}
          renderMark={this.renderMark}
          onChange={this.onChange}
          onDocumentChange={this.onDocumentChange}
          
          onKeyDown={this.onKeyDown}
        />
        {this.state.loading && <div className="cover">Loading</div>}
      </div>
    )
  }

  /**
   * Return a mark renderer for a Slate `mark`.
   *
   * @param {Mark} mark
   * @return {Object or Void}
   */

  renderMark = (mark) => {
    return MARKS[mark.type]
  }

  renderNode = (node) => {
    console.log('RENDERE')
    console.log(node)
    console.log(node.type)
    return NODES[node.type]
  }
  /**
   * Update the menu's absolute position.
   */

  updateMenu = () => {
    const { state } = this.state
    const menu = this.refs.menu;
    if (!menu) return

    const rect = position()
    let sideMenu = this.refs.sideMenu;
    if (state.isFocused && rect.top > 0) {
      console.log(position())

      if (sideMenu) {
        console.log(sideMenu.offsetHeight)
        sideMenu.style.top = `${rect.top + window.scrollY - (sideMenu.offsetHeight || 18)}px`
        sideMenu.style.display = 'block';
        // sideMenu.style.left = `${rect.left + window.scrollX - menu.offsetWidth / 2 + rect.width / 2}px`
      }
    } else {
      // if (sideMenu) {
      //   sideMenu.removeAttribute('style');
      // }
    }

    if (state.isBlurred || state.isCollapsed) {
      menu.removeAttribute('style')
      return
    }


    menu.style.opacity = 1
    menu.style.top = `${rect.top + window.scrollY - menu.offsetHeight}px`
    menu.style.left = `${rect.left + window.scrollX - menu.offsetWidth / 2 + rect.width / 2}px`
  }

   /**
   * On document change, if the last block is an image, add another paragraph.
   *
   * @param {Document} document
   * @param {State} state
   */

  onDocumentChange = (document, state) => {
    const string = html.serialize(state)
    const a = Raw.serialize(state, {terse: true})
    console.log(JSON.stringify(a))
    this.refs.preview.innerHTML = string;

    const blocks = document.getBlocks()
    const last = blocks.last()
    if (last.type != 'image') return

    const normalized = state
      .transform()
      .collapseToEndOf(last)
      .splitBlock()
      .setBlock({
        type: 'paragraph',
        isVoid: false,
        data: {}
      })
      .apply({
        snapshot: false
      })

    this.onChange(normalized)

  }

  /**
   * On clicking the image button, prompt for an image and insert it.
   *
   * @param {Event} e
   */

  onClickImage = (e) => {
    e.preventDefault()
    const src = window.prompt('Enter the URL of the image:')
    if (!src) return
    let { state } = this.state
    state = this.insertImage(state, src)
    this.onChange(state)
  }

  /**
   * On drop, insert the image wherever it is dropped.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @return {State}
   */

  onDrop = (e, data, state) => {
    if (data.type != 'node') return
    return state
      .transform()
      .removeNodeByKey(data.node.key)
      .moveTo(data.target)
      .insertBlock(data.node)
      .apply()
  }

  /**
   * On paste, if the pasted content is an image URL, insert it.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @return {State}
   */

  onPaste = (e, data, state) => {
    console.log(e.clipboardData)
    var items = e.clipboardData.items;
    console.log(items)
    for (var i = 0; i < items.length; i++) { // removed: i < items.length, items[i].type.indexOf("image") !== -1
      let file = items[i];
      if (file.type.indexOf("image") !== -1) {
        this.setState({loading: true});
        //foundImage = true; Not sure why this was here
        // Convert image to blob using File API
        var blob = file.getAsFile();
        var extension = file.type.replace('image/', '');
        this.driprAPI.postFile([blob], extension).then((response) => {
            if (response.status >= 400) {
              this.setState({loading: false});
                throw new Error("Bad response from server");
            }
            return response.json();
        })
        .then((stories) => {
          return this.setState({state: this.insertImage(this.state.state, stories.urlOriginal), loading: false});
        });
        console.log('aaa')
        return state;
        // var reader = new FileReader();
        // reader.onload = (event) => {
        //   this.driprAPI.postFile([event.target.result]); //event.target.results contains the base64 code to create the image
        // };
        // /* Convert the blob from clipboard to base64 */
        // reader.readAsDataURL(blob);
        //foundImage = false; Not sure why this was here
      }
    }
    // const droppedFiles = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    // console.log(droppedFiles)
    // const max = this.props.multiple ? droppedFiles.length : Math.min(droppedFiles.length, 1);
    // const files = [];

    // for (let i = 0; i < max; i++) {
    //   const file = droppedFiles[i];
    //   // We might want to disable the preview creation to support big files
    //   if (!this.props.disablePreview) {
    //     file.preview = window.URL.createObjectURL(file);
    //   }
    //   files.push(file);
    // }

    // console.log(files)
    console.log('aaa')
    console.log(data)
    if (data.type != 'text' && data.type != 'html') return
    if (!isUrl(data.text)) return
    console.log('asd')
    if (!isImage(data.text)) return
    console.log('asd2')
    return this.insertImage(state, data.text)
  }

  /**
   * Insert an image with `src` at the current selection.
   *
   * @param {State} state
   * @param {String} src
   * @return {State}
   */

  insertImage = (state, src) => {
    console.log('insert Image', src)
    return state
      .transform()
      .insertBlock({
        type: 'image',
        isVoid: true,
        data: { src }
      })
      .apply()
  }

}

/**
 * Export.
 */

export default HoveringMenu