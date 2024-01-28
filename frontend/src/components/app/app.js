import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";

import { UserContext } from "../../utils/context";
import { getUser } from "../../utils/api";

import { ProtectedRoute } from "../ui/protected-roure/protected-route";

import { Header } from "../header/header";
import { Footer } from "../footer/footer";
import { SignUp } from "../sign-up/sign-up";
import { SignIn } from "../sign-in/sign-in";
import { MainPage } from "../main-page/main-page";
import { UserProfile } from "../user-profile/user-profile";
import styles from "./app.module.css";

function App() {
  const [userState, setUserState] = React.useState({});
  const [queryPage, setQueryPage] = React.useState(1);

  React.useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      getUser().then((res) => {
        if (res && res.user_id) {
          setUserState({ id: res.user_id });
        }
      });
    }
  }, []);

  return (
    <div className={styles.app}>
      <UserContext.Provider value={[userState, setUserState]}>
        <BrowserRouter>
          <Header setQueryPage={setQueryPage} />
          <main className={styles.content}>
            <Switch>
              <ProtectedRoute exact path="/">
                <MainPage queryPage={queryPage} setQueryPage={setQueryPage} />
              </ProtectedRoute>
              <Route path="/signin">
                <SignIn />
              </Route>
              <Route path="/signup">
                <SignUp />
              </Route>
              <ProtectedRoute path="/me">
                <UserProfile />
              </ProtectedRoute>
            </Switch>
          </main>
          <Footer />
        </BrowserRouter>
      </UserContext.Provider>
    </div>
  );
}

export default App;
