import './App.css';
import Chat from './views/chat';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import 'virtual:uno.css';
import DownloadWithCode from './views/download';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/download" element={<DownloadWithCode />} />
      </Routes>
    </Router>
  );
}

export default App;
