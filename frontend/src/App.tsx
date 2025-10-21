// Main Application Component
// Handles wallet connection, escrow creation, and transaction management

import { useState, useEffect } from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { Address, toNano } from '@ton/ton';
import axios from 'axios';
import './App.css';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Commission wallet (from requirements)
const COMMISSION_WALLET = 'UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj';
const COMMISSION_RATE = 3; // 3%

// Types
interface EscrowFormData {
  beneficiary: string;
  amount: string;
  deadline: string;
}

interface CommissionInfo {
  total: number;
  commission: number;
  beneficiaryAmount: number;
}

function App() {
  // TonConnect hooks
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();

  // State
  const [formData, setFormData] = useState<EscrowFormData>({
    beneficiary: '',
    amount: '',
    deadline: '',
  });
  const [commissionInfo, setCommissionInfo] = useState<CommissionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);

  // Fetch app configuration on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  // Calculate commission when amount changes
  useEffect(() => {
    if (formData.amount) {
      const amount = parseFloat(formData.amount);
      if (!isNaN(amount) && amount > 0) {
        const commission = (amount * COMMISSION_RATE) / 100;
        const beneficiaryAmount = amount - commission;
        setCommissionInfo({
          total: amount,
          commission,
          beneficiaryAmount,
        });
      } else {
        setCommissionInfo(null);
      }
    } else {
      setCommissionInfo(null);
    }
  }, [formData.amount]);

  /**
   * Fetch app configuration from backend
   */
  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/config`);
      setConfig(response.data.data);
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  /**
   * Validate form data
   */
  const validateForm = (): string | null => {
    // Validate beneficiary address
    if (!formData.beneficiary) {
      return 'Beneficiary address is required';
    }

    try {
      Address.parse(formData.beneficiary);
    } catch {
      return 'Invalid TON address format';
    }

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount < 0.1) {
      return 'Amount must be at least 0.1 TON';
    }

    // Validate deadline
    if (!formData.deadline) {
      return 'Deadline is required';
    }

    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate <= new Date()) {
      return 'Deadline must be in the future';
    }

    return null;
  };

  /**
   * Handle escrow creation
   * Sends transaction through TonConnect
   */
  const handleCreateEscrow = async () => {
    // Check wallet connection
    if (!userAddress) {
      setError('Please connect your wallet first');
      return;
    }

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert deadline to Unix timestamp
      const deadlineTimestamp = Math.floor(new Date(formData.deadline).getTime() / 1000);

      // Prepare escrow data
      const escrowData = {
        beneficiary: formData.beneficiary,
        amount: parseFloat(formData.amount),
        deadline: deadlineTimestamp,
      };

      // Call backend API to prepare transaction
      const response = await axios.post(`${API_BASE_URL}/api/v1/escrows/create`, escrowData);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create escrow');
      }

      const { transactionData } = response.data.data;

      // Send transaction through TonConnect
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: transactionData.to,
            amount: transactionData.value,
            payload: transactionData.payload,
          },
        ],
      };

      // Send transaction
      await tonConnectUI.sendTransaction(transaction);

      // Show success message
      setSuccess('Escrow created successfully! Transaction sent to blockchain.');

      // Reset form
      setFormData({
        beneficiary: '',
        amount: '',
        deadline: '',
      });
      setCommissionInfo(null);

      // Notify Telegram WebApp if available
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('Escrow created successfully!');
      }
    } catch (err: any) {
      console.error('Error creating escrow:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create escrow');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle wallet connection
   */
  const handleConnectWallet = async () => {
    try {
      await tonConnectUI.openModal();
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  };

  /**
   * Handle wallet disconnection
   */
  const handleDisconnectWallet = async () => {
    try {
      await tonConnectUI.disconnect();
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
    }
  };

  /**
   * Format TON amount for display
   */
  const formatTon = (amount: number): string => {
    return `${amount.toFixed(2)} TON`;
  };

  /**
   * Get minimum deadline (tomorrow)
   */
  const getMinDeadline = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1>🔒 TON Escrow</h1>
          <p className="subtitle">Secure blockchain-based escrow on TON network</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container">
        {/* Wallet Connection Card */}
        <div className="card wallet-card">
          <h3>Wallet Connection</h3>
          {userAddress ? (
            <div className="wallet-info">
              <p>
                <strong>Connected:</strong>{' '}
                {userAddress.slice(0, 8)}...{userAddress.slice(-6)}
              </p>
              <button className="btn-secondary" onClick={handleDisconnectWallet}>
                Disconnect
              </button>
            </div>
          ) : (
            <div className="wallet-connect">
              <p>Connect your Tonkeeper wallet to create escrow</p>
              <button className="btn-primary" onClick={handleConnectWallet}>
                Connect Wallet
              </button>
            </div>
          )}
        </div>

        {/* Commission Info Card */}
        <div className="card info-card">
          <h3>ℹ️ How It Works</h3>
          <ul className="info-list">
            <li>✅ Connect your Tonkeeper wallet</li>
            <li>✅ Enter beneficiary address and amount</li>
            <li>✅ Set a deadline for the escrow</li>
            <li>✅ Send TON to the smart contract</li>
            <li>
              ✅ On release: <strong>97%</strong> goes to beneficiary,{' '}
              <strong>3%</strong> commission
            </li>
            <li>✅ After deadline: Full refund available</li>
          </ul>

          <div className="commission-details">
            <p>
              <strong>Commission Wallet:</strong>
            </p>
            <p className="address-display">{COMMISSION_WALLET}</p>
            <p>
              <strong>Commission Rate:</strong> {COMMISSION_RATE}%
            </p>
          </div>
        </div>

        {/* Escrow Creation Form */}
        {userAddress && (
          <div className="card escrow-form-card">
            <h2>Create New Escrow</h2>

            {/* Error Alert */}
            {error && <div className="alert alert-error">{error}</div>}

            {/* Success Alert */}
            {success && <div className="alert alert-success">{success}</div>}

            <form className="escrow-form" onSubmit={(e) => e.preventDefault()}>
              {/* Beneficiary Address */}
              <div className="form-group">
                <label htmlFor="beneficiary">Beneficiary Address</label>
                <input
                  type="text"
                  id="beneficiary"
                  name="beneficiary"
                  value={formData.beneficiary}
                  onChange={handleInputChange}
                  placeholder="UQ..."
                  disabled={loading}
                />
                <small>Enter the TON wallet address of the beneficiary</small>
              </div>

              {/* Amount */}
              <div className="form-group">
                <label htmlFor="amount">Amount (TON)</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.0"
                  step="0.01"
                  min="0.1"
                  disabled={loading}
                />
                <small>Minimum amount: 0.1 TON</small>
              </div>

              {/* Deadline */}
              <div className="form-group">
                <label htmlFor="deadline">Deadline</label>
                <input
                  type="datetime-local"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  min={getMinDeadline()}
                  disabled={loading}
                />
                <small>Deadline for automatic refund if not released</small>
              </div>

              {/* Commission Breakdown */}
              {commissionInfo && (
                <div className="commission-breakdown">
                  <h3>Transaction Breakdown</h3>
                  <div className="breakdown-row">
                    <span>Total Amount:</span>
                    <strong>{formatTon(commissionInfo.total)}</strong>
                  </div>
                  <div className="breakdown-row">
                    <span>Commission (3%):</span>
                    <strong className="text-warning">
                      -{formatTon(commissionInfo.commission)}
                    </strong>
                  </div>
                  <div className="breakdown-row highlight">
                    <span>Beneficiary Receives:</span>
                    <strong className="text-success">
                      {formatTon(commissionInfo.beneficiaryAmount)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                className="btn-primary btn-large"
                onClick={handleCreateEscrow}
                disabled={loading || !userAddress}
              >
                {loading ? 'Creating Escrow...' : 'Create Escrow'}
              </button>
            </form>
          </div>
        )}

        {/* Network Info */}
        {config && (
          <div className="card network-info">
            <h3>Network Information</h3>
            <p>
              <strong>Network:</strong> {config.network}
            </p>
            <p>
              <strong>Contract Address:</strong> {config.contractAddress}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container text-center">
          <p>Built with ❤️ on TON Blockchain</p>
          <p>
            <small>Powered by Tact Smart Contracts</small>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
