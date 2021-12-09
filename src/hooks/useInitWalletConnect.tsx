import { useEffect, useState } from 'react';
import { WalletConnectProvider } from '@elrondnetwork/erdjs';
import { useDispatch, useSelector } from 'react-redux';

import { loginAction, logoutAction } from '../redux/commonActions';
import {
  providerSelector,
  proxySelector,
  walletConnectBridgeSelector
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
    window.location.href = logoutRoute;
  };

  const walletConnectInit = () => {
    if (!walletConnectBridge) {
      return;
    }

    const providerHandlers = {
      onClientLogin: handleOnLogin,
      onClientLogout: handleOnLogout
    };

    provider = new WalletConnectProvider(
      proxy,
      walletConnectBridge,
      providerHandlers
    );
    provider.init();

    dispatch(setProvider(provider));
    setWalletConnect(provider);
  };

  useEffect(() => {
    walletConnectInit();
  }, [walletConnectBridge]);

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
