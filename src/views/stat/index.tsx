import React, { useEffect, useState } from 'react';
import { Table, message } from 'antd';
import { useLocation } from 'react-router-dom';
import { CodeApi } from '@/services/code';

const useQueryParams = () => {
  const { search } = useLocation();
  return new URLSearchParams(search);
};

const UserList: React.FC = () => {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const query = useQueryParams();
  const adminCode = query.get('code') || '';

  const fetchUserList = async () => {
    setLoading(true);
    try {
      const response = await CodeApi.userList(adminCode);
      const users = response.data;
      setUserList(users.slice(0, 50));
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserList();
  }, [adminCode]); // 如果参数变了，重新请求

  const columns = [
    { title: '用户ID', dataIndex: 'id', key: 'userId' },
    //{ title: '用户名', dataIndex: 'name', key: 'name' },
    { title: '邀请码', dataIndex: 'code', key: 'code' },
    { title: '使用统计', dataIndex: 'count', key: 'count' },
    { title: '上次使用', dataIndex: 'lastOnline', key: 'lastOnline' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>用户列表（最多显示50条）</h2>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={userList}
        loading={loading}
        pagination={false}
      />
    </div>
  );
};

export default UserList;
