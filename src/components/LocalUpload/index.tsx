import React, { useRef } from "react";
import { UploadOutlined } from '@ant-design/icons';


interface LocalUploadProps {
    files: File[];
    setFiles: (files: File[]) => void;
}


const LocalUpload: React.FC<LocalUploadProps> = ({ files, setFiles }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const triggerFileInput = (e: React.MouseEvent) => {
        e.preventDefault();
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (files.find(f => f.name === file.name)) {
            alert(`文件 "${file.name}" 已添加`);
            return;
        }

        setFiles([...files, file]);

        event.target.value = '';
    };

    const handleRemove = (fileName: string) => {
        setFiles(files.filter(f => f.name !== fileName));
    }

    return (
        <div>
            <button 
                onClick={ triggerFileInput } 
                style={{
                    backgroundColor: '#1890ff',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                }}
            >
                {<UploadOutlined />} 选择文件
            </button>

            {files.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <h3>已添加文件列表</h3>

                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {files.map(file => (
                            <li 
                                key={ file.name } 
                                style={{
                                    marginBottom: 8,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: '#f9f9f9',
                                    border: '1px solid #eee',
                                    padding: '8px 12px',
                                    borderRadius: 4
                                }}
                            >
                                <span>{file.name}</span>

                                <button 
                                    onClick={() => handleRemove(file.name)} 
                                    style={{
                                        backgroundColor: '#ff4d4f',
                                        color: 'white',
                                        border: 'none',
                                        padding: '4px 10px',
                                        borderRadius: 4,
                                        cursor: 'pointer'
                                    }}
                                >
                                    移除
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <input 
                type="file"
                ref={ fileInputRef }
                style={{ display: 'none' }}
                onChange={ handleFileChange }
            />
        </div>
    )
};


export default LocalUpload;