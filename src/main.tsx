import { render } from 'preact';
import App from './App.tsx';
import './index.css';
import { FONT_DATA } from './utils/fontData';

if (FONT_DATA) {
  const style = document.createElement('style');
  style.innerHTML = `
    @font-face {
      font-family: 'GameFont';
      src: url('${FONT_DATA}') format('woff2');
      font-weight: normal;
      font-style: normal;
    }
    body {
      font-family: 'GameFont', sans-serif;
    }
  `;
  document.head.appendChild(style);
}

render(<App />, document.getElementById('root')!);
