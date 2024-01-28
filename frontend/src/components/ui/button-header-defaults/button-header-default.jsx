import React from "react";
import styles from "./button-header-default.module.css";
import { NavLink } from "react-router-dom";

export const ButtonHeaderDefault = ({
  type = "button",
  text,
  to='/',
  extraClass = "",
  ...rest
}) => {
  return (
    <NavLink to={to} className={`${styles.buttonheader} ${extraClass}`} type={type} {...rest}>
      <p className={`text text_type_large text_color_white ${styles.text}`}>
        {text}
      </p>
    </NavLink>
  );
};

export const ButtonHeaderDefaultProfile = ({
  type = "buttonheaderprof",
  text,
  to='/me',
  extraClass = "",
  ...rest
}) => {
  return (
    <NavLink to={to} button className={`${styles.buttonheaderprof} ${extraClass}`} type={type} {...rest}>
      <p className={`text text_type_large text_color_white ${styles.text}`}>
        {text}
      </p>
    </NavLink>
  );
};
