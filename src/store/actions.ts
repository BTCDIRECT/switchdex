import { BigNumber, MetamaskSubprovider, signatureUtils, SignedOrder } from '0x.js';
import { createAction } from 'typesafe-actions';

import {
    MAINNET_ID,
    METAMASK_NOT_INSTALLED,
    METAMASK_USER_DENIED_AUTH,
    TX_DEFAULTS,
    WETH_TOKEN_SYMBOL,
} from '../common/constants';
import { getContractWrappers } from '../services/contract_wrappers';
import { cancelSignedOrder, getAllOrdersAsUIOrders, getUserOrdersAsUIOrders } from '../services/orders';
import { getRelayer } from '../services/relayer';
import { getTokenBalance, tokenToTokenBalance } from '../services/tokens';
import { getWeb3WrapperOrThrow, reconnectWallet } from '../services/web3_wrapper';
import { getKnownTokens } from '../util/known_tokens';
import { buildLimitOrder, buildMarketOrders } from '../util/orders';
import {
    BlockchainState,
    Notification,
    NotificationKind,
    OrderSide,
    RelayerState,
    Step,
    StepKind,
    Token,
    TokenBalance,
    UIOrder,
    Web3State,
} from '../util/types';

import {
    getEthAccount,
    getOpenBuyOrders,
    getOpenSellOrders,
    getSelectedToken,
    getTokenBalances,
    getWethBalance,
    getWethTokenBalance,
} from './selectors';

export const initializeBlockchainData = createAction('INITIALIZE_BLOCKCHAIN_DATA', resolve => {
    return (blockchainData: BlockchainState) => resolve(blockchainData);
});

export const initializeRelayerData = createAction('INITIALIZE_RELAYER_DATA', resolve => {
    return (relayerData: RelayerState) => resolve(relayerData);
});

export const setEthAccount = createAction('SET_ETH_ACCOUNT', resolve => {
    return (ethAccount: string) => resolve(ethAccount);
});

export const setWeb3State = createAction('SET_WEB3_STATE', resolve => {
    return (web3State: Web3State) => resolve(web3State);
});

export const setTokenBalances = createAction('SET_TOKEN_BALANCES', resolve => {
    return (tokenBalances: TokenBalance[]) => resolve(tokenBalances);
});

export const setEthBalance = createAction('SET_ETH_BALANCE', resolve => {
    return (ethBalance: BigNumber) => resolve(ethBalance);
});

export const setWethBalance = createAction('SET_WETH_BALANCE', resolve => {
    return (wethBalance: BigNumber) => resolve(wethBalance);
});

export const setWethTokenBalance = createAction('SET_WETH_TOKEN_BALANCE', resolve => {
    return (wethTokenBalance: TokenBalance | null) => resolve(wethTokenBalance);
});

export const setOrders = createAction('SET_ORDERS', resolve => {
    return (orders: UIOrder[]) => resolve(orders);
});

export const setUserOrders = createAction('SET_USER_ORDERS', resolve => {
    return (orders: UIOrder[]) => resolve(orders);
});

export const setSelectedToken = createAction('SET_SELECTED_TOKEN', resolve => {
    return (selectedToken: Token | null) => resolve(selectedToken);
});

export const setHasUnreadNotifications = createAction('SET_HAS_UNREAD_NOTIFICATIONS', resolve => {
    return (hasUnreadNotifications: boolean) => resolve(hasUnreadNotifications);
});

export const addNotification = createAction('ADD_NOTIFICATION', resolve => {
    return (newNotification: Notification) => resolve(newNotification);
});

export const setStepsModalPendingSteps = createAction('SET_STEPSMODAL_PENDING_STEPS', resolve => {
    return (pendingSteps: Step[]) => resolve(pendingSteps);
});

export const setStepsModalDoneSteps = createAction('SET_STEPSMODAL_DONE_STEPS', resolve => {
    return (doneSteps: Step[]) => resolve(doneSteps);
});

export const setStepsModalCurrentStep = createAction('SET_STEPSMODAL_CURRENT_STEP', resolve => {
    return (currentStep: Step | null) => resolve(currentStep);
});

export const stepsModalAdvanceStep = createAction('STEPSMODAL_ADVANCE_STEP');

export const stepsModalReset = createAction('STEPSMODAL_RESET');

export const toggleTokenLock = ({ token, isUnlocked }: TokenBalance) => {
    return async (dispatch: any, getState: any) => {
        const state = getState();
        const ethAccount = getEthAccount(state);

        const contractWrappers = await getContractWrappers();

        if (isUnlocked) {
            await contractWrappers.erc20Token.setProxyAllowanceAsync(
                token.address,
                ethAccount,
                new BigNumber('0'),
                TX_DEFAULTS,
            );
        } else {
            await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(token.address, ethAccount);
        }

        const isWeth = token.symbol === WETH_TOKEN_SYMBOL;
        if (isWeth) {
            const wethTokenBalance = getWethTokenBalance(state) as TokenBalance;
            dispatch(
                setWethTokenBalance({
                    ...wethTokenBalance,
                    isUnlocked: !isUnlocked,
                }),
            );
        } else {
            const tokenBalances = getTokenBalances(state);
            const updatedTokenBalances = tokenBalances.map(tokenBalance => {
                if (tokenBalance.token.address !== token.address) {
                    return tokenBalance;
                }

                return {
                    ...tokenBalance,
                    isUnlocked: !isUnlocked,
                };
            });

            dispatch(setTokenBalances(updatedTokenBalances));
        }
    };
};

export const updateWethBalance = (newWethBalance: BigNumber) => {
    return async (dispatch: any, getState: any) => {
        const state = getState();
        const ethAccount = getEthAccount(state);
        const wethTokenBalance = getWethTokenBalance(state);
        const wethBalance = getWethBalance(state);

        const web3Wrapper = await getWeb3WrapperOrThrow();
        const networkId = await web3Wrapper.getNetworkIdAsync();
        const wethAddress = getKnownTokens(networkId).getWethToken().address;

        const contractWrappers = await getContractWrappers();

        let tx: string;
        if (wethBalance.lessThan(newWethBalance)) {
            tx = await contractWrappers.etherToken.depositAsync(
                wethAddress,
                newWethBalance.sub(wethBalance),
                ethAccount,
            );
        } else if (wethBalance.greaterThan(newWethBalance)) {
            tx = await contractWrappers.etherToken.withdrawAsync(
                wethAddress,
                wethBalance.sub(newWethBalance),
                ethAccount,
                TX_DEFAULTS,
            );
        } else {
            return;
        }

        await web3Wrapper.awaitTransactionSuccessAsync(tx);
        const ethBalance = await web3Wrapper.getBalanceInWeiAsync(ethAccount);
        dispatch(setEthBalance(ethBalance));

        const newWethTokenBalance = wethTokenBalance
            ? {
                  ...wethTokenBalance,
                  balance: newWethBalance,
              }
            : null;

        dispatch(setWethTokenBalance(newWethTokenBalance));
    };
};

export const connectWallet = () => {
    return async (dispatch: any) => {
        await reconnectWallet();
        dispatch(initWallet());
    };
};

export const initWallet = () => {
    return async (dispatch: any) => {
        dispatch(setWeb3State(Web3State.Loading));
        try {
            const web3Wrapper = await getWeb3WrapperOrThrow();
            if (web3Wrapper) {
                const [ethAccount] = await web3Wrapper.getAvailableAddressesAsync();
                const networkId = await web3Wrapper.getNetworkIdAsync();

                const knownTokens = getKnownTokens(networkId);

                const tokenBalances = await Promise.all(
                    knownTokens.getTokens().map(token => tokenToTokenBalance(token, ethAccount)),
                );

                const wethToken = knownTokens.getWethToken();
                const wethTokenBalance = await tokenToTokenBalance(wethToken, ethAccount);

                const ethBalance = await web3Wrapper.getBalanceInWeiAsync(ethAccount);

                const selectedToken = knownTokens.getTokenBySymbol('ZRX');

                dispatch(
                    initializeBlockchainData({
                        web3State: Web3State.Done,
                        ethAccount,
                        ethBalance,
                        wethTokenBalance,
                        tokenBalances,
                    }),
                );
                dispatch(
                    initializeRelayerData({
                        orders: [],
                        userOrders: [],
                        selectedToken,
                    }),
                );
                dispatch(getOrderbookAndUserOrders());
            }
        } catch (error) {
            const knownTokens = getKnownTokens(MAINNET_ID);
            const selectedToken = knownTokens.getTokenBySymbol('ZRX');
            switch (error.message) {
                case METAMASK_USER_DENIED_AUTH: {
                    dispatch(setWeb3State(Web3State.Locked));
                    dispatch(
                        initializeRelayerData({
                            orders: [],
                            userOrders: [],
                            selectedToken,
                        }),
                    );
                    dispatch(getOrderBook());
                    break;
                }
                case METAMASK_NOT_INSTALLED: {
                    dispatch(setWeb3State(Web3State.NotInstalled));
                    dispatch(
                        initializeRelayerData({
                            orders: [],
                            userOrders: [],
                            selectedToken,
                        }),
                    );
                    dispatch(getOrderBook());
                    break;
                }
                default: {
                    dispatch(setWeb3State(Web3State.Error));
                    break;
                }
            }
        }
    };
};

export const updateStore = () => {
    return async (dispatch: any) => {
        try {
            const web3Wrapper = await getWeb3WrapperOrThrow();

            const [ethAccount] = await web3Wrapper.getAvailableAddressesAsync();
            const networkId = await web3Wrapper.getNetworkIdAsync();

            const knownTokens = getKnownTokens(networkId);

            const tokenBalances = await Promise.all(
                knownTokens.getTokens().map(token => tokenToTokenBalance(token, ethAccount)),
            );
            const wethToken = knownTokens.getWethToken();
            const ethBalance = await web3Wrapper.getBalanceInWeiAsync(ethAccount);
            const wethBalance = await getTokenBalance(wethToken, ethAccount);

            dispatch(getOrderbookAndUserOrders());
            dispatch(setTokenBalances(tokenBalances));
            dispatch(setEthBalance(ethBalance));
            dispatch(setWethBalance(wethBalance));
        } catch (error) {
            const knownTokens = getKnownTokens(MAINNET_ID);
            const selectedToken = knownTokens.getTokenBySymbol('ZRX');
            dispatch(setSelectedToken(selectedToken));
            dispatch(getOrderBook());
        }
    };
};

export const getAllOrders = () => {
    return async (dispatch: any, getState: any) => {
        const state = getState();
        const selectedToken = getSelectedToken(state) as Token;
        const uiOrders = await getAllOrdersAsUIOrders(selectedToken);
        dispatch(setOrders(uiOrders));
    };
};

export const getUserOrders = () => {
    return async (dispatch: any, getState: any) => {
        const state = getState();
        const selectedToken = getSelectedToken(state) as Token;
        const ethAccount = getEthAccount(state);
        const myUIOrders = await getUserOrdersAsUIOrders(selectedToken, ethAccount);

        dispatch(setUserOrders(myUIOrders));
    };
};

export const cancelOrder = (order: UIOrder) => {
    return async (dispatch: any, getState: any) => {
        const state = getState();
        const selectedToken = getSelectedToken(state) as Token;

        await cancelSignedOrder(order.rawOrder);

        dispatch(getOrderbookAndUserOrders());
        dispatch(
            addNotification({
                kind: NotificationKind.CancelOrder,
                amount: order.size,
                token: selectedToken,
                timestamp: new Date(),
            }),
        );
    };
};

export const startBuySellLimitSteps = (amount: BigNumber, price: BigNumber, side: OrderSide) => {
    return async (dispatch: any) => {
        const step: Step = {
            kind: StepKind.BuySellLimit,
            amount,
            price,
            side,
        };
        const pendingSteps: Step[] = [];
        dispatch(setStepsModalPendingSteps(pendingSteps));
        dispatch(setStepsModalCurrentStep(step));
        dispatch(setStepsModalDoneSteps([]));
    };
};

export const createSignedOrder = (amount: BigNumber, price: BigNumber, side: OrderSide) => {
    return async (dispatch: any, getState: any) => {
        const state = getState();
        const ethAccount = getEthAccount(state);
        const selectedToken = getSelectedToken(state) as Token;

        const web3Wrapper = await getWeb3WrapperOrThrow();
        const networkId = await web3Wrapper.getNetworkIdAsync();
        const contractWrappers = await getContractWrappers();
        const wethAddress = getKnownTokens(networkId).getWethToken().address;

        const order = buildLimitOrder(
            {
                account: ethAccount,
                amount,
                price,
                tokenAddress: selectedToken.address,
                wethAddress,
                exchangeAddress: contractWrappers.exchange.address,
            },
            side,
        );

        const provider = new MetamaskSubprovider(web3Wrapper.getProvider());
        return signatureUtils.ecSignOrderAsync(provider, order, ethAccount);
    };
};

export const submitLimitOrder = (signedOrder: SignedOrder, amount: BigNumber, side: OrderSide) => {
    return async (dispatch: any, getState: any) => {
        const state = getState();
        const selectedToken = getSelectedToken(state) as Token;

        const submitResult = await getRelayer().client.submitOrderAsync(signedOrder);

        dispatch(getOrderbookAndUserOrders());
        dispatch(
            addNotification({
                kind: NotificationKind.Limit,
                amount,
                token: selectedToken,
                side,
                timestamp: new Date(),
            }),
        );

        return submitResult;
    };
};

export const submitMarketOrder = (amount: BigNumber, side: OrderSide) => {
    return async (dispatch: any, getState: any) => {
        const state = getState();
        const ethAccount = getEthAccount(state);
        const selectedToken = getSelectedToken(state) as Token;

        const contractWrappers = await getContractWrappers();
        const web3Wrapper = await getWeb3WrapperOrThrow();

        const orders = side === OrderSide.Buy ? getOpenSellOrders(state) : getOpenBuyOrders(state);

        const [ordersToFill, amounts, canBeFilled] = buildMarketOrders(
            {
                amount,
                orders,
            },
            side,
        );

        if (canBeFilled) {
            const txHash = await contractWrappers.exchange.batchFillOrdersAsync(
                ordersToFill,
                amounts,
                ethAccount,
                TX_DEFAULTS,
            );
            dispatch(getOrderbookAndUserOrders());

            const tx = web3Wrapper.awaitTransactionSuccessAsync(txHash);

            dispatch(
                addNotification({
                    kind: NotificationKind.Market,
                    amount,
                    token: selectedToken,
                    side,
                    tx,
                    timestamp: new Date(),
                }),
            );
        } else {
            window.alert('There are no enough orders to fill this amount');
        }
    };
};

export const getOrderbookAndUserOrders = () => {
    return async (dispatch: any) => {
        dispatch(getAllOrders());
        dispatch(getUserOrders());
    };
};

export const getOrderBook = () => {
    return async (dispatch: any) => {
        dispatch(getAllOrders());
    };
};
