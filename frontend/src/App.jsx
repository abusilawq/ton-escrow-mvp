/**
 * ================================================
 * TON Escrow dApp - React Frontend
 * ================================================
 * A decentralized escrow application with TonConnect integration
 *
 * Required dependencies (run in frontend directory):
 * npm install react react-dom @tonconnect/ui-react ton ton-core ton-crypto axios
 * npm install --save-dev vite @vitejs/plugin-react
 */

import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { Address, beginCell, toNano } from 'ton-core';
import axios from 'axios';
import './App.css';

// ==================
// Configuration
// ==================

const CONFIG = {
    // Backend API URL
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3002',

    // Escrow Contract Address (replace after deployment)
    ESCROW_CONTRACT: import.meta.env.VITE_ESCROW_CONTRACT || 'EQD...',

    // Platform fee percentage
    PLATFORM_FEE: 3
};

// ==================
// Main App Component
// ==================

function App() {
    // TonConnect hooks
    const [tonConnectUI] = useTonConnectUI();
    const userAddress = useTonAddress();

    // State management
    const [escrows, setEscrows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('create'); // 'create', 'my-escrows'

    // Form states
    const [createForm, setCreateForm] = useState({
        sellerAddress: '',
        amount: '',
        deadline: '',
        description: ''
    });

    const [selectedEscrow, setSelectedEscrow] = useState(null);

    // ==================
    // Effects
    // ==================

    useEffect(() => {
        if (userAddress) {
            loadEscrows();
        }
    }, [userAddress]);

    // Poll for updates every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (userAddress) {
                loadEscrows();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [userAddress]);

    // ==================
    // API Functions
    // ==================

    /**
     * Load all escrows from backend
     */
    const loadEscrows = async () => {
        try {
            const response = await axios.get(`${CONFIG.API_URL}/escrows`);
            if (response.data.success) {
                const escrowArray = Object.values(response.data.data);
                setEscrows(escrowArray);
            }
        } catch (error) {
            console.error('Error loading escrows:', error);
        }
    };

    /**
     * Get specific escrow by ID
     */
    const getEscrow = async (escrowId) => {
        try {
            const response = await axios.get(`${CONFIG.API_URL}/escrow/${escrowId}`);
            if (response.data.success) {
                return response.data.data;
            }
        } catch (error) {
            console.error('Error getting escrow:', error);
        }
        return null;
    };

    // ==================
    // Blockchain Functions
    // ==================

    /**
     * Create new escrow on blockchain
     */
    const createEscrow = async () => {
        if (!userAddress) {
            alert('Please connect your wallet first');
            return;
        }

        if (!createForm.sellerAddress || !createForm.amount) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);

            // Calculate deadline (24 hours from now if not specified)
            const deadlineTimestamp = createForm.deadline
                ? Math.floor(new Date(createForm.deadline).getTime() / 1000)
                : Math.floor(Date.now() / 1000) + 86400;

            // Build message payload for CreateEscrow
            const messageBody = beginCell()
                .storeUint(1, 32) // op code for CreateEscrow
                .storeAddress(Address.parse(createForm.sellerAddress))
                .storeCoins(toNano(createForm.amount))
                .storeUint(deadlineTimestamp, 32)
                .storeStringTail(createForm.description || 'Escrow payment')
                .endCell();

            // Send transaction via TonConnect
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360,
                messages: [
                    {
                        address: CONFIG.ESCROW_CONTRACT,
                        amount: toNano('0.05').toString(), // Gas fee
                        payload: messageBody.toBoc().toString('base64')
                    }
                ]
            };

            await tonConnectUI.sendTransaction(transaction);

            alert('Escrow created successfully! Please fund it next.');

            // Reset form
            setCreateForm({
                sellerAddress: '',
                amount: '',
                deadline: '',
                description: ''
            });

            // Reload escrows after a delay
            setTimeout(loadEscrows, 3000);

        } catch (error) {
            console.error('Error creating escrow:', error);
            alert('Failed to create escrow: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fund an existing escrow
     */
    const fundEscrow = async (escrowId, amount) => {
        if (!userAddress) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            setLoading(true);

            // Build message payload for FundEscrow
            const messageBody = beginCell()
                .storeUint(2, 32) // op code for FundEscrow
                .storeUint(escrowId, 32)
                .endCell();

            // Send transaction with escrow amount + gas
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360,
                messages: [
                    {
                        address: CONFIG.ESCROW_CONTRACT,
                        amount: (toNano(amount) + toNano('0.05')).toString(),
                        payload: messageBody.toBoc().toString('base64')
                    }
                ]
            };

            await tonConnectUI.sendTransaction(transaction);

            alert('Escrow funded successfully!');

            setTimeout(loadEscrows, 3000);

        } catch (error) {
            console.error('Error funding escrow:', error);
            alert('Failed to fund escrow: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Release escrow to seller
     */
    const releaseEscrow = async (escrowId) => {
        if (!userAddress) {
            alert('Please connect your wallet first');
            return;
        }

        if (!confirm('Are you sure you want to release this escrow to the seller?')) {
            return;
        }

        try {
            setLoading(true);

            // Build message payload for ReleaseEscrow
            const messageBody = beginCell()
                .storeUint(3, 32) // op code for ReleaseEscrow
                .storeUint(escrowId, 32)
                .endCell();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360,
                messages: [
                    {
                        address: CONFIG.ESCROW_CONTRACT,
                        amount: toNano('0.05').toString(), // Gas fee
                        payload: messageBody.toBoc().toString('base64')
                    }
                ]
            };

            await tonConnectUI.sendTransaction(transaction);

            alert('Escrow released successfully!');

            setTimeout(loadEscrows, 3000);

        } catch (error) {
            console.error('Error releasing escrow:', error);
            alert('Failed to release escrow: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Refund escrow to buyer
     */
    const refundEscrow = async (escrowId) => {
        if (!userAddress) {
            alert('Please connect your wallet first');
            return;
        }

        if (!confirm('Are you sure you want to refund this escrow?')) {
            return;
        }

        try {
            setLoading(true);

            // Build message payload for RefundEscrow
            const messageBody = beginCell()
                .storeUint(4, 32) // op code for RefundEscrow
                .storeUint(escrowId, 32)
                .endCell();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360,
                messages: [
                    {
                        address: CONFIG.ESCROW_CONTRACT,
                        amount: toNano('0.05').toString(), // Gas fee
                        payload: messageBody.toBoc().toString('base64')
                    }
                ]
            };

            await tonConnectUI.sendTransaction(transaction);

            alert('Escrow refunded successfully!');

            setTimeout(loadEscrows, 3000);

        } catch (error) {
            console.error('Error refunding escrow:', error);
            alert('Failed to refund escrow: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // ==================
    // Helper Functions
    // ==================

    const calculateFee = (amount) => {
        return (parseFloat(amount) * CONFIG.PLATFORM_FEE / 100).toFixed(2);
    };

    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getStatusBadge = (status) => {
        const colors = {
            'Created': 'badge-created',
            'Funded': 'badge-funded',
            'Released': 'badge-released',
            'Refunded': 'badge-refunded',
            'Unknown': 'badge-unknown'
        };
        return colors[status] || 'badge-unknown';
    };

    // ==================
    // Render
    // ==================

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <div className="logo">
                            <h1>🔒 TON Escrow</h1>
                            <p className="subtitle">Secure payments on TON blockchain</p>
                        </div>
                        <TonConnectButton />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main">
                <div className="container">

                    {!userAddress ? (
                        // Not connected state
                        <div className="welcome-card">
                            <h2>Welcome to TON Escrow</h2>
                            <p>Connect your Tonkeeper wallet to get started</p>
                            <div className="features">
                                <div className="feature">
                                    <span className="icon">🔐</span>
                                    <h3>Secure</h3>
                                    <p>Funds locked in smart contract</p>
                                </div>
                                <div className="feature">
                                    <span className="icon">⚡</span>
                                    <h3>Fast</h3>
                                    <p>Instant blockchain transactions</p>
                                </div>
                                <div className="feature">
                                    <span className="icon">💰</span>
                                    <h3>Low Fees</h3>
                                    <p>Only 3% platform fee</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Connected state
                        <>
                            {/* Tabs */}
                            <div className="tabs">
                                <button
                                    className={`tab ${activeTab === 'create' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('create')}
                                >
                                    Create Escrow
                                </button>
                                <button
                                    className={`tab ${activeTab === 'my-escrows' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('my-escrows')}
                                >
                                    My Escrows ({escrows.length})
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="tab-content">

                                {/* Create Escrow Tab */}
                                {activeTab === 'create' && (
                                    <div className="create-escrow">
                                        <h2>Create New Escrow</h2>

                                        <div className="form">
                                            <div className="form-group">
                                                <label>Seller Address *</label>
                                                <input
                                                    type="text"
                                                    placeholder="EQD..."
                                                    value={createForm.sellerAddress}
                                                    onChange={(e) => setCreateForm({...createForm, sellerAddress: e.target.value})}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Amount (TON) *</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.1"
                                                    placeholder="1.0"
                                                    value={createForm.amount}
                                                    onChange={(e) => setCreateForm({...createForm, amount: e.target.value})}
                                                />
                                                {createForm.amount && (
                                                    <small className="fee-info">
                                                        Platform fee: {calculateFee(createForm.amount)} TON (3%)
                                                        <br />
                                                        Seller receives: {(parseFloat(createForm.amount) - parseFloat(calculateFee(createForm.amount))).toFixed(2)} TON
                                                    </small>
                                                )}
                                            </div>

                                            <div className="form-group">
                                                <label>Deadline (optional)</label>
                                                <input
                                                    type="datetime-local"
                                                    value={createForm.deadline}
                                                    onChange={(e) => setCreateForm({...createForm, deadline: e.target.value})}
                                                />
                                                <small>Leave empty for 24 hours from now</small>
                                            </div>

                                            <div className="form-group">
                                                <label>Description (optional)</label>
                                                <textarea
                                                    rows="3"
                                                    placeholder="Payment for services..."
                                                    value={createForm.description}
                                                    onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                                                />
                                            </div>

                                            <button
                                                className="btn btn-primary"
                                                onClick={createEscrow}
                                                disabled={loading}
                                            >
                                                {loading ? 'Creating...' : 'Create Escrow'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* My Escrows Tab */}
                                {activeTab === 'my-escrows' && (
                                    <div className="my-escrows">
                                        <h2>My Escrows</h2>

                                        {escrows.length === 0 ? (
                                            <div className="empty-state">
                                                <p>No escrows found</p>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => setActiveTab('create')}
                                                >
                                                    Create Your First Escrow
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="escrows-list">
                                                {escrows.map((escrow) => (
                                                    <div key={escrow.id} className="escrow-card">
                                                        <div className="escrow-header">
                                                            <h3>Escrow #{escrow.id}</h3>
                                                            <span className={`badge ${getStatusBadge(escrow.status)}`}>
                                                                {escrow.status}
                                                            </span>
                                                        </div>

                                                        <div className="escrow-details">
                                                            <div className="detail-row">
                                                                <span className="label">Created:</span>
                                                                <span>{new Date(escrow.createdAt).toLocaleString()}</span>
                                                            </div>

                                                            {escrow.transactions && escrow.transactions.length > 0 && (
                                                                <div className="transactions">
                                                                    <h4>Transaction History</h4>
                                                                    {escrow.transactions.map((tx, idx) => (
                                                                        <div key={idx} className="transaction-item">
                                                                            <span className={`badge ${getStatusBadge(tx.status)}`}>
                                                                                {tx.status}
                                                                            </span>
                                                                            <span className="timestamp">
                                                                                {new Date(tx.timestamp).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="escrow-actions">
                                                            {escrow.status === 'Created' && (
                                                                <button
                                                                    className="btn btn-primary btn-sm"
                                                                    onClick={() => fundEscrow(escrow.id, '1.0')}
                                                                    disabled={loading}
                                                                >
                                                                    Fund Escrow
                                                                </button>
                                                            )}

                                                            {escrow.status === 'Funded' && (
                                                                <>
                                                                    <button
                                                                        className="btn btn-success btn-sm"
                                                                        onClick={() => releaseEscrow(escrow.id)}
                                                                        disabled={loading}
                                                                    >
                                                                        Release to Seller
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-danger btn-sm"
                                                                        onClick={() => refundEscrow(escrow.id)}
                                                                        disabled={loading}
                                                                    >
                                                                        Refund
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <p>TON Escrow MVP - Secure blockchain payments</p>
                    <p>Platform Fee: {CONFIG.PLATFORM_FEE}% per transaction</p>
                </div>
            </footer>
        </div>
    );
}

export default App;
