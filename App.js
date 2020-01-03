import { AppLoading, AuthSession } from "expo";
import React, { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";

import HomeScreen from "./screens/HomeScreen";
import {
  DefaultTheme,
  Provider as PaperProvider,
  Button,
  ActivityIndicator
} from "react-native-paper";

import AuthContext from "./components/context/AuthContext";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#0F609B",
    accent: "#F7C948"
  }
};

const auth0ClientId = "d53lmRWeLZfc0czXQIeGmSZt0Sk3vtwC";
const auth0Domain = "https://partusch-cms.auth0.com";

const toQueryString = params => {
  return (
    "?" +
    Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&")
  );
};

const login = async setLoadingUserData => {
  const redirectUrl = AuthSession.getRedirectUrl();

  const queryParams = toQueryString({
    client_id: auth0ClientId,
    redirect_uri: redirectUrl,
    response_type: "id_token",
    scope: "openid profile name",
    nonce: "nonce"
  });
  const authUrl = `${auth0Domain}/authorize` + queryParams;

  const response = await AuthSession.startAsync({ authUrl });

  if (response.type === "success") {
    if (response.params.error) {
      Alert(
        "Authentication error",
        response.params.error_description || "something went wrong"
      );
      return;
    }

    return response.params.id_token;
  } else {
    setLoadingUserData(false);
  }
};

export default function App(props) {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [jwt, setJwt] = useState();
  const [tokens, setTokens] = useState();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(false);

  const onLoginPress = async () => {
    setLoadingUserData(true);
    setTimeout(async () => {
      const jwt = await login(setLoadingUserData);
      setJwt(jwt);
    }, 250);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      onLoginPress();
    }
  }, []);

  useEffect(() => {
    const fetchContentfulTokens = async () => {
      const authResponse = await fetch(
        "https://hhhk8apnud.execute-api.us-east-1.amazonaws.com/dev/user/auth",
        {
          headers: {
            Authorization: `Bearer ${jwt}`
          }
        }
      );
      const auth = await authResponse.json();
      setTokens(auth);
      setIsAuthenticated(true);
      setLoadingUserData(false);
    };
    if (jwt) {
      fetchContentfulTokens();
    }
  }, [jwt]);

  if (!isLoadingComplete && !props.skipLoadingScreen) {
    return (
      <AppLoading
        startAsync={loadResourcesAsync}
        onError={handleLoadingError}
        onFinish={() => handleFinishLoading(setLoadingComplete)}
      />
    );
  } else if (loadingUserData) {
    return (
      <PaperProvider theme={theme}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <ActivityIndicator size="large" />
        </View>
      </PaperProvider>
    );
  } else if (!isAuthenticated) {
    return (
      <PaperProvider theme={theme}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <View>
            <Button mode="contained" onPress={onLoginPress}>
              Login
            </Button>
          </View>
        </View>
      </PaperProvider>
    );
  } else {
    return (
      <View style={styles.container}>
        <PaperProvider theme={theme}>
          <AuthContext.Provider value={tokens}>
            <HomeScreen />
          </AuthContext.Provider>
        </PaperProvider>
      </View>
    );
  }
}

async function loadResourcesAsync() {}

function handleLoadingError(error) {
  // In this case, you might want to report the error to your error reporting
  // service, for example Sentry
  console.warn(error);
}

function handleFinishLoading(setLoadingComplete) {
  setLoadingComplete(true);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  }
});
