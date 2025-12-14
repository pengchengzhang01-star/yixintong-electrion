import clsx from "clsx";
import { FC } from "react";

import MarkdownRenderer from "@/components/MarkdownRender/MarkdownRenderer";

import { IMessageItemProps } from ".";
import styles from "./message-item.module.scss";

const NomalMarkdownRender: FC<IMessageItemProps> = ({ message }) => {
  return (
    <div className={clsx(styles.bubble, "overflow-auto !p-4")}>
      <MarkdownRenderer markdown={message.markdownTextElem?.content ?? ""} />
    </div>
  );
};

export default NomalMarkdownRender;
