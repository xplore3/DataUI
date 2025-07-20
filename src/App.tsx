import './App.css';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import 'virtual:uno.css';
import About from './views/about';
import Chat from './views/chat';
import DownloadWithCode from './views/download';
import Help from './views/help';
import UserCenter from './views/user';
import WecomAuth from './views/wecom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from 'react';
import { useThemeStore } from './stores/useThemeStore';
import Welcome from './views/welcome';
//import VConsole from 'vconsole';
function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    // 确保在应用启动时设置正确的主题
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  //useEffect(() => {
  //  if (window.location.href.includes('debug=1')) {
  //    new VConsole();
  //  }
  //}, []);

  return (<div>
    <ToastContainer
      position="top-right"
      autoClose={2000}
      hideProgressBar={false}
      newestOnTop={false}
      pauseOnHover={false}
      theme={theme === 'dark' ? 'dark' : 'light'}
    />
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/download" element={<DownloadWithCode />} />
        <Route path="/about" element={<About />} />
        <Route path="/help" element={<Help />} />
        <Route path="/user" element={<UserCenter />} />
        <Route path="/wecom" element={<WecomAuth />} />
        <Route path="/welcome" element={<Welcome />} />
      </Routes>
    </Router>
  </div>);
}

export default App;
