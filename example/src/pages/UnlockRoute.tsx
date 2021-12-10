import React from 'react';
import { DappUI, loginServices } from 'dapp-core';

const {
  ExtensionLoginButton,
  WebWalletLoginButton,
  WalletConnectLoginModal
} = DappUI;

export const UnlockRoute: () => JSX.Element = () => {
    
  return (
    <div className='home d-flex flex-fill align-items-center'>
      <div className='m-auto' data-testid='unlockPage'>
        <div className='card my-4 text-center'>
          <div className='card-body py-4 px-2 px-sm-2 mx-lg-4'>
            <h4 className='mb-4'>Login</h4>
            <p className='mb-4'>pick a login method</p>

            <ExtensionLoginButton
              callbackRoute={'/home'}
              loginButtonText={'Extension'}
            />
            <WebWalletLoginButton
              callbackRoute={'/home'}
              loginButtonText={'Web wallet'}
            />

            <WalletConnectLoginModal callbackRoute="/home" logoutRoute="/unlock"  />
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockRoute;
