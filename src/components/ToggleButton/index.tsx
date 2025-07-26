import React, { useState } from 'react';
import './ToggleButton.less';

interface ToggleButtonProps {
  defaultActive?: boolean;
  onToggle?: (active: boolean) => void;
  children?: React.ReactNode;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ defaultActive = false, onToggle, children }) => {
  const [active, setActive] = useState(defaultActive);

  const handleClick = () => {
    const next = !active;
    setActive(next);
    onToggle?.(next);
  };

  return (
    <button className={`toggle-btn ${active ? 'active' : ''}`} onClick={handleClick}>
      {children || (active ? '已开启' : '未开启')}
    </button>
  );
};

export default ToggleButton;
