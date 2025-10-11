// components/Header.jsx
//import React from 'react';
import './index.less';

const Header = ({ currentPage = 'home' }) => {
  return (
    <header className="header">
      <nav className="nav">
        <h1 className="logo">AI智鉴局</h1>
        <div className="nav-links">
          <a 
            href="/" 
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
          >
            首页
          </a>
          <a 
            href="/brand" 
            className={`nav-link ${currentPage === 'brand' ? 'active' : ''}`}
          >
            品牌鉴定
          </a>
          <a 
            href="/guide" 
            className={`nav-link ${currentPage === 'guide' ? 'active' : ''}`}
          >
            消费指南
          </a>
          <a 
            href="/about" 
            className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
          >
            关于我们
          </a>
        </div>
      </nav>
    </header>
  );
};

export default Header;
