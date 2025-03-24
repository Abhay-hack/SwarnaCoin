import React, { useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';

const faucetAddress = "0xD271a916Ea412580e6F419c697f355CDC11a1271";
const faucetABI = [
  "function requestTokens() public",
  "function faucetAmount() public view returns (uint256)",
  "function cooldown() public view returns (uint256)",
  "function lastRequestTime(address) public view returns (uint256)"
];

export default function SwarnaFaucetPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState("");
  const [cooldownInfo, setCooldownInfo] = useState(null);

  async function connectWallet() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      fetchCooldown(accounts[0]);
    } else {
      alert("Please install MetaMask!");
    }
  }

  async function fetchCooldown(address) {
    const provider = new BrowserProvider(window.ethereum);
    const contract = new Contract(faucetAddress, faucetABI, provider);
    const lastTime = await contract.lastRequestTime(address);
    const cooldown = await contract.cooldown();
    setCooldownInfo({ lastTime: Number(lastTime), cooldown: Number(cooldown) });
  }

  async function requestFaucet() {
    try {
      setStatus("Sending request...");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(faucetAddress, faucetABI, signer);

      const tx = await contract.requestTokens();
      await tx.wait();
      setStatus("✅ Faucet tokens claimed successfully!");
      fetchCooldown(walletAddress);
    } catch (error) {
      setStatus("❌ Error: " + error.message);
    }
  }

  const canRequest = () => {
    if (!cooldownInfo) return true;
    const now = Math.floor(Date.now() / 1000);
    return now > (cooldownInfo.lastTime + cooldownInfo.cooldown);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-300 p-8">
      <h1 className="text-4xl font-bold mb-4 text-yellow-800">SwarnaCoin Faucet 💧</h1>

      {walletAddress ? (
        <>
          <p className="mb-2 text-yellow-900">Connected: {walletAddress}</p>
          <button
            className={`px-6 py-2 mb-4 text-white rounded ${canRequest() ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-400 cursor-not-allowed'}`}
            onClick={requestFaucet}
            disabled={!canRequest()}
          >
            {canRequest() ? 'Claim 10 SWN Tokens' : 'Cooldown Active'}
          </button>
        </>
      ) : (
        <button
          className="px-6 py-2 mb-4 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      )}

      {status && <p className="text-yellow-900">{status}</p>}
    </div>
  );
}
