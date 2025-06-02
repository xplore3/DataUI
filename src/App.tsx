import './App.css';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import 'virtual:uno.css';
import About from './views/about';
import Chat from './views/chat';
import DownloadWithCode from './views/download';
import Help from './views/help';
import UserCenter from './views/user';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/download" element={<DownloadWithCode />} />
        <Route path="/about" element={<About />} />
        <Route path="/help" element={<Help />} />
        <Route path="/user" element={<UserCenter />} />
      </Routes>
    </Router>
  );
}

export default App;
