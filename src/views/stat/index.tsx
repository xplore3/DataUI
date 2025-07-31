import React, { useEffect, useState } from 'react';
import { Table, message } from 'antd';
import { useLocation } from 'react-router-dom';
import { CodeApi } from '@/services/code';

const useQueryParams = () => {
  const { search } = useLocation();
  return new URLSearchParams(search);
};

const UserList: React.FC = () => {
  const [userList, setUserList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const query = useQueryParams();
  const adminCode = query.get('code') || '';

  const fetchUserList = async (page = 1) => {
    setLoading(true);
    try {
      const response = await CodeApi.userList(adminCode, page, pageSize);
      try {
        const json = JSON.parse(response || '[]');
        if (!Array.isArray(json.list)) {
          throw new Error('Invalid user list format');
        }
        setUserList(json.list.slice(0, pageSize));
        setTotal(json.total || json.list.length);
      }
      catch (err) {
        message.error('用户列表格式错误');
        console.error('用户列表格式错误:', err);
        return;
      }
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserList(currentPage);
  }, [adminCode, currentPage]); // 如果参数变了，重新请求

  const columns = [
    {
      title: '序号',
      key: 'id',
      render: (_: any, __: any, id: number) =>
        (currentPage - 1) * pageSize + id + 1,
    },
    { title: '用户ID', dataIndex: 'userId', key: 'userId' },
    //{ title: '用户名', dataIndex: 'name', key: 'name' },
    { title: '邀请码', dataIndex: 'code', key: 'code' },
    { title: '使用统计', dataIndex: 'count', key: 'count' },
    { title: '上次使用', dataIndex: 'lastOnline', key: 'lastOnline' },
  ];

  return (
    <div style={{ padding: 10 }}>
      <h2>用户列表</h2>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={userList}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          onChange: (page) => setCurrentPage(page),
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  );
};

export default UserList;
