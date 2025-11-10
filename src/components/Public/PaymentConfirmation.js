import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../../supabaseClient';

/**
 * PaymentConfirmation - Public page for confirming payments via email token
 * No authentication required - token-based access only
 * Accessed via: /?token=UUID
 */
const PaymentConfirmation = () => {
  // Get token from URL query parameter
  const getTokenFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  };

  const token = getTokenFromURL();

  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setStatus('error');
      setMessage('Invalid confirmation link - no token provided');
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateToken = async () => {
    try {
      setStatus('loading');

      // Call the validate_payment_token function
      const { data, error } = await supabase
        .rpc('validate_payment_token', {
          p_token: token,
        });

      if (error) {
        throw error;
      }

      const result = data?.[0];

      if (!result || !result.valid) {
        setStatus('error');
        setMessage(result?.error_message || 'Invalid or expired token');
        return;
      }

      // Success!
      setStatus('success');
      setPaymentDetails({
        amount: result.amount_due,
        playerId: result.player_id,
      });
      setMessage('Thank you! Your payment confirmation has been received.');

    } catch (error) {
      console.error('Error validating token:', error);
      setStatus('error');
      setMessage('An error occurred while confirming your payment. Please try again or contact the club.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount || 0);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        padding: '40px',
        textAlign: 'center',
      }}>
        {/* Logo/Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1a202c',
            margin: '0 0 8px 0',
          }}>
            Cawood Tennis Club
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#718096',
            margin: 0,
          }}>
            Payment Confirmation
          </p>
        </div>

        {/* Status Content */}
        {status === 'loading' && (
          <div style={{ padding: '40px 20px' }}>
            <Loader
              className="w-16 h-16 mx-auto mb-4 animate-spin"
              style={{ color: '#667eea', animation: 'spin 1s linear infinite' }}
            />
            <p style={{ fontSize: '18px', color: '#4a5568' }}>
              Confirming your payment...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ padding: '20px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#48bb78',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#2d3748',
              marginBottom: '16px',
            }}>
              Payment Confirmed!
            </h2>

            <p style={{
              fontSize: '16px',
              color: '#4a5568',
              marginBottom: '24px',
              lineHeight: '1.6',
            }}>
              {message}
            </p>

            {paymentDetails && (
              <div style={{
                background: '#f7fafc',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px',
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#718096',
                  marginBottom: '8px',
                }}>
                  Amount Confirmed
                </p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#48bb78',
                  margin: 0,
                }}>
                  {formatCurrency(paymentDetails.amount)}
                </p>
              </div>
            )}

            <div style={{
              background: '#ebf8ff',
              border: '2px solid #4299e1',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" style={{ marginTop: '2px' }} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{
                    fontSize: '14px',
                    color: '#2c5282',
                    margin: '0 0 8px 0',
                    fontWeight: '600',
                  }}>
                    What happens next?
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#2d3748',
                    margin: 0,
                    lineHeight: '1.5',
                  }}>
                    An admin will review and confirm your payment within 48 hours.
                    You'll receive an email once your payment has been verified.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.location.href = '/'}
              style={{
                background: '#667eea',
                color: 'white',
                padding: '12px 32px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s',
                width: '100%',
              }}
              onMouseOver={(e) => e.target.style.background = '#5a67d8'}
              onMouseOut={(e) => e.target.style.background = '#667eea'}
            >
              Go to Coaching Portal
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: '20px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#fc8181',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <XCircle className="w-12 h-12 text-white" />
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#2d3748',
              marginBottom: '16px',
            }}>
              Unable to Confirm Payment
            </h2>

            <p style={{
              fontSize: '16px',
              color: '#4a5568',
              marginBottom: '24px',
              lineHeight: '1.6',
            }}>
              {message}
            </p>

            <div style={{
              background: '#fff5f5',
              border: '2px solid #fc8181',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
            }}>
              <p style={{
                fontSize: '14px',
                color: '#742a2a',
                margin: 0,
                lineHeight: '1.5',
              }}>
                <strong>Common reasons:</strong><br />
                • This link has already been used<br />
                • The link has expired (valid for 30 days)<br />
                • The payment was already confirmed by an admin
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '12px 32px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.target.style.background = '#5a67d8'}
                onMouseOut={(e) => e.target.style.background = '#667eea'}
              >
                Log in to Check Status
              </button>

              <p style={{
                fontSize: '14px',
                color: '#718096',
                margin: '12px 0 0 0',
              }}>
                Need help? Email{' '}
                <a
                  href="mailto:cawoodtennis@gmail.com"
                  style={{ color: '#667eea', textDecoration: 'none' }}
                >
                  cawoodtennis@gmail.com
                </a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default PaymentConfirmation;
