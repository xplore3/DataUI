import React from 'react';
import './index.less';

interface WechatShareGuideProps {
  visible: boolean;
  onClose: () => void;
}

const WechatShareGuide: React.FC<WechatShareGuideProps> = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <div className="wechat-guide-overlay" onClick={onClose}>
      {/* 箭头指向右上角 */}
      {/* <div className="arrow-pointer">
        <div className="arrow"></div>
        <div className="pulse"></div>
      </div> */}
      <div className="wechat-guide" onClick={e => e.stopPropagation()}>
        <div className="wechat-guide-header">
          <h3>微信分享</h3>
          <button className="wechat-guide-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="wechat-guide-content">
          <div className="guide-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>点击右上角菜单</h4>
                <p>点击页面右上角的三个点菜单按钮</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>选择分享方式</h4>
                <p>在弹出菜单中选择"分享给朋友"或"分享到朋友圈"</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>完成分享</h4>
                <p>选择好友或朋友圈即可完成分享</p>
              </div>
            </div>
          </div>
        </div>

        <div className="wechat-guide-footer">
          <button className="got-it-btn" onClick={onClose}>
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};

export default WechatShareGuide;
