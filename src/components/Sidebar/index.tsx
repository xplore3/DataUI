import React from 'react';
import { useNavigate } from 'react-router-dom';
import './index.less';

const Sidebar: React.FC = () => {

  const navigate = useNavigate();

  const onHome = () => {
    navigate('/ip');
  };

  const onUser = () => {
    navigate('/user');
  };

  const onMore = () => {
    //navigate('/ip');
  };

  return (
    <aside className="sidebar">
      <div className="nav-item" onClick={onHome}>首页</div>
      <div className="nav-item" onClick={onUser}>我的</div>
      <div className="nav-item" onClick={onMore}>更多</div>
    </aside>
  );
};

export default Sidebar;
