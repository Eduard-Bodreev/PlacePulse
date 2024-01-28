import React from "react";
import { useLocation, NavLink } from "react-router-dom";

import { UserContext } from "../../utils/context";
import { logoutUser } from "../../utils/api";

import logoutIcon from "../../images/logout.svg";
import logo from "../../images/logo.svg";

import { ButtonSecondary } from "../ui/button-secondary/button-secondary";
import { ButtonHeaderDefault, ButtonHeaderDefaultProfile } from "../ui/button-header-defaults/button-header-default";

import styles from "./header.module.css";

export const Header = ({ setQueryPage, extraClass = "" }) => {
  const [user, setUser] = React.useContext(UserContext);

  const location = useLocation();

  const handleLogout = () => {
    logoutUser().then(() => {
      setUser({ id: "" });
      setQueryPage(1);
    });
  };

  const headerClassList = `${styles.header} ${
    (location.pathname === "/signin" || location.pathname === "/signup") &&
    styles.hidden
  } ${extraClass}`;

  return (
    <header className={headerClassList}>
      <NavLink className={styles.logoLink} to="/" onClick={() => setQueryPage(1)}>
        <img className={styles.logo} src={logo} alt="Логотип." />
      </NavLink>
      <div className={styles.btns_mid}>
        <ButtonHeaderDefault text="Главная" onClick={() => setQueryPage(1)} />
        {user.id && <ButtonHeaderDefaultProfile text="Профиль" />}
      </div>
      <div className={styles.logoutContainer}>
        {!user.id ? (
          <ButtonSecondary text="Войти" />
        ) : (
          <ButtonSecondary icon={logoutIcon} text="Выйти" onClick={handleLogout} />
        )}
      </div>
    </header>
  );
};
