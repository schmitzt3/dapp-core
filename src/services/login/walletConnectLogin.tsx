import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { setTokenLogin } from '../../redux/slices';
import { useDispatch, useSelector } from 'react-redux';
import useInitWalletConnect from '../../hooks/useInitWalletConnect';
import { walletConnectDeepLinkSelector } from '../../redux/selectors';

export const useWalletConnectLogin = ({
  token,
  logoutRoute,
  callbackRoute
}: {
  token?: string;
  logoutRoute: string;
  callbackRoute: string;
}) => {
  const dispatch = useDispatch();

  const [wcUri, setWcUri] = useState<string>('');
  const [qrCodeSvg, setQrCodeSvg] = useState<string>('');

  const { error, walletConnectInit, walletConnect } = useInitWalletConnect({
    logoutRoute,
    callbackRoute
  });

  const walletConnectDeepLink: string = useSelector(
    walletConnectDeepLinkSelector
  );

  const hasWcUri: boolean = Boolean(wcUri);
  const isLoadind: boolean = !hasWcUri;

  const loginWithWalletConnect = async () => {
    const walletConnectUri: string | undefined = await walletConnect?.login();
    const hasUri: boolean = Boolean(walletConnectUri);

    if (!hasUri) {
      return;
    }

    if (!token) {
      setWcUri(walletConnectUri as string);
      return;
    }

    const wcUriWithToken = `${walletConnectUri}&token=${token}`;

    setWcUri(wcUriWithToken);
    dispatch(setTokenLogin(token));
  };

  const generateQRCode = async () => {
    if (!hasWcUri) {
      return;
    }

    const svg = await QRCode.toString(wcUri, {
      type: 'svg'
    });

    setQrCodeSvg(svg);
  };

  useEffect(() => {
    walletConnectInit();
  }, []);

  useEffect(() => {
    generateQRCode();
  }, [wcUri]);

  useEffect(() => {
    loginWithWalletConnect();
  }, [walletConnect, token]);

  const uriDeepLink: string = `${walletConnectDeepLink}?wallet-connect=${encodeURIComponent(
    wcUri
  )}`;

  const uri: string | null = hasWcUri ? uriDeepLink : null;

  console.log({
    uri: uri,
    error: error,
    loading: isLoadind,
    qrCodeSvg: qrCodeSvg
  });

  return {
    uri: uri,
    error: error,
    loading: isLoadind,
    qrCodeSvg: qrCodeSvg
  };
};

export default useWalletConnectLogin;
