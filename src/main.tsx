// Add polyfill for modern regex features to support older mobile browsers
import 'core-js/stable/regexp';
import 'core-js/stable/object';

// Add polyfill for Object.hasOwn to support older environments
  // @ts-ignore
if (!Object.hasOwn) {
  // @ts-ignore
  Object.hasOwn = function(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
}

//import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <App />
)
