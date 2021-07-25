import React, { useRef, useState } from 'react';
import ProForm, { ModalForm, ProFormText } from '@ant-design/pro-form';
import type { FormInstance } from 'antd';

interface Values {
  name: string;
  ip: string;
}

interface CollectionCreateFormProps {
  visible: boolean;
  onCreate: (values: Values, type: string) => void;
  onNo: () => void; //取消
  checkName: (name: string, type: string) => boolean; //名称唯一性检查
  type: string; //add or update,
  editValue?: Values; //编辑内容
}

const FormModal: React.FC<CollectionCreateFormProps> = ({
  visible,
  onCreate,
  onNo,
  checkName,
  type,
  editValue,
}) => {
  const formRef = useRef<FormInstance>();
  return (
    <>
      <ModalForm
        formRef={formRef}
        title={type}
        width="400px"
        visible={visible}
        onFinish={async (v: Values) => {
          onCreate(v, type);
          return true;
        }}
        onVisibleChange={(e) => {
          formRef.current?.setFieldsValue({
            name: type == '添加' ? '' : editValue?.name,
            ip: type == '添加' ? '' : editValue?.ip,
          });
          if (e == false) {
            onNo();
          }
          return true;
        }}
      >
        <ProForm.Group>
          <ProFormText
            width="md"
            name="name"
            label="名称"
            tooltip="最长为 24 位"
            placeholder="请输入名称"
            rules={[
              { required: true, max: 24 },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (checkName(value, type)) {
                    return Promise.reject(
                      new Error(value + '已经存在，请更换一个'),
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          />
        </ProForm.Group>
        <ProForm.Group>
          <ProFormText
            width="md"
            name="ip"
            label="ip/url"
            tooltip="如果填写url，将每隔30分钟更新一次"
            placeholder="ip或者url"
          />
        </ProForm.Group>
      </ModalForm>
    </>
  );
};

export default FormModal;
