import React from "react";
import styles from "./button-secondary.module.css";

export const ButtonSecondary = ({
  type = "button",
  icon,
  text,
  extraClass = "",
  ...rest
}) => {
  return (
    <button className={`${styles.button} ${extraClass}`} type={type} {...rest}>
      <img
        className={styles.icon}
        src={icon}
        alt="Кнопка выхода из аккаунта."
      />
      <p className={`text text_type_large text_color_white pl-8 ${styles.text}`}>
        {text}
      </p>
    </button>
  );
};
