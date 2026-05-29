import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, InputNumber, DatePicker, Select, Button, Card, Space, message } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import useContractStore from '../../stores/contractStore';
import { Contract, ContractStatus } from '../../types/api';

const { TextArea } = Input;

const ContractFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [form] = Form.useForm();
  
  const {
    currentContract,
    loading,
    fetchContractById,
    createContract,
    updateContract,
    clearCurrentContract,
  } = useContractStore();

  useEffect(() => {
    if (isEdit && id) {
      fetchContractById(id);
    }
    return () => {
      clearCurrentContract();
    };
  }, [isEdit, id]);

  useEffect(() => {
    if (isEdit && currentContract) {
      form.setFieldsValue({
        ...currentContract,
        signDate: currentContract.signDate ? require('dayjs')(currentContract.signDate) : null,
        effectiveDate: currentContract.effectiveDate ? require('dayjs')(currentContract.effectiveDate) : null,
        expiryDate: currentContract.expiryDate ? require('dayjs')(currentContract.expiryDate) : null,
      });
    }
  }, [currentContract, form]);

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        signDate: values.signDate?.format('YYYY-MM-DD'),
        effectiveDate: values.effectiveDate?.format('YYYY-MM-DD'),
        expiryDate: values.expiryDate?.format('YYYY-MM-DD'),
      };

      if (isEdit && id) {
        await updateContract(id, data);
        message.success('合同更新成功');
      } else {
        await createContract(data);
        message.success('合同创建成功');
      }
      navigate('/contracts');
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  return (
    <Card
      title={
        <Space>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/contracts')}
          />
          {isEdit ? '编辑合同' : '新建合同'}
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 800, margin: '0 auto' }}
      >
        <Form.Item
          name="contractNo"
          label="合同编号"
          rules={[{ required: true, message: '请输入合同编号' }]}
        >
          <Input placeholder="请输入合同编号" />
        </Form.Item>

        <Form.Item
          name="title"
          label="合同标题"
          rules={[{ required: true, message: '请输入合同标题' }]}
        >
          <Input placeholder="请输入合同标题" />
        </Form.Item>

        <Form.Item
          name="partyA"
          label="甲方"
          rules={[{ required: true, message: '请输入甲方名称' }]}
        >
          <Input placeholder="请输入甲方名称" />
        </Form.Item>

        <Form.Item
          name="partyB"
          label="乙方"
          rules={[{ required: true, message: '请输入乙方名称' }]}
        >
          <Input placeholder="请输入乙方名称" />
        </Form.Item>

        <Form.Item
          name="contractType"
          label="合同类型"
          rules={[{ required: true, message: '请选择合同类型' }]}
        >
          <Select placeholder="请选择合同类型">
            <Select.Option value="采购合同">采购合同</Select.Option>
            <Select.Option value="销售合同">销售合同</Select.Option>
            <Select.Option value="服务合同">服务合同</Select.Option>
            <Select.Option value="劳动合同">劳动合同</Select.Option>
            <Select.Option value="租赁合同">租赁合同</Select.Option>
            <Select.Option value="其他">其他</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="amount"
          label="合同金额"
          rules={[{ required: true, message: '请输入合同金额' }]}
        >
          <InputNumber
            placeholder="请输入合同金额"
            prefix="¥"
            style={{ width: '100%' }}
            min={0}
            precision={2}
          />
        </Form.Item>

        <Form.Item
          name="signDate"
          label="签署日期"
          rules={[{ required: true, message: '请选择签署日期' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="effectiveDate"
          label="生效日期"
          rules={[{ required: true, message: '请选择生效日期' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="expiryDate"
          label="到期日期"
          rules={[{ required: true, message: '请选择到期日期' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="content"
          label="合同内容"
          rules={[{ required: true, message: '请输入合同内容' }]}
        >
          <TextArea rows={6} placeholder="请输入合同内容" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              {isEdit ? '更新' : '创建'}
            </Button>
            <Button onClick={() => navigate('/contracts')}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ContractFormPage;
