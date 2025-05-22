import './App.css';
import Chat from './views/chat';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import 'virtual:uno.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;
