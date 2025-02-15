import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import config from '../config.json';

import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadExchange,
  loadAllOrders,
  subscribeToEvents
} from '../store/interactions';

// import components
import Navbar from './Navbar';
import Markets from './Markets';
import Balance from './Balance';
import Order from './Order';
import OrderBook from './OrderBook';
import Transactions from './Transactions';
import Trades from './Trades';
import PriceChart from './PriceChart';
import Alert from './Alert';

function App() {
  const dispatch = useDispatch();

  const loadBlockchainData = async () => {
    // Connect Ethers to blockchain
    const provider = loadProvider(dispatch);
    const chainId = await loadNetwork(provider, dispatch);

    // Reload page when network changes
    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    })

    // fetch account & balance from wallet
    window.ethereum.on('accountsChanged', () => { 
      loadAccount(provider, dispatch);
    });

    // Load token smart contract
    const DAppConfig = config[chainId].DApp;
    const mETHConfig = config[chainId].mETH;
    await loadTokens(provider, [DAppConfig.address, mETHConfig.address], dispatch);

    // Load exchange contract
    const exchangeConfig = config[chainId].exchange;
    await loadExchange(provider, exchangeConfig.address, dispatch);

    const exchange = await loadExchange(provider, exchangeConfig.address, dispatch);

    // Fetch all orders: open, filled, cancelled
    loadAllOrders(provider, exchange, dispatch);

    // Listen to events
    subscribeToEvents(exchange, dispatch);
  }

  useEffect(() => {
    loadBlockchainData();
  }); 

  return (
    <div>

      <Navbar />


      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          <Markets />

          <Balance />

          <Order />

        </section>
        <section className='exchange__section--right grid'>

          <PriceChart />

          <Transactions />

          <Trades />

          <OrderBook />

        </section>
      </main>

      <Alert />

    </div>
  );
}

export default App;
