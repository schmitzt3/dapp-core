import { useEffect, useState } from 'react';
import { WalletConnectProvider } from '@elrondnetwork/erdjs';
import { useDispatch, useSelector } from 'react-redux';

import { loginAction, logoutAction } from '../redux/commonActions';
import {
  providerSelector,
  proxySelector,
  walletConnectBridgeSelector,
  isLoggedInSelector
} from '../redux/selectors';
import {
  setProvider,
  setTokenLoginSignature,
  setWalletConnectLogin
} from '../redux/slices';

import { LoginMethodsEnum } from '../types';
interface InitWalletConnectType {
  callbackRoute: string;
  logoutRoute: string;
}

export const useInitWalletConnect = ({
  callbackRoute,
  logoutRoute
}: InitWalletConnectType) => {
  const dispatch = useDispatch();
  const heartbeatInterval = 15000;

  const [error, setError] = useState<string>('');
  const [walletConnect, setWalletConnect] = useState<WalletConnectProvider>();

  const proxy = useSelector(proxySelector);
  let provider: any = useSelector(providerSelector);
  const isLoggedIn = useSelector(isLoggedInSelector);
  const walletConnectBridge = useSelector(walletConnectBridgeSelector);

  const isProviderConnected = Boolean(provider?.walletConnector?.connected);

  const heartbeat = () => {
    if (!isProviderConnected) {
      return;
    }

    const customMessage = {
      method: 'heartbeat',
      params: {}
    };

    provider.sendCustomMessage(customMessage).catch((e: any) => {
      console.error('Connection lost', e);
      handleOnLogout();
    });
  };

  const handleOnLogin = async () => {
    if (!isLoggedIn) {
      window.location.href = callbackRoute;
    }

    try {
      const address = await provider.getAddress();
      const signature = await provider.getSignature();
      const hasSignature = Boolean(signature);

      const loginActionData = {
        address: address,
        loginMethod: LoginMethodsEnum.walletconnect
      };

      const loginData = {
        logoutRoute: logoutRoute,
        loginType: 'walletConnect',
        callbackRoute: callbackRoute
      };

      if (hasSignature) {
        dispatch(setTokenLoginSignature(signature));
      }

      dispatch(loginAction(loginActionData));
      dispatch(setWalletConnectLogin(loginData));
    } catch (err) {
      setError('Invalid address');
      console.log(err);
    }
  };

  const handleOnLogout = () => {
    dispatch(logoutAction());

    if (!isLoggedIn) {
      return;
    }

    window.location.href = logoutRoute;
  };

  const walletConnectInit = () => {
    const providerHandlers = {
      onClientLogin: handleOnLogin,
      onClientLogout: handleOnLogout
    };

    const newProvider = new WalletConnectProvider(
      proxy,
      walletConnectBridge,
      providerHandlers
    );

    dispatch(setProvider(provider));
    provider = newProvider;
    setWalletConnect(provider);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      heartbeat();
    }, heartbeatInterval);

    return () => clearInterval(interval);
  }, [provider]);

  useEffect(() => {
    return () => {
      if (!isProviderConnected) {
        return;
      }

      window.addEventListener('storage', (e) => {
        if (e.key === 'walletconnect') {
          handleOnLogout();
        }
      });
    };
  });

  return {
    error,
    walletConnect,
    walletConnectInit
  };
};

export default useInitWalletConnect;
