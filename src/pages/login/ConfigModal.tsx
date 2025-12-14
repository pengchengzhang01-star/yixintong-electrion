import { LogLevel } from "@openim/wasm-client-sdk";
import { Button, Form, Input, Modal, Select, Tabs } from "antd";
import React, { memo } from "react";

import { getApiUrl, getChatUrl, getLogLevel, getWsUrl } from "@/config";

enum HostType {
  Https = "https://",
  Http = "http://",
  Ws = "ws://",
  Wss = "wss://",
}

interface ConfigModalProps {
  visible: boolean;
  close: () => void;
}

interface ConfigValues {
  IMWsUrl: string;
  IMApiUrl: string;
  ChatUrl: string;
  LogLevel: LogLevel;
}

const getUrlWithoutHosts = (url: string) => {
  return url
    .replace("https://", "")
    .replace("http://", "")
    .replace("ws://", "")
    .replace("wss://", "");
};

const getUrlWithHosts = (url: string, type: HostType) => {
  return type + url;
};

const logLevelOptions = [
  { value: LogLevel.Verbose, label: <span>Verbose</span> },
  { value: LogLevel.Debug, label: <span>Debug</span> },
  { value: LogLevel.Info, label: <span>Info</span> },
  { value: LogLevel.Warn, label: <span>Warn</span> },
  { value: LogLevel.Error, label: <span>Error</span> },
  { value: LogLevel.Fatal, label: <span>Fatal</span> },
  { value: LogLevel.Panic, label: <span>Panic</span> },
];

const ConfigModal: React.FC<ConfigModalProps> = ({ visible, close }) => {
  const getIntialValues = (type: HostType): ConfigValues => {
    console.log(getLogLevel());

    if (!getApiUrl().includes(type)) {
      return {
        IMWsUrl: "",
        IMApiUrl: "",
        ChatUrl: "",
        LogLevel: getLogLevel(),
      };
    }
    return {
      IMWsUrl: getUrlWithoutHosts(getWsUrl()),
      IMApiUrl: getUrlWithoutHosts(getApiUrl()),
      ChatUrl: getUrlWithoutHosts(getChatUrl()),
      LogLevel: getLogLevel(),
    };
  };

  const updateFinish = (values: ConfigValues, isHttps: boolean) => {
    localStorage.setItem(
      "wsUrl",
      getUrlWithHosts(values.IMWsUrl, isHttps ? HostType.Wss : HostType.Ws),
    );
    localStorage.setItem(
      "apiUrl",
      getUrlWithHosts(values.IMApiUrl, isHttps ? HostType.Https : HostType.Http),
    );
    localStorage.setItem(
      "chatUrl",
      getUrlWithHosts(values.ChatUrl, isHttps ? HostType.Https : HostType.Http),
    );
    localStorage.setItem("logLevel", values.LogLevel.toString());

    window.location.reload();
  };

  const defaultActiveKey = getApiUrl().includes(HostType.Http) ? "http" : "https";

  return (
    <Modal
      width={600}
      footer={null}
      title="Config"
      open={visible}
      onCancel={close}
      centered
    >
      <Tabs
        defaultActiveKey={defaultActiveKey}
        items={[
          {
            key: "http",
            label: "ip+port",
            children: (
              <Form<ConfigValues>
                name="http"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                initialValues={getIntialValues(HostType.Http)}
                onFinish={(values) => updateFinish(values, false)}
                autoComplete="off"
              >
                <Form.Item
                  label="IMWsUrl"
                  name="IMWsUrl"
                  rules={[{ required: true, message: "Please input your IMWsUrl!" }]}
                >
                  <Input
                    addonBefore="ws://"
                    placeholder="Such as：121.5.182.23:10001"
                  />
                </Form.Item>
                <Form.Item
                  label="IMApiUrl"
                  name="IMApiUrl"
                  rules={[{ required: true, message: "Please input your IMApiUrl!" }]}
                >
                  <Input
                    addonBefore="http://"
                    placeholder="Such as：121.5.182.23:10002"
                  />
                </Form.Item>
                <Form.Item
                  label="ChatUrl"
                  name="ChatUrl"
                  rules={[{ required: true, message: "Please input your ChatUrl!" }]}
                >
                  <Input
                    addonBefore="http://"
                    placeholder="Such as：121.5.182.23:10008"
                  />
                </Form.Item>
                <Form.Item
                  label="LogLevel"
                  name="LogLevel"
                  rules={[{ required: true, message: "Please input your LogLevel!" }]}
                >
                  <Select options={logLevelOptions} />
                </Form.Item>
                <Form.Item className="mb-3 mt-10" wrapperCol={{ offset: 10, span: 14 }}>
                  <Button type="primary" htmlType="submit">
                    Save
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
          {
            key: "https",
            label: "https+domain",
            children: (
              <Form<ConfigValues>
                name="https"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                initialValues={getIntialValues(HostType.Https)}
                onFinish={(values) => updateFinish(values, true)}
                autoComplete="off"
              >
                <Form.Item
                  label="IMWsUrl"
                  name="IMWsUrl"
                  rules={[{ required: true, message: "Please input your IMWsUrl!" }]}
                >
                  <Input
                    addonBefore="wss://"
                    placeholder="Such as：web.rentsoft.cn/msg_gateway"
                  />
                </Form.Item>
                <Form.Item
                  label="IMApiUrl"
                  name="IMApiUrl"
                  rules={[{ required: true, message: "Please input your IMApiUrl!" }]}
                >
                  <Input
                    addonBefore="https://"
                    placeholder="Such as：web.rentsoft.cn/api"
                  />
                </Form.Item>
                <Form.Item
                  label="ChatUrl"
                  name="ChatUrl"
                  rules={[{ required: true, message: "Please input your ChatUrl!" }]}
                >
                  <Input
                    addonBefore="https://"
                    placeholder="Such as：web.rentsoft.cn/chat"
                  />
                </Form.Item>
                <Form.Item
                  label="LogLevel"
                  name="LogLevel"
                  rules={[{ required: true, message: "Please input your LogLevel!" }]}
                >
                  <Select options={logLevelOptions} />
                </Form.Item>
                <Form.Item wrapperCol={{ offset: 10, span: 14 }}>
                  <Button type="primary" htmlType="submit">
                    Save
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
        ]}
      ></Tabs>
    </Modal>
  );
};

export default memo(ConfigModal);
