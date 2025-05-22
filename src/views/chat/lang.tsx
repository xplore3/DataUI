////
//import { useUserStore } from '@/stores/useUserStore';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/16/solid';


// Language options data
const languageOptions = [
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' },
  { label: '한국어', value: 'ko' },
  { label: 'Español', value: 'es' },
  { label: 'Français', value: 'fr' },
  { label: 'Hindi', value: 'hi' },
  { label: 'แบบไทย', value: 'th' },
  { label: '中文', value: 'zh' },
];

const Lang = ({ onChange }: { onChange?: (lang: string) => void }) => {
  //const { userProfile } = useUserStore();

  // Handle language selection
  const handleLangSelect = (lang: string) => {
    onChange?.(lang);
  };

  return (
    <div className="GeologicaRegular">
      <Menu>
        <MenuButton
          className="GeologicaRegular flex items-center justify-center   py-1 rounded-md bg-white hover:bg-gray-100"
          style={{
            color: 'var(--text-color-1)',
            background: 'var(--background-color)',
            border: '1px solid var(--text-color-1)',
          }}
        >
          <span>
            {'EN'}
          </span>
          <ChevronDownIcon className="h-4 w-4 ml-1" style={{ color: 'var(--text-color-1)' }} />
        </MenuButton>

        <MenuItems
          transition
          anchor="bottom end"
          className="GeologicaRegular z-[2] rounded-md shadow-md"
          style={{
            padding: '10px',
            color: 'var(--text-color-1)',
            background: 'var(--background-color)',
            maxHeight: '50vh', // Set maximum height to 50% of viewport height
          }}
        >
          {languageOptions.map(lang => (
            <MenuItem key={lang.label}>
              {({ active }) => (
                <div
                  className={`px-3 py-1 cursor-pointer ${active ? 'color-[#2ebae6]' : ''}}`}
                  onClick={() => handleLangSelect(lang.value)}
                >
                  {lang.label}
                </div>
              )}
            </MenuItem>
          ))}
        </MenuItems>
      </Menu>

      {/* Custom scrollbar styles for Webkit browsers */}
      <style>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: var(--background-color);
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: var(--text-color-1);
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: var(--text-color-1);
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default Lang;
