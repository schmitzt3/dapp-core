import { useEffect, useRef, useState } from 'react';
import { Address, Nonce, Transaction, ExtensionProvider } from '@elrondnetwork/erdjs';

import { walletSignSession } from 'constants/index';
import { useDispatch, useSelector } from 'redux/DappProviderContext';
import { LoginMethodsEnum, TransactionBatchStatusesEnum } from 'types/enums';
import { useParseSignedTransactions } from 'hooks/transactions/useParseSignedTransactions';
import { getLatestNonce, getProviderType, buildReplyUrl, parseTransactionAfterSigning } from 'utils';
import { addressSelector, providerSelector, proxySelector, transactionsToSignSelector } from 'redux/selectors';
import { clearAllTransactionsToSign, clearTransactionsInfoForSessionId, moveTransactionsToSignedState } from 'redux/slices';

export const useSignTransactions = () => {

  const dispatch = useDispatch();
  const savedCallback = useRef('/');
  const proxy = useSelector(proxySelector);
  const address = useSelector(addressSelector);
  const provider = useSelector(providerSelector);
  const providerType = getProviderType(provider);
  const [error, setError] = useState<string | null>(null);
  const transactionsToSign = useSelector(transactionsToSignSelector);
  const hasTransactions = Boolean(transactionsToSign?.transactions);

  const onAbort = (sessionId?: string) => {

    setError(null);
    clearSignInfo(sessionId);

  };

  const clearSignInfo = (sessionId?: string) => {
      
    const isExtensionProvider = provider instanceof ExtensionProvider;

    dispatch(clearAllTransactionsToSign());
    dispatch(clearTransactionsInfoForSessionId(sessionId));

    if (!isExtensionProvider) {
      return;
    }

    ExtensionProvider.getInstance()?.cancelAction?.();
  
  };

  const onCancel = (errorMessage: string, sessionId?: string) => {

    const isTxCancelled = errorMessage !== 'Transaction cancelled';
    
    clearSignInfo(sessionId);

    /*
    * this is triggered by abort action, 
    * so no need to show error again
    */
    if (!isTxCancelled) {
      return;
    }
    
    setError(errorMessage);

  };

  const signTransactionsWithProvider = async ( transactions: Array<Transaction> ) => {
      
    const { sessionId, callbackRoute, customTransactionInformation } = transactionsToSign!;
    const { redirectAfterSign } = customTransactionInformation;
    const redirectRoute = callbackRoute || window.location.pathname;
    const isCurrentRoute = window.location.pathname.includes(redirectRoute);
    const shouldRedirectAfterSign = redirectAfterSign && !isCurrentRoute;

    try {

      const isProviderInitialized = await provider.init();

      if (!isProviderInitialized) {
        return;
      }

    } catch (error) {

      const customErrorMessage = 'provider not intialized';
      const errorMessage = (error as unknown as Error)?.message || (error as string) || customErrorMessage;
      console.error(customErrorMessage, errorMessage);
      onCancel(errorMessage);

    };

    try {

      const signedTransactions = await provider.signTransactions(transactions);
      const hasSameTransactions = Object.keys(signedTransactions).length === transactions.length;
      const hasAllTransactionsSigned = signedTransactions && hasSameTransactions;
      const shouldMoveTransactionsToSignedState = signedTransactions && hasAllTransactionsSigned;

      if (!shouldMoveTransactionsToSignedState) {
        return;
      }

      const signedTransactionsArray = Object.values(signedTransactions).map((tx) => parseTransactionAfterSigning(tx) );

      dispatch(
        moveTransactionsToSignedState({
          sessionId,
          transactions: signedTransactionsArray,
          status: TransactionBatchStatusesEnum.signed
        })
      );

      if (shouldRedirectAfterSign) {
        window.location.href = redirectRoute;
      }

    } catch (err) {

      const customErrorMessage = 'error signing transaction';
      const errorMessage = (error as unknown as Error)?.message || (error as string) || customErrorMessage;
      console.error(customErrorMessage, errorMessage);
      onCancel(errorMessage, sessionId);
    
    };
    
  };

  const signTransactions = async () => {

    const hasSessionId = Boolean(transactionsToSign?.sessionId);
    const hasTransactions = Boolean(transactionsToSign?.transactions?.length);
    const isSignEligible = transactionsToSign && hasSessionId && hasTransactions;
    //move to errors constants
    const missingProviderErrorMessage = 'You need a signer/valid signer to send a transaction,use either WalletProvider, LedgerProvider or WalletConnect';

    if (!isSignEligible) {
      return;
    }

    if (!provider) {
      console.error(missingProviderErrorMessage);
      return;
    }

    const { sessionId, transactions, callbackRoute } = transactionsToSign!;

    /*
    * if the transaction is cancelled 
    * the callback will go to undefined,
    * we save the most recent one for a valid transaction
    */
    savedCallback.current = callbackRoute || window.location.pathname;

    const signWithWallet = ( transactions: Array<Transaction> ) => {

      const urlParams = { [walletSignSession]: sessionId };
      const callbackUrl = `${window.location.origin}${callbackRoute}`;
      const buildedCallbackUrl = buildReplyUrl({ callbackUrl, urlParams });

      provider.signTransactions(transactions, {
        callbackUrl: encodeURIComponent(buildedCallbackUrl)
      });
      
    };

    const signWithProviderHandler = {

      [LoginMethodsEnum.wallet]: signWithWallet,
      [LoginMethodsEnum.extension]: signTransactionsWithProvider,
      [LoginMethodsEnum.walletconnect]: signTransactionsWithProvider,

    };

    const mapTransactionsNonces = ( latestNonce: number, transactions: Array<Transaction> ) => {

      return transactions.map((tx: Transaction, index: number) => tx.setNonce(new Nonce(latestNonce + index)));

    };

    try {
        
      const proxyAccount = await proxy.getAccount(new Address(address));
      const latestNonce = getLatestNonce(proxyAccount);
      const mappedTransactions = mapTransactionsNonces(
        latestNonce,
        transactions
      );

      signWithProviderHandler[providerType]?.(mappedTransactions);
    
    } catch (err) {  
    
      const customErrorMessage = 'error when signing';
      const defaultErrorMessage = (error as unknown as Error)?.message;
      const errorMessage = customErrorMessage || defaultErrorMessage;
      onCancel(errorMessage, sessionId);

      dispatch(
        moveTransactionsToSignedState({
          sessionId,
          status: TransactionBatchStatusesEnum.cancelled
        })
      );

      console.error(errorMessage, err);

    }
  };

  useEffect(() => {

    useParseSignedTransactions();

  });

  useEffect(() => {

    signTransactions();

  }, [transactionsToSign]);

  return {

    error,
    onAbort,
    hasTransactions,
    callbackRoute: savedCallback.current,
    sessionId: transactionsToSign?.sessionId,
    transactions: transactionsToSign?.transactions,

  };

}

export default useSignTransactions;
