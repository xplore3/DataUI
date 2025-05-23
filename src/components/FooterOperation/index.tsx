import { ReactSVG } from 'react-svg';
import Share from '@/assets/icons/share.svg';
import BookMark from '@/assets/icons/bookmark.svg';
import Refresh from '@/assets/icons/refresh.svg';
import ImgTrue from '@/assets/icons/true.svg';
import Copy from '@/assets/icons/copy.svg';
import Pined from '@/assets/icons/pined.svg';
import './index.less';
import React, { useState } from 'react';
import useShare from '@/hooks/useShare';
import { toast } from 'react-toastify';
//import { useUserStore } from '@/stores/useUserStore';

interface FooterOperationProps {
  menuList?: Array<'pined' | 'share' | 'bookmark' | 'translate' | 'copy' | 'refresh'>;
  text?: string;
  onShare?: () => void;
  onBookmark?: () => void;
  onTranslate?: (text: string) => void;
  onCopy?: () => void;
  onRefresh?: () => void;
}

const FooterOperation = React.memo<FooterOperationProps>(
  ({ menuList = ['pined', 'share', 'bookmark', 'translate', 'copy'], text = '', onShare, onBookmark, onCopy, onRefresh }) => {
    const [isBookMark, setIsBookMark] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { handleShareClick: shareHook } = useShare();
    //const { userProfile } = useUserStore();

    const handleShareClick = () => {
      if (onShare) {
        onShare();
      } else {
        shareHook(text.split('|||||')[0]);
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
      <div className="footer-operation">
        {menuList.includes('pined') && <ReactSVG className="footer-operation-item" src={Pined} />}
        {menuList.includes('pined') && <div className="text-[8px]">生成程序</div>}
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
    );
  }
);

export default FooterOperation;
