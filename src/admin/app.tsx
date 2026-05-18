import { render } from 'solid-js/web';
import { Admin } from './admin';
import './admin.css';

// Mount the app to the DOM
const appElement = document.getElementById('app');
if (appElement) {
  render(() => <Admin />, appElement);
} else {
  console.error('Failed to find #app element');
}
