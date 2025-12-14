import { GithubOutlined, GoogleOutlined } from "@ant-design/icons";
import { Button, Form, Input, QRCode, Select, Space, Tabs } from "antd";
import { t } from "i18next";
import md5 from "md5";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useLogin, useSendSms } from "@/api/login";
import login_pc from "@/assets/images/login/login_pc.png";
import login_qr from "@/assets/images/login/login_qr.png";
import { getChatUrl } from "@/config";
import { feedbackToast } from "@/utils/common";
import {
  getAccount,
  getEmail,
  getPhoneNumber,
  setAccount,
  setAreaCode,
  setEmail,
  setIMProfile,
  setPhoneNumber,
} from "@/utils/storage";

import { areaCode } from "./areaCode";
import type { FormType, LoginMethod } from "./index";
import styles from "./index.module.scss";

enum LoginType {
  Password,
  VerifyCode,
}

type LoginFormProps = {
  setFormType: (type: FormType) => void;
  loginMethod: LoginMethod;
  updateLoginMethod: (method: LoginMethod) => void;
};

type OauthMainResponse = {
  success: boolean;
  data: {
    chatToken: string;
    imToken: string;
    userID: string;
  };
};

const LoginForm = ({ loginMethod, setFormType, updateLoginMethod }: LoginFormProps) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loginType, setLoginType] = useState<LoginType>(LoginType.Password);
  const { mutate: login, isLoading: loginLoading } = useLogin();
  const { mutate: semdSms } = useSendSms();

  const [countdown, setCountdown] = useState(0);
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
        if (countdown === 1) {
          clearTimeout(timer);
          setCountdown(0);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onFinish = (params: API.Login.LoginParams) => {
    if (loginType === LoginType.Password) {
      params.password = md5(params.password ?? "");
    }
    if (params.account) {
      setAccount(params.account);
    }
    if (params.phoneNumber) {
      setAreaCode(params.areaCode);
      setPhoneNumber(params.phoneNumber);
    }
    if (params.email) {
      setEmail(params.email);
    }
    login(params, {
      onSuccess: (data) => {
        const { chatToken, imToken, userID } = data.data;
        setIMProfile({ chatToken, imToken, userID });
        navigate("/chat");
      },
    });
  };

  const sendSmsHandle = () => {
    const options: API.Login.SendSmsParams = {
      usedFor: 3,
    };
    if (loginMethod === "phone") {
      options.phoneNumber = form.getFieldValue("phoneNumber") as string;
      options.areaCode = form.getFieldValue("areaCode") as string;
    }
    if (loginMethod === "email") {
      options.email = form.getFieldValue("email") as string;
    }

    semdSms(options, {
      onSuccess() {
        setCountdown(60);
      },
    });
  };

  // const Point = () => (
  //   <div
  //     className="relative h-16 w-16 cursor-pointer rounded-md"
  //     style={{
  //       background: "linear-gradient(to bottom left, #DBEAFE 50%, white 50%)",
  //     }}
  //     onClick={() => setLoginType(loginType === 2 ? 0 : 2)}
  //   >
  //     <img
  //       src={loginType === 2 ? login_pc : login_qr}
  //       alt="login"
  //       className=" absolute left-[25px] top-[15px]"
  //     />
  //   </div>
  // );

  // if (loginType === 2) {
  //   return (
  //     <>
  //       <div className="flex flex-row items-end justify-end">
  //         <Point />
  //       </div>

  //       <div className=" flex flex-col items-center">
  //         <div className="text-xl font-medium">{t("placeholder.qrCodeLogin")}</div>
  //         <span className=" mt-3 text-sm  text-gray-400">
  //           {t("placeholder.qrCodeLoginTitle")}
  //         </span>
  //         <QRCode className="mt-8" value="https://www.openim.online/zh" size={190} />
  //       </div>
  //     </>
  //   );
  // }

  const onLoginMethodChange = (key: string) => {
    updateLoginMethod(key as LoginMethod);
  };

  const toOAuthLogin = async (provider: "google" | "github") => {
    const chatUrl = getChatUrl();
    if (window.electronAPI) {
      const { success, data } = await window.electronAPI.oauthLogin({
        baseUrl: chatUrl,
        provider,
      });
      if (!success) {
        feedbackToast({ error: {} });
        console.error(`${provider} OAuth login failed`);
        return;
      }
      const { chatToken, imToken, userID } = data;
      setIMProfile({ chatToken, imToken, userID });
      navigate("/chat", { replace: true });
      return;
    }
    const callback = `${window.location.origin}/#/oauth/callback`;
    window.location.href = `${chatUrl}/oauth/login/${provider}?cb=${encodeURIComponent(
      callback,
    )}`;
  };

  const handleGoogleLogin = () => toOAuthLogin("google");
  const handleGithubLogin = () => toOAuthLogin("github");

  return (
    <>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xl font-medium">{t("placeholder.welcome")}</div>
        {/* <Point /> */}
      </div>
      <Tabs
        className={styles["login-method-tab"]}
        activeKey={loginMethod}
        items={[
          { key: "account", label: t("placeholder.account") },
          { key: "phone", label: t("placeholder.phoneNumber") },
          { key: "email", label: t("placeholder.email") },
        ]}
        onChange={onLoginMethodChange}
      />
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        labelCol={{ prefixCls: "custom-form-item" }}
        initialValues={{
          account: getAccount() ?? "",
          areaCode: "+86",
          phoneNumber: getPhoneNumber() ?? "",
          email: getEmail() ?? "",
        }}
      >
        {loginMethod === "account" && (
          <Form.Item className="mb-6" name="account" label={t("placeholder.account")}>
            <Input allowClear placeholder={t("toast.inputCorrectAccount")} />
          </Form.Item>
        )}
        {loginMethod === "phone" && (
          <Form.Item label={t("placeholder.phoneNumber")}>
            <Space.Compact className="w-full">
              <Form.Item name="areaCode" noStyle>
                <Select options={areaCode} className="!w-28" />
              </Form.Item>
              <Form.Item name="phoneNumber" noStyle>
                <Input allowClear placeholder={t("toast.inputPhoneNumber")} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        )}
        {loginMethod === "email" && (
          <Form.Item
            label={t("placeholder.email")}
            name="email"
            rules={[{ type: "email", message: t("toast.inputCorrectEmail") }]}
          >
            <Input allowClear placeholder={t("toast.inputEmail")} />
          </Form.Item>
        )}

        {loginType === LoginType.VerifyCode ? (
          <Form.Item label={t("placeholder.verifyCode")} name="verifyCode">
            <Space.Compact className="w-full">
              <Input
                allowClear
                placeholder={t("toast.inputVerifyCode")}
                className="w-full"
              />
              <Button type="primary" onClick={sendSmsHandle} loading={countdown > 0}>
                {countdown > 0
                  ? t("date.second", { num: countdown })
                  : t("placeholder.sendVerifyCode")}
              </Button>
            </Space.Compact>
          </Form.Item>
        ) : (
          <Form.Item label={t("placeholder.password")} name="password">
            <Input.Password allowClear placeholder={t("toast.inputPassword")} />
          </Form.Item>
        )}

        {loginMethod !== "account" && (
          <div className="mb-2 flex flex-row justify-between">
            <span
              className="cursor-pointer text-sm text-gray-400"
              onClick={() => setFormType(1)}
            >
              {t("placeholder.forgetPassword")}
            </span>
            <span
              className="cursor-pointer text-sm text-[var(--primary)]"
              onClick={() =>
                setLoginType(
                  loginType === LoginType.Password
                    ? LoginType.VerifyCode
                    : LoginType.Password,
                )
              }
            >
              {`${
                loginType === LoginType.Password
                  ? t("placeholder.verifyCode")
                  : t("placeholder.password")
              }${t("placeholder.login")}`}
            </span>
          </div>
        )}

        <div className="mb-2 flex justify-end space-x-3">
          {/* <Button icon={<GoogleOutlined />} onClick={handleGoogleLogin}></Button> */}
          {/* <Button icon={<GithubOutlined />} onClick={handleGithubLogin}></Button> */}
        </div>

        <Form.Item className="mb-4">
          <Button type="primary" htmlType="submit" block loading={loginLoading}>
            {t("placeholder.login")}
          </Button>
        </Form.Item>

        <div className="flex flex-row items-center justify-center">
          <span className="text-sm text-gray-400">
            {t("placeholder.registerToast")}
          </span>
          <span
            className="cursor-pointer text-sm text-blue-500"
            onClick={() => setFormType(2)}
          >
            {t("placeholder.toRegister")}
          </span>
        </div>
      </Form>
    </>
  );
};

export default LoginForm;
