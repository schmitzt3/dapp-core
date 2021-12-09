import React from 'react';
import platform from 'platform';
import classNames from 'classnames';
import { LoginModalPropsType } from './types';
import { ReactComponent as Lightning } from './lightning.svg';
import { useWalletConnectLogin } from '../../../services/login/index';

export const WalletConnectLoginModal = ({
  className,
  logoutRoute = '',
  callbackRoute = '',
  title = 'Maiar Login',
  shouldRenderDefaultCss = true,
  lead = 'Scan the QR code using Maiar',
  ctaLoginText = 'Scan the QR code using Maiar or click the button below to open the App'
}: LoginModalPropsType) => {
  const isIosDevice: boolean = platform?.os?.family === 'iOS';
  const isAndroidDevice: boolean = platform?.os?.family === 'Android';
  const isMobileDevice: boolean = isIosDevice || isAndroidDevice;

  const {
    error,
    qrCodeSvg,
    uri: loginUri,
    loading: isQrCodeSvgLoading
  } = useWalletConnectLogin({
    logoutRoute: logoutRoute,
    callbackRoute: callbackRoute
  });

  const hasLeadingClassName: boolean = Boolean(className);

  const generatedClasses = {
    root: classNames({
      [`${className}`]: hasLeadingClassName,
      'm-auto login-container': shouldRenderDefaultCss
    }),
    card: classNames({
      [`${className}_card`]: hasLeadingClassName,
      'card my-3 text-center': shouldRenderDefaultCss
    }),
    cardBody: classNames({
      [`${className}_cardBody`]: hasLeadingClassName,
      'card my-3 text-center': shouldRenderDefaultCss
    }),
    qrCodeSvgContainer: classNames({
      [`${className}_qrCodeSvg-container`]: hasLeadingClassName,
      'mx-auto mb-3': shouldRenderDefaultCss
    }),
    title: classNames({
      [`${className}_title`]: hasLeadingClassName,
      'mb-3': shouldRenderDefaultCss
    }),
    leadText: classNames({
      [`${className}_lead-text`]: hasLeadingClassName,
      'lead mb-0': shouldRenderDefaultCss
    }),
    mobileLoginButton: classNames({
      [`${className}_mobile-login-button`]: hasLeadingClassName,
      'btn btn-primary px-4 mt-4': shouldRenderDefaultCss
    }),
    errorMessage: classNames({
      [`${className}_error-message`]: hasLeadingClassName,
      'text-danger d-flex justify-content-center align-items-center': shouldRenderDefaultCss
    }),
    lightingIcon: classNames({
      [`${className}_lighting-icon`]: hasLeadingClassName,
      'mr-2': shouldRenderDefaultCss
    })
  };

  if (isQrCodeSvgLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className={generatedClasses.root}>
      <div className={generatedClasses.card}>
        <div className={generatedClasses.cardBody}>
          <div
            className={generatedClasses.qrCodeSvgContainer}
            dangerouslySetInnerHTML={{
              __html: qrCodeSvg
            }}
            style={{
              width: '15rem',
              height: '15rem'
            }}
          />
          <h4 className={generatedClasses.title}>{title}</h4>
          {isMobileDevice ? (
            <React.Fragment>
              <p className={generatedClasses.leadText}>{ctaLoginText}</p>
              <a
                id='accessWalletBtn'
                data-testid='accessWalletBtn'
                className={generatedClasses.mobileLoginButton}
                href={loginUri || undefined}
                rel='noopener noreferrer nofollow'
                target='_blank'
              >
                <Lightning
                  className={generatedClasses.cardBody}
                  style={{
                    width: '0.7rem',
                    height: '0.7rem'
                  }}
                />
                {title}
              </a>
            </React.Fragment>
          ) : (
            <p className={generatedClasses.leadText}>{lead}</p>
          )}
          <div>
            {error && <p className={generatedClasses.errorMessage}>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectLoginModal;
