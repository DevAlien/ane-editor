import React from 'react'
import {render} from 'react-dom'

import Component from '../../src'
import ToHTML from '../../src/toHtml'

let Demo = React.createClass({
  getInitialState: function() {
    return {state: false};
  },
  onChange(state) {
    this.setState({state: state.state});
  },
  render() {
    let html = '';

    if (this.state.state) html = ToHTML(this.state.state);

    return <div>
      <h1>ane-editor Demo</h1>
      <Component onChange={this.onChange}/>
      <h2>Preview</h2>
      <div dangerouslySetInnerHTML={{__html: html}}></div>
    </div>
  }
})

render(<Demo/>, document.querySelector('#root'))
