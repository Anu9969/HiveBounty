import  { useState } from 'react'
import { useHiveWallet } from '../hooks/use-hive-wallet'

export const WalletConnect = () => {
  const { 
    connected, 
    username, 
    accountInfo, 
    handleConnect, 
    handleDisconnect,
    isKeychainInstalled,
    keychainDownloadLink
  } = useHiveWallet()
  
  const [inputUsername, setInputUsername] = useState('')
  const [showConnectForm, setShowConnectForm] = useState(false)
  
  const onConnect = async () => {
    if (!inputUsername) return
    await handleConnect(inputUsername)
    setShowConnectForm(false)
  }
  
  if (!isKeychainInstalled) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-4">
        <p>Hive Keychain extension is required.</p>
        <a 
          href={keychainDownloadLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Install Hive Keychain
        </a>
      </div>
    )
  }
  
  if (!connected) {
    return (
      <div className="mt-4">
        {!showConnectForm ? (
          <button 
            onClick={() => setShowConnectForm(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Hive Username"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <button 
              onClick={onConnect}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Connect
            </button>
            <button 
              onClick={() => setShowConnectForm(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="mt-4 bg-white p-4 rounded shadow">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold">Connected as: @{username}</p>
          <p className="text-sm text-gray-600">
            Balance: {accountInfo?.balance || '0 HIVE'}
          </p>
        </div>
        <button 
          onClick={handleDisconnect}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}