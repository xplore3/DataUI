import React from 'react';
import './index.less';

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="nav-item">首页</div>
      <div className="nav-item">我的</div>
      <div className="nav-item">更多</div>
    </aside>
  );
};

export default Sidebar;
