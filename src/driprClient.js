import fetch from 'isomorphic-fetch';
const BASE = 'https://api.dripr.io';

export default function apiClient(token) {
  return {
    token: token,
    postFile: function(files, extension) {
      let data = new FormData();
      files.forEach(file => {
        data.append('file', file, 'file.' + (extension || 'png'));
      })
      let options = {method: 'post', body: data};
      let url = '/upload/anon';
      if(this.token) {
        url = '/upload'
        options.headers = {Authorization: 'Bearer ' + this.token};
      }
      return fetch(BASE + url, options);
    }
  }
}