import { Layout, Menu, Switch, Button, Affix, Popconfirm } from 'antd';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  EditFilled,
  DeleteFilled,
  GithubOutlined,
  PlusOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { UnControlled as CodeMirror } from 'react-codemirror2';
// require styles
import 'codemirror/lib/codemirror.css';
// language js
import 'codemirror/mode/ttcn-cfg/ttcn-cfg.js';

import FormModal from './FormModal';

import * as api from '../api';

import '../register-service-worker';

const { Content, Sider } = Layout;

interface hostsConfig {
  id: string;
  hosts: string;
  name: string;
  ip: string;
  status: string;
}
let showRenderCount = 0;
let initHosts: hostsConfig;

export default () => {
  const [temp, setTemp] = useState<hostsConfig>({
    id: '',
    hosts: '获取数据中……',
    name: '系统hosts',
    ip: '',
    status: 'on',
  });

  const [config, setConfig] = useState<hostsConfig[]>([]);

  //获取配置
  if (showRenderCount < 1) {
    showRenderCount++;
    api.getConfig().then((data) => {
      setConfig(data);
      setTimeout(() => {
        setConfig(data);
      }, 500);
    });
    api.getHosts().then((data) => {
      initHosts = {
        id: '',
        hosts: data,
        name: '系统hosts',
        ip: '',
        status: 'on',
      };
      setTemp(initHosts);
    });
    console.log(showRenderCount);
  }

  //获取hosts

  const menuStyle = {
    margin: '0 5px',
  };

  //右侧输入配置
  let cmOptions = {
    // codemirror options
    tabSize: 4,
    mode: 'text/x-ttcn-cfg',
    lineNumbers: true,
    line: true,
    readOnly: temp.name == '系统hosts',
    extraKeys: {
      // 回车自动补全ip
      Enter: (cm: any) => {
        const doc = cm.doc;
        const line = doc.getCursor().line; // 当前行
        const text = doc.getLineHandle(line).text.trim(); // 当前行的内容
        // 无ip, 有空格、有#注释，自动跳到下一行
        if (
          !temp.ip ||
          text.length === 0 ||
          text.indexOf(' ') > 0 ||
          text.indexOf('#') === 0
        ) {
          cm.execCommand('newlineAndIndent');
          return;
        }
        cm.execCommand('goLineStartSmart'); // 跳到行首
        cm.replaceSelection(temp.ip + ' '); // 输入ip
        setTimeout(() => {
          cm.execCommand('goLineEndAlt-Right'); // 调到行位
          cm.execCommand('goLineDown'); // 下一行
          setTimeout(() => {
            cm.execCommand('newlineAndIndent'); // 换行
          }, 200);
        }, 200);
      },
    },
  };
  /**
   * 切换
   * @param obj
   */
  function menuSelect(obj: any) {
    if (obj.key > 0) {
      setTemp(config[obj.key - 1]);
    } else {
      api.getHosts().then((data)=>{
        initHosts.hosts = data;
        setTemp(initHosts);
      })
    }
  }
  /**
   * 删除
   * @param index
   */
  function menuDelete(index: number) {
    const item = config[index];
    api.delConfig(item.id).then(() => {
      delete config[index];
      setConfig(config);
      setTemp({
        id: '',
        hosts: '',
        name: '',
        ip: '',
        status: '',
      });
    });
  }
  /**
   * 切换状态
   * @param index
   */
  function switchChange(index: number) {
    const item = config[index];
    if (item.status == 'on') {
      item.status = 'off';
      temp.status = 'off';
    } else {
      item.status = 'on';
      temp.status = 'on';
    }
    config[index] = item;
    setConfig(config);
    setTemp(temp);
    api.updateConfig(item);
  }
  /**
   *
   * 修改 弹窗
   * @param index
   */
  function menuUpdate(index: number) {
    setVisible(true);
    setActionType('修改');
  }

  const [visible, setVisible] = useState(false);
  const [actionType, setActionType] = useState('添加');
  /**
   * 新增或者修改
   * @param values {name,ip}
   * @param type 添加、修改
   */
  const onEdit = (values: any, type: string) => {
    if(!values.name){
      return;
    }
    if (type == '添加') {
      let tmp = {
        ip: values.ip,
        name: values.name,
        hosts: '# ' + values.name,
        status: 'on',
        id: new Date().getTime() + '',
      };
      api.addConfig(tmp).then((data) => {
        config.push(tmp);
        setConfig(config);
        setTemp(tmp);
      });
    } else if(type == '修改') {
      temp.ip = values.ip;
      temp.name = values.name;
      setTemp(temp);
      api.updateConfig(temp).then((data) => {
        for (let i = 0; i < config.length; i++) {
          const t = config[i];
          if (t && t.id == temp.id) {
            config[i] = temp;
          }
        }
        setConfig(config);
        
      });
    }

    console.log('Received values of form: ', values, type);
    setVisible(false);
  };

  return (
    <Layout style={{ height: '100%' }}>
      <Sider width={250} collapsed={false} style={{ overflowY: 'scroll' }}>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['0']}
          style={{ margin: '0 0 30px 0' }}
          className="menu"
          onSelect={menuSelect}
          inlineCollapsed={false}
        >
          <Menu.Item key="0" icon={<LockOutlined />}>
            <span
              style={{
                overflow: 'hidden',
                float: 'left',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              系统hosts
            </span>
          </Menu.Item>
          {config.map((item, index) => {
            return (
              <Menu.Item key={index + 1}>
                <span
                  style={{
                    overflow: 'hidden',
                    float: 'left',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.name}
                </span>
                <span style={{ float: 'right' }}>
                  <Switch
                    checkedChildren="开启"
                    unCheckedChildren="关闭"
                    defaultChecked={item.status == 'on'}
                    size="small"
                    style={menuStyle}
                    className="operate"
                    onChange={() => switchChange(index)}
                  />
                  <EditFilled
                    title="修改"
                    style={menuStyle}
                    className="operate hide"
                    onClick={() => menuUpdate(index)}
                  />
                  <Popconfirm
                    title={'确定删除: ' + item.name + '?'}
                    onConfirm={() => menuDelete(index)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <DeleteFilled
                      title="删除"
                      style={menuStyle}
                      className="operate hide"
                    />
                  </Popconfirm>
                </span>
              </Menu.Item>
            );
          })}
        </Menu>

        <Affix
          style={{ textAlign: 'center', display: 'block' }}
          offsetBottom={10}
        >
          <div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setVisible(true);
                setActionType('添加');
              }}
            >
              添加
            </Button>

            <FormModal
              visible={visible}
              onCreate={onEdit}
              onNo={() => {
                setVisible(false);
              }}
              checkName={(name, type) => {
                //新增，检查是否有重复
                const rs = config.filter((item) => {
                  return item.name == name;
                });
                //修改，如果hosts 内容相等，则说明修改的是当前项
                if (rs.length == 1 && type == '修改') {
                  if (temp.hosts == rs[0].hosts) {
                    return false;
                  }
                }
                return rs.length > 0;
              }}
              type={actionType}
              editValue={{ name: temp.name, ip: temp.ip }}
            />

            <a
              href="https://github.com/xuzhenjun130/hostsSwitchHelper-go"
              target="_blank"
            >
              <Button type="default" icon={<GithubOutlined />}>
                关于
              </Button>
            </a>
          </div>
        </Affix>
      </Sider>
      <Layout style={{ margin: 0, padding: 0, height: '100%' }}>
        <Content>
          <CodeMirror
            value={temp.hosts}
            options={cmOptions}
            onChange={(editor, data, value) => {
              temp.hosts = value;
              onEdit({ name: temp.name, ip: temp.ip }, '修改');
            }}
          />
        </Content>
      </Layout>
    </Layout>
  );
};
