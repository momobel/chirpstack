import React, { useState, useEffect } from "react";

import { notification, Input, Select, Button, Space, Form, Dropdown, Menu } from "antd";
import { ReloadOutlined, CopyOutlined } from "@ant-design/icons";

import { GetRandomDevAddrRequest, GetRandomDevAddrResponse } from "@chirpstack/chirpstack-api-grpc-web/api/device_pb";

import DeviceStore from "../stores/DeviceStore";

interface IProps {
  label: string;
  name: string;
  devEui: string;
  required?: boolean;
  value?: string;
  disabled?: boolean;
}

function DevAddrInput(props: IProps) {
  const form = Form.useFormInstance();
  const [byteOrder, setByteOrder] = useState<string>("msb");
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    if (props.value) {
      setValue(props.value);
    }
  }, [props]);

  const updateField = (v: string) => {
    if (byteOrder === "lsb") {
      const bytes = v.match(/[A-Fa-f0-9]{2}/g) || [];
      v = bytes.reverse().join("");
    }

    form.setFieldsValue({
      [props.name]: v,
    });
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    const match = v.match(/[A-Fa-f0-9]/g);

    let value = "";
    if (match) {
      if (match.length > 8) {
        value = match.slice(0, 8).join("");
      } else {
        value = match.join("");
      }
    }

    setValue(value);
    updateField(value);
  };

  const onByteOrderSelect = (v: string) => {
    if (v === byteOrder) {
      return;
    }

    setByteOrder(v);

    const current = value;
    const bytes = current.match(/[A-Fa-f0-9]{2}/g) || [];
    const vv = bytes.reverse().join("");

    setValue(vv);
    updateField(vv);
  };

  const generateRandom = () => {
    let req = new GetRandomDevAddrRequest();
    req.setDevEui(props.devEui);

    DeviceStore.getRandomDevAddr(req, (resp: GetRandomDevAddrResponse) => {
      setValue(resp.getDevAddr());
      updateField(resp.getDevAddr());
    });
  };

  const copyToClipboard = () => {
    const bytes = value.match(/[A-Fa-f0-9]{2}/g);

    if (bytes !== null && navigator.clipboard !== undefined) {
      navigator.clipboard
        .writeText(bytes.join("").toUpperCase())
        .then(() => {
          notification.success({
            message: "Copied to clipboard",
            duration: 3,
          });
        })
        .catch(e => {
          notification.error({
            message: "Error",
            description: e,
            duration: 3,
          });
        });
    }
  };

  const copyToClipboardHexArray = () => {
    const bytes = value.match(/[A-Fa-f0-9]{2}/g);

    if (bytes !== null && navigator.clipboard !== undefined) {
      navigator.clipboard
        .writeText(
          bytes
            .join(", ")
            .toUpperCase()
            .replace(/[A-Fa-f0-9]{2}/g, "0x$&"),
        )
        .then(() => {
          notification.success({
            message: "Copied to clipboard",
            duration: 3,
          });
        })
        .catch(e => {
          notification.error({
            message: "Error",
            description: e,
            duration: 3,
          });
        });
    }
  };

  const copyMenu = (
    <Menu
      items={[
        {
          key: "1",
          label: (
            <Button type="text" onClick={copyToClipboard}>
              HEX string
            </Button>
          ),
        },
        {
          key: "2",
          label: (
            <Button type="text" onClick={copyToClipboardHexArray}>
              HEX array
            </Button>
          ),
        },
      ]}
    />
  );

  const addon = (
    <Space size="large">
      <Select value={byteOrder} onChange={onByteOrderSelect}>
        <Select.Option value="msb">MSB</Select.Option>
        <Select.Option value="lsb">LSB</Select.Option>
      </Select>
      <Button type="text" size="small" onClick={generateRandom}>
        <ReloadOutlined />
      </Button>
      <Dropdown overlay={copyMenu}>
        <Button type="text" size="small">
          <CopyOutlined />
        </Button>
      </Dropdown>
    </Space>
  );

  return (
    <Form.Item
      rules={[
        {
          required: props.required,
          message: `Please enter a valid ${props.label}`,
          pattern: new RegExp(/[A-Fa-f0-9]{8}/g),
        },
      ]}
      label={props.label}
      name={props.name}
    >
      <Input hidden />
      <Input
        id={`${props.name}Render`}
        onChange={onChange}
        addonAfter={!props.disabled && addon}
        className="input-code"
        value={value}
        disabled={props.disabled}
      />
    </Form.Item>
  );
}

export default DevAddrInput;
