// components/Footer.jsx
//import React from 'react';
import './index.less';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <h3>AI智鉴局</h3>
          <p>智能消费安全鉴定平台</p>
        </div>
        <div className="footer-info">
          <p>© 2023 AI智鉴局 版权所有</p>
          <p>数据来源：国家市场监督管理总局、中国消费者协会等权威机构</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
