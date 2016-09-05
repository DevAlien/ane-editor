import DriprAPI from '../driprClient';

/**
 * Insert images on drop or paste.
 *
 * @param {Object} options
 *   @property {Function} applyTransform
 *   @property {Array} extensions (optional)
 * @return {Object} plugin
 */

function DropOrPasteImages({
  applyTransform,
  extensions
}) {
  if (!applyTransform) {
    throw new Error('You must supply an `applyTransform` function.')
  }
  const driprAPI = DriprAPI();

  function uploadFile(file, id, editor) {
    var extension = file.type.replace('image/', '');
    driprAPI.postFile([file], extension).then((response) => {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    })
    .then((stories) => {
      const state = editor.getState();
      const next = state.transform().setNodeByKey(id, {data: {src: stories.urlOriginal}}).apply();
      editor.onChange(next);
    });
  }

  /**
   * On drop or paste.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @param {Editor} editor
   * @return {State}
   */

  function onInsert(e, data, state, editor) {
    switch (data.type) {
      case 'files': return onInsertFiles(e, data, state, editor)
      case 'html': return onInsertHtml(e, data, state, editor)
      case 'text': return onInsertText(e, data, state, editor)
    }
  }

  /**
   * On drop or paste files.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @param {Editor} editor
   * @return {State}
   */
  function onInsertFiles(e, data, state, editor) {
    const { target, files } = data;
    let transform = state.transform();
    if (target) transform = transform.moveTo(target)

    for (const file of files) {
      const id = 'a' + new Date().getTime();
      if (file.type.indexOf("image") !== -1) {
        var extension = file.type.replace('image/', '');
        console.log(file)
        console.log(file.width)
        uploadFile(file, id, editor);
        transform = applyTransform(transform, 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif', id);
      }
    }

    return transform.apply();
  }

  /**
   * On drop or paste html.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @param {Editor} editor
   * @return {State}
   */

  function onInsertHtml(e, data, state, editor) {
    console.log('html')
    // const { html, target } = data
    // const parser = new DOMParser()
    // const doc = parser.parseFromString(html, 'text/html')
    // const body = doc.body
    // const firstChild = body.firstChild
    // if (firstChild.nodeName.toLowerCase() != 'img') return

    // const src = firstChild.src

    // if (extensions) {
    //   const ext = extname(src).slice(1)
    //   if (!extensions.includes(ext)) return
    // }

    // loadImageFile(src, (err, file) => {
    //   if (err) return
    //   let transform = editor.getState().transform()
    //   if (target) transform = transform.moveTo(target)
    //   transform = applyTransform(transform, file)
    //   const next = transform.apply()
    //   editor.onChange(next)
    // })

    // return state
  }

  /**
   * On drop or paste text.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @param {Editor} editor
   * @return {State}
   */

  function onInsertText(e, data, state, editor) {
    console.log('text')
    // const { text, target } = data
    // if (!isUrl(text)) return
    // if (!isImage(text)) return

    // loadImageFile(text, (err, file) => {
    //   if (err) return
    //   let transform = editor.getState().transform()
    //   if (target) transform = transform.moveTo(target)
    //   transform = applyTransform(transform, file)
    //   const next = transform.apply()
    //   editor.onChange(next)
    // })

    // return state
  }

  /**
   * Return the plugin.
   *
   * @type {Object}
   */

  return {
    onDrop: onInsert,
    onPaste: onInsert,
  }
}

/**
 * Export.
 *
 * @type {Function}
 */

export default DropOrPasteImages