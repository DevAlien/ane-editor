import { Editor, Mark, Raw } from 'slate'
import React, {PropTypes} from 'react'
import isImage from 'is-image'
import isUrl from 'is-url'
import upload from './plugins/upload';
import NodeImage from './nodes/Image.js';
import AutoReplace from 'slate-auto-replace';

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
  }),
  AutoReplace({
    trigger: 'space',
    before: /^(>)$/,
    transform: transform => transform.setBlock('blockquote')
  }),
  AutoReplace({
    trigger: 'space',
    before: /^(-)$/,
    transform: transform => transform.setBlock('li').wrapBlock('ul')
  }),
  AutoReplace({
    trigger: 'space',
    before: /(``)$/,
    transform: transform => transform.toggleMark('code')
  }),
  AutoReplace({
    trigger: 'space',
    before: /^(#{1,6})$/,
    transform: (transform, e, data, matches) => {
      const [ hashes ] = matches.before
      const level = hashes.length
      return transform.setBlock({
        type: 'h',
        data: { level }
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

const initialState = {"nodes":[{"kind":"block","type":"heading-one","nodes":[{"kind":"text","text":"ANE Editor"}]},{"kind":"block","type":"paragraph","nodes":[{"kind":"text","text":"ANE Editor uses slate as a framework, which gives you a good API to build an editor."}]},{"kind":"block","type":"paragraph","nodes":[{"kind":"text","ranges":[{"text":"In this editor there are some features, like "},{"text":"inline code","marks":[{"type":"code"}]},{"text":" or it lets you paste or drop images that will automatically uploaded on dripr.io."}]}]},{"kind":"block","type":"paragraph","nodes":[{"kind":"text","ranges":[{"text":"You can also use a sort of markdown like you start a new block with "},{"text":"###","marks":[{"type":"code"}]},{"text":" it will create an h3, or you can start with a "},{"text":">","marks":[{"type":"code"}]},{"text":" to make a block quote or "},{"text":"-","marks":[{"type":"code"}]},{"text":" to create a bullet list."}]}]},{"kind":"block","type":"paragraph","nodes":[{"kind":"text","text":"If you select some text you will have some options to make it bold, to give it different styles."}]},{"kind":"block","type":"paragraph","nodes":[{"kind":"text","ranges":[{"text":"You can change the styles as well pressing "},{"text":"CMD + b","marks":[{"type":"code"}]},{"text":" or "},{"text":"CMD + u","marks":[{"type":"code"}]},{"text":" "}]}]},{"kind":"block","type":"paragraph","nodes":[{"kind":"text","text":"Clicking on an image gives you some options as well"}]},{"kind":"block","type":"image","isVoid":true,"data":{"src":"https://files.dripr.io/b8be4d33-3ace-4747-a370-5321f0eb4a87.png","width":256}},{"kind":"block","type":"paragraph","nodes":[{"kind":"text","text":""}]}]};

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
  'blockquote': (props) => <blockquote {...props.attributes}>{props.children}</blockquote>,
  'ul': props => <ul {...props.attributes}>{props.children}</ul>,
  'heading-one': props => <h1 {...props.attributes}>{props.children}</h1>,
  'heading-two': props => <h2 {...props.attributes}>{props.children}</h2>,
  'li': props => <li {...props.attributes}>{props.children}</li>,
  'numbered-list': props => <ol {...props.attributes}>{props.children}</ol>,
  'image': NodeImage,
  'h': props => {
      const { attributes, children, node } = props
      const level = node.data.get('level')
      const Tag = `h${level}`
      return <Tag {...attributes}>{children}</Tag>
    }
}

const schema = {
  nodes: NODES,
  marks: {
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
};

/**
 * The hovering menu example.
 *
 * @type {Component}
 */

class AneEditor extends React.Component {

  static propTypes = {
    onChange: PropTypes.func
  }

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
    if (this.props.onChange) this.props.onChange({state: state});
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
    if (type != 'ul' && type != 'numbered-list') {
      const isActive = this.hasBlock(type)
      const isList = this.hasBlock('li')

      if (isList) {
        transform = transform
          .setBlock(isActive ? DEFAULT_NODE : type)
          .unwrapBlock('ul')
          .unwrapBlock('numbered-list')
      }

      else {
        transform = transform
          .setBlock(isActive ? DEFAULT_NODE : type)
      }
    }

    // Handle the extra wrapping required for list buttons.
    else {
      const isList = this.hasBlock('li')
      const isType = state.blocks.some((block) => {
        return !!document.getClosest(block, parent => parent.type == type)
      })

      if (isList && isType) {
        transform = transform
          .setBlock(DEFAULT_NODE)
          .unwrapBlock('ul')
          .unwrapBlock('numbered-list')
      } else if (isList) {
        transform = transform
          .unwrapBlock(type == 'ul' ? 'numbered-list' : 'ul')
          .wrapBlock(type)
      } else {
        transform = transform
          .setBlock('li')
          .wrapBlock(type)
      }
    }

    state = transform.apply()
    this.setState({ state })
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
          {this.renderBlockButton('heading-one', 'looks_one')}
          {this.renderBlockButton('heading-two', 'looks_two')}
          {this.renderBlockButton('blockquote', 'format_quote')}
          {this.renderBlockButton('numbered-list', 'format_list_numbered')}
          {this.renderBlockButton('ul', 'format_list_bulleted')}
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

  renderBlockButton = (type, icon) => {
    const isActive = this.hasBlock(type)
    const onMouseDown = e => this.onClickBlock(e, type)

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
      <div className="editor" style={{position:'relative', width: '900px', margin: '0 auto'}}>
        {!this.state.loading && <div ref="sideMenu" className="side-menu" style={{visible: 'none'}}>
          <span className="material-icons">person</span>
          <span className="material-icons" onMouseDown={onMouseDown}>image</span>
        </div>
        }
        <Editor
        schema={schema}
          plugins={plugins}
          className="aneeditor"
          style={{width: '800px', minHeight: '500px', margin: '0 auto'}}
          state={this.state.state}
          onChange={this.onChange}
          onDocumentChange={this.onDocumentChange}
          onKeyDown={this.onKeyDown}
        />
        {this.state.loading && <div className="cover">Loading</div>}
      </div>
    )
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
        console.log(window.scrollY)
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
      .apply();
  }

}

export default AneEditor;