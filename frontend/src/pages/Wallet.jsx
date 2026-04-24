import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import WindowsLoader from '../components/WindowsLoader';

export default function Wallet() {
  const { currentUser } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const username = currentUser?.displayName || 'Anonymous Farmer';

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        fetch(`/api/wallet/${encodeURIComponent(username)}`),
        fetch(`/api/wallet/${encodeURIComponent(username)}/transactions`)
      ]);
      
      const walletData = await walletRes.json();
      const txData = await txRes.json();
      
      setWallet(walletData);
      setTransactions(txData);
    } catch (err) {
      console.error('Failed to fetch wallet data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [username]);

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-bento-gap">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4">
        <div>
          <h2 className="font-headline-lg text-on-surface tracking-tight">Wallet</h2>
          <p className="font-body-md text-outline mt-1">Manage your funds and view transactions.</p>
        </div>
        <div className="bg-primary text-white px-6 py-4 rounded-2xl shadow-sm flex flex-col items-end min-w-[200px]">
          <span className="font-label-sm uppercase tracking-wider opacity-80 mb-1">Current Balance</span>
          <span className="font-headline-lg font-bold">
            ${wallet ? wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </span>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-variant/30 flex items-center justify-between">
          <h3 className="font-headline-md text-on-surface">Transaction History</h3>
          <button onClick={fetchWalletData} className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 flex flex-col items-center justify-center text-outline">
            <WindowsLoader label="Loading transactions..." />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">receipt_long</span>
            <p className="font-body-md text-on-surface-variant">No transactions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {transactions.map((tx) => {
              const isBuyer = tx.buyer_name === username;
              const type = isBuyer ? 'Purchase' : 'Sale';
              const sign = isBuyer ? '-' : '+';
              const amountClass = isBuyer ? 'text-error' : 'text-primary';
              const icon = isBuyer ? 'shopping_cart' : 'storefront';
              
              return (
                <div key={tx.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-surface-variant/20 transition-colors">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border border-outline-variant ${isBuyer ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}>
                    <span className="material-symbols-outlined">{icon}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline-sm text-on-surface truncate">
                      {tx.crop_name}
                    </h4>
                    <p className="font-body-sm text-outline mt-1">
                      {type} {isBuyer ? `from ${tx.seller_name}` : `to ${tx.buyer_name}`}
                    </p>
                  </div>

                  <div className="flex flex-col items-end ml-auto">
                    <span className={`font-headline-sm ${amountClass}`}>
                      {sign}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="font-label-sm text-outline mt-1">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
