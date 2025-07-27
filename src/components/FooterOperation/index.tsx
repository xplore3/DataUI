import { ReactSVG } from 'react-svg';
import Share from '@/assets/icons/share.svg';
import BookMark from '@/assets/icons/bookmark.svg';
import Refresh from '@/assets/icons/refresh.svg';
import ImgTrue from '@/assets/icons/true.svg';
import Copy from '@/assets/icons/copy.svg';
import Pined from '@/assets/icons/pined.svg';
import './index.less';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import ShareModal from '@/components/ShareModal';
import WechatShareGuide from '@/components/WechatShareGuide';
import QRCodeModal from '@/components/QRCodeModal';
//import { useUserStore } from '@/stores/useUserStore';

interface FooterOperationProps {
  menuList?: Array<'pined' | 'share' | 'bookmark' | 'translate' | 'copy' | 'refresh'>;
  text?: string;
  onPin?: (text: string) => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onTranslate?: (text: string) => void;
  onCopy?: () => void;
  onRefresh?: () => void;
}

const FooterOperation = React.memo<FooterOperationProps>(
  ({ menuList = ['pined', 'share', 'bookmark', 'translate', 'copy'], text = '', onPin, onShare, onBookmark, onCopy, onRefresh }) => {
    const [isBookMark, setIsBookMark] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [wechatGuideVisible, setWechatGuideVisible] = useState(false);
    const [qrcodeModalVisible, setQrcodeModalVisible] = useState(false);
    //const { userProfile } = useUserStore();

    const handleShareClick = () => {
      if (onShare) {
        onShare();
      } else {
        setShareModalVisible(true);
      }
    };

    const handleBookmarkClick = () => {
      //if (!userProfile?.gmail) {
      //  toast('Please login to Google before using this page.');
      //  return;
      //}
      setIsBookMark(true);
      if (onBookmark) {
        onBookmark();
      }
    };

    const handleCopyClick = async () => {
      try {
        await navigator.clipboard.writeText(text.split('|||||')[0]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
        toast('Copied to clipboard!');
      } catch {
        toast.error('Failed to copy!');
      }
      if (onCopy) {
        onCopy();
      }
    };

    return (
      <>
        <div className="footer-operation">
          {menuList.includes('pined') && <ReactSVG className="footer-operation-item" src={Pined} onClick={() => onPin?.(text)} />}
          {menuList.includes('pined') && <div className="text-[8px]"  onClick={() => onPin?.(text)}>生成程序</div>}
          {menuList.includes('share') && <ReactSVG className="footer-operation-item" src={Share} onClick={handleShareClick} />}
          {menuList.includes('copy') &&
            (isCopied ? (
              <ReactSVG className="footer-operation-item" style={{ marginTop: '-2px', color: 'var(--text-color-1)' }} src={ImgTrue} />
            ) : (
              <ReactSVG className="footer-operation-item" src={Copy} onClick={handleCopyClick} />
            ))}
          {menuList.includes('bookmark') &&
            (isBookMark ? (
              <ReactSVG className="footer-operation-item" style={{ marginTop: '-2px', color: 'var(--text-color-1)' }} src={ImgTrue} />
            ) : (
              <ReactSVG className="footer-operation-item" src={BookMark} onClick={handleBookmarkClick} />
            ))}

          {menuList.includes('refresh') && <ReactSVG className="footer-operation-item" src={Refresh} onClick={onRefresh} />}
        </div>
        
        <ShareModal 
          visible={shareModalVisible} 
          onClose={() => setShareModalVisible(false)}
          onWechatGuide={() => setWechatGuideVisible(true)}
          onQRCode={() => setQrcodeModalVisible(true)}
        />
        
        <WechatShareGuide
          visible={wechatGuideVisible}
          onClose={() => setWechatGuideVisible(false)}
        />
        
        <QRCodeModal
          visible={qrcodeModalVisible}
          onClose={() => setQrcodeModalVisible(false)}
        />
      </>
    );
  }
);

export default FooterOperation;
