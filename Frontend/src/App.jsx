import { useState, useEffect } from 'react';

function App() {
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    address: '',
    phone: '',
    email: '',
    credit_card_info: '',
  });

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });

  const [requestForm, setRequestForm] = useState({
    service_address: '',
    cleaning_type: 'basic',
    number_of_rooms: '',
    preferred_datetime: '',
    proposed_budget: '',
    notes: '',
  });

  const [myRequests, setMyRequests] = useState([]);
  const [myQuotes, setMyQuotes] = useState([]);
  const [myBills, setMyBills] = useState([]);

  const [adminRequests, setAdminRequests] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);

  // dashboard states
  const [freqClients, setFreqClients] = useState([]);
  const [uncommittedClients, setUncommittedClients] = useState([]);
  const [acceptedQuotes, setAcceptedQuotes] = useState([]);
  const [prospectiveClients, setProspectiveClients] = useState([]);
  const [largestJobs, setLargestJobs] = useState([]);
  const [overdueBills, setOverdueBills] = useState([]);
  const [badClients, setBadClients] = useState([]);
  const [goodClients, setGoodClients] = useState([]);

  const [message, setMessage] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [clientInfo, setClientInfo] = useState(
    localStorage.getItem('clientInfo')
      ? JSON.parse(localStorage.getItem('clientInfo'))
      : null
  );

  const API_BASE = 'http://localhost:3001';

  useEffect(() => {
    if (token) {
      fetchMyRequests();
      fetchMyQuotes();
      fetchMyBills();
      if (clientInfo?.is_admin) {
        fetchAdminPending();
        fetchAdminOrders();
        fetchDashboard();
      }
    } else {
      setMyRequests([]);
      setMyQuotes([]);
      setMyBills([]);
      setAdminRequests([]);
      setAdminOrders([]);
      setFreqClients([]);
      setUncommittedClients([]);
      setAcceptedQuotes([]);
      setProspectiveClients([]);
      setLargestJobs([]);
      setOverdueBills([]);
      setBadClients([]);
      setGoodClients([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, clientInfo?.is_admin]);

  //  form handlers 

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestChange = (e) => {
    const { name, value } = e.target;
    setRequestForm((prev) => ({ ...prev, [name]: value }));
  };

  //  API calls 

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Registration failed');
      } else {
        setMessage('Registration successful. You can now log in.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Login failed');
      } else {
        setMessage('Login successful');
        setToken(data.token);
        setClientInfo(data.client);
        localStorage.setItem('token', data.token);
        localStorage.setItem('clientInfo', JSON.stringify(data.client));
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server');
    }
  };

  const handleLogout = () => {
    setToken('');
    setClientInfo(null);
    setMyRequests([]);
    setMyQuotes([]);
    setMyBills([]);
    setAdminRequests([]);
    setAdminOrders([]);
    setFreqClients([]);
    setUncommittedClients([]);
    setAcceptedQuotes([]);
    setProspectiveClients([]);
    setLargestJobs([]);
    setOverdueBills([]);
    setBadClients([]);
    setGoodClients([]);
    localStorage.removeItem('token');
    localStorage.removeItem('clientInfo');
    setMessage('Logged out');
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Failed to create request');
      } else {
        setMessage('Service request created');
        setRequestForm({
          service_address: '',
          cleaning_type: 'basic',
          number_of_rooms: '',
          preferred_datetime: '',
          proposed_budget: '',
          notes: '',
        });
        fetchMyRequests();
        if (clientInfo?.is_admin) {
          fetchAdminPending();
        }
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server');
    }
  };

  const handleAcceptQuote = async (quoteId) => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/quotes/${quoteId}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Failed to accept quote');
      } else {
        setMessage('Quote accepted, order created');
        fetchMyQuotes();
        fetchMyRequests();
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server');
    }
  };

  const handlePayBill = async (billId) => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/bills/${billId}/pay`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Failed to pay bill');
      } else {
        setMessage('Bill paid successfully');
        fetchMyBills();
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server');
    }
  };

  const handleDisputeBill = async (billId) => {
    const note = prompt('Enter dispute note:');
    if (!note) return;
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/bills/${billId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Failed to dispute bill');
      } else {
        setMessage('Bill disputed');
        fetchMyBills();
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server');
    }
  };

  const handleAdminCompleteAndBill = async (orderId) => {
    const amount = prompt('Enter bill amount:');
    if (!amount) return;
    const note = prompt('Optional note for bill:') || '';
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/complete-and-bill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to complete and bill');
      } else {
        alert('Order completed and bill created');
        fetchAdminOrders();
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
      alert('Error completing order');
    }
  };

  const handleAdminReviseBill = async () => {
    const billId = prompt('Enter bill ID to revise:');
    if (!billId) return;
    const new_amount = prompt('Enter new amount:');
    if (!new_amount) return;
    const note = prompt('Optional revision note:') || '';
    try {
      const res = await fetch(`${API_BASE}/api/admin/bills/${billId}/revise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_amount, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to revise bill');
      } else {
        alert('Bill revised');
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
      alert('Error revising bill');
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/my/requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMyRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyQuotes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/my/quotes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMyQuotes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyBills = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/my/bills`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMyBills(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminPending = async () => {
    if (!clientInfo?.is_admin) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/requests/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setAdminRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminOrders = async () => {
    if (!clientInfo?.is_admin) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setAdminOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboard = async () => {
    if (!clientInfo?.is_admin) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };

      let res = await fetch(`${API_BASE}/api/admin/dashboard/frequent-clients`, { headers });
      if (res.ok) setFreqClients(await res.json());

      res = await fetch(`${API_BASE}/api/admin/dashboard/uncommitted-clients`, { headers });
      if (res.ok) setUncommittedClients(await res.json());

      res = await fetch(`${API_BASE}/api/admin/dashboard/accepted-quotes`, { headers });
      if (res.ok) setAcceptedQuotes(await res.json());

      res = await fetch(`${API_BASE}/api/admin/dashboard/prospective-clients`, { headers });
      if (res.ok) setProspectiveClients(await res.json());

      res = await fetch(`${API_BASE}/api/admin/dashboard/largest-job`, { headers });
      if (res.ok) setLargestJobs(await res.json());

      res = await fetch(`${API_BASE}/api/admin/dashboard/overdue-bills`, { headers });
      if (res.ok) setOverdueBills(await res.json());

      res = await fetch(`${API_BASE}/api/admin/dashboard/bad-clients`, { headers });
      if (res.ok) setBadClients(await res.json());

      res = await fetch(`${API_BASE}/api/admin/dashboard/good-clients`, { headers });
      if (res.ok) setGoodClients(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  //  styling 

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem',
    fontFamily: 'sans-serif',
    color: 'white',
  };

  const cardStyle = {
    flex: 1,
    border: '1px solid #666',
    padding: '1rem',
    backgroundColor: '#181818',
  };

  const labelStyle = {
    display: 'block',
    marginTop: '0.5rem',
    fontSize: '0.9rem',
  };

  const inputStyle = {
    width: '100%',
    marginTop: '0.2rem',
    padding: '0.3rem',
    backgroundColor: '#222',
    border: '1px solid #444',
    color: 'white',
  };

  const buttonStyle = {
    marginTop: '0.8rem',
    padding: '0.4rem 0.8rem',
    backgroundColor: '#000',
    color: 'white',
    border: '1px solid #555',
    cursor: 'pointer',
  };

  //  render  

  return (
    <div style={containerStyle}>
      <h1>Cleaning Service App</h1>
      <p>Backend: {API_BASE}</p>

      {message && (
        <div style={{ marginBottom: '1rem', color: '#9ecbff' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Register */}
        <form onSubmit={handleRegisterSubmit} style={cardStyle}>
          <h2>Register Client</h2>

          <label style={labelStyle}>Username
            <input
              style={inputStyle}
              name="username"
              value={registerForm.username}
              onChange={handleRegisterChange}
              required
            />
          </label>

          <label style={labelStyle}>Password
            <input
              style={inputStyle}
              type="password"
              name="password"
              value={registerForm.password}
              onChange={handleRegisterChange}
              required
            />
          </label>

          <label style={labelStyle}>First Name
            <input
              style={inputStyle}
              name="first_name"
              value={registerForm.first_name}
              onChange={handleRegisterChange}
              required
            />
          </label>

          <label style={labelStyle}>Last Name
            <input
              style={inputStyle}
              name="last_name"
              value={registerForm.last_name}
              onChange={handleRegisterChange}
              required
            />
          </label>

          <label style={labelStyle}>Address
            <input
              style={inputStyle}
              name="address"
              value={registerForm.address}
              onChange={handleRegisterChange}
              required
            />
          </label>

          <label style={labelStyle}>Phone
            <input
              style={inputStyle}
              name="phone"
              value={registerForm.phone}
              onChange={handleRegisterChange}
            />
          </label>

          <label style={labelStyle}>Email
            <input
              style={inputStyle}
              type="email"
              name="email"
              value={registerForm.email}
              onChange={handleRegisterChange}
              required
            />
          </label>

          <label style={labelStyle}>Credit Card Info
            <input
              style={inputStyle}
              name="credit_card_info"
              value={registerForm.credit_card_info}
              onChange={handleRegisterChange}
            />
          </label>

          <button type="submit" style={buttonStyle}>Register</button>
        </form>

        {/* Login */}
        <form onSubmit={handleLoginSubmit} style={cardStyle}>
          <h2>Login</h2>

          <label style={labelStyle}>Username
            <input
              style={inputStyle}
              name="username"
              value={loginForm.username}
              onChange={handleLoginChange}
              required
            />
          </label>

          <label style={labelStyle}>Password
            <input
              style={inputStyle}
              type="password"
              name="password"
              value={loginForm.password}
              onChange={handleLoginChange}
              required
            />
          </label>

          <button type="submit" style={buttonStyle}>Login</button>

          {token && (
            <div style={{ marginTop: '1rem' }}>
              <div><strong>Logged in as:</strong> {clientInfo?.username}</div>
              <div>
                <strong>Role:</strong>{' '}
                {clientInfo?.is_admin ? 'Admin (Anna)' : 'Client'}
              </div>
              <button type="button" onClick={handleLogout} style={buttonStyle}>
                Logout
              </button>
            </div>
          )}
        </form>
      </div>

      {/* CLIENT VIEW */}
      {token && !clientInfo?.is_admin && (
        <>
          {/* Requests + Quotes */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem' }}>
            <form onSubmit={handleRequestSubmit} style={cardStyle}>
              <h2>Create Service Request</h2>

              <label style={labelStyle}>Service Address
                <input
                  style={inputStyle}
                  name="service_address"
                  value={requestForm.service_address}
                  onChange={handleRequestChange}
                  required
                />
              </label>

              <label style={labelStyle}>Cleaning Type
                <select
                  style={inputStyle}
                  name="cleaning_type"
                  value={requestForm.cleaning_type}
                  onChange={handleRequestChange}
                >
                  <option value="basic">Basic</option>
                  <option value="deep">Deep Cleaning</option>
                  <option value="move-out">Move-out</option>
                </select>
              </label>

              <label style={labelStyle}>Number of Rooms
                <input
                  style={inputStyle}
                  type="number"
                  name="number_of_rooms"
                  value={requestForm.number_of_rooms}
                  onChange={handleRequestChange}
                  required
                />
              </label>

              <label style={labelStyle}>Preferred Date &amp; Time
                <input
                  style={inputStyle}
                  type="datetime-local"
                  name="preferred_datetime"
                  value={requestForm.preferred_datetime}
                  onChange={handleRequestChange}
                  required
                />
              </label>

              <label style={labelStyle}>Proposed Budget
                <input
                  style={inputStyle}
                  type="number"
                  step="0.01"
                  name="proposed_budget"
                  value={requestForm.proposed_budget}
                  onChange={handleRequestChange}
                  required
                />
              </label>

              <label style={labelStyle}>Notes
                <textarea
                  style={{ ...inputStyle, minHeight: '60px' }}
                  name="notes"
                  value={requestForm.notes}
                  onChange={handleRequestChange}
                />
              </label>

              <button type="submit" style={buttonStyle}>Submit Request</button>
            </form>

            <div style={cardStyle}>
              <h2>My Service Requests & Quotes</h2>
              {myRequests.length === 0 && <p>No requests yet.</p>}
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {myRequests.map((r) => {
                  const relatedQuotes = myQuotes.filter(
                    (q) => q.request_id === r.request_id
                  );
                  return (
                    <li
                      key={r.request_id}
                      style={{
                        marginBottom: '0.7rem',
                        borderBottom: '1px solid #444',
                        paddingBottom: '0.5rem',
                      }}
                    >
                      <div><strong>Address:</strong> {r.service_address}</div>
                      <div><strong>Type:</strong> {r.cleaning_type}</div>
                      <div><strong>Rooms:</strong> {r.number_of_rooms}</div>
                      <div>
                        <strong>Preferred:</strong>{' '}
                        {new Date(r.preferred_datetime).toLocaleString()}
                      </div>
                      <div>
                        <strong>Budget:</strong>{' '}
                        ${Number(r.proposed_budget).toFixed(2)}
                      </div>
                      <div><strong>Status:</strong> {r.status}</div>
                      {r.notes && <div><strong>Notes:</strong> {r.notes}</div>}

                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Quotes:</strong>
                        {relatedQuotes.length === 0 && (
                          <div>None yet.</div>
                        )}
                        {relatedQuotes.length > 0 && (
                          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                            {relatedQuotes.map((q) => (
                              <li key={q.quote_id} style={{ marginTop: '0.3rem' }}>
                                <div>
                                  Price: ${Number(q.quoted_price).toFixed(2)} | Window:{' '}
                                  {q.scheduled_time_window} | Status: {q.status}
                                </div>
                                {q.status === 'pending' && (
                                  <button
                                    type="button"
                                    style={{
                                      ...buttonStyle,
                                      padding: '0.2rem 0.5rem',
                                      marginTop: '0.2rem',
                                    }}
                                    onClick={() => handleAcceptQuote(q.quote_id)}
                                  >
                                    Accept Quote
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Bills */}
          <div style={{ marginTop: '2rem' }}>
            <div style={cardStyle}>
              <h2>My Bills</h2>
              {myBills.length === 0 && <p>No bills yet.</p>}
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {myBills.map((b) => (
                  <li
                    key={b.bill_id}
                    style={{
                      marginBottom: '0.7rem',
                      borderBottom: '1px solid #444',
                      paddingBottom: '0.5rem',
                    }}
                  >
                    <div><strong>Bill ID:</strong> {b.bill_id}</div>
                    <div><strong>Order ID:</strong> {b.order_id}</div>
                    <div><strong>Service Address:</strong> {b.service_address}</div>
                    <div>
                      <strong>Amount:</strong> ${Number(b.amount).toFixed(2)}
                    </div>
                    <div>
                      <strong>Created:</strong>{' '}
                      {new Date(b.created_at).toLocaleString()}
                    </div>
                    <div><strong>Status:</strong> {b.status}</div>
                    {b.status !== 'paid' && (
                      <div style={{ marginTop: '0.3rem' }}>
                        <button
                          type="button"
                          style={{
                            ...buttonStyle,
                            padding: '0.2rem 0.5rem',
                            marginRight: '0.5rem',
                          }}
                          onClick={() => handlePayBill(b.bill_id)}
                        >
                          Pay
                        </button>
                        <button
                          type="button"
                          style={{
                            ...buttonStyle,
                            padding: '0.2rem 0.5rem',
                          }}
                          onClick={() => handleDisputeBill(b.bill_id)}
                        >
                          Dispute
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* ADMIN VIEW */}
      {token && clientInfo?.is_admin && (
        <>
          {/* Pending requests + quote creation */}
          <div style={{ marginTop: '2rem' }}>
            <div style={cardStyle}>
              <h2>Admin: Pending Service Requests</h2>
              {adminRequests.length === 0 && <p>No pending requests.</p>}
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {adminRequests.map((r) => (
                  <li
                    key={r.request_id}
                    style={{
                      marginBottom: '0.7rem',
                      borderBottom: '1px solid #444',
                      paddingBottom: '0.5rem',
                    }}
                  >
                    <div>
                      <strong>Client:</strong>{' '}
                      {r.first_name} {r.last_name} ({r.username})
                    </div>
                    <div><strong>Address:</strong> {r.service_address}</div>
                    <div><strong>Type:</strong> {r.cleaning_type}</div>
                    <div><strong>Rooms:</strong> {r.number_of_rooms}</div>
                    <div>
                      <strong>Preferred:</strong>{' '}
                      {new Date(r.preferred_datetime).toLocaleString()}
                    </div>
                    <div>
                      <strong>Budget:</strong>{' '}
                      ${Number(r.proposed_budget).toFixed(2)}
                    </div>
                    <div><strong>Status:</strong> {r.status}</div>
                    {r.notes && <div><strong>Notes:</strong> {r.notes}</div>}

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const quoted_price = prompt('Enter quoted price:');
                        if (!quoted_price) return;
                        const scheduled_time_window = prompt(
                          'Enter scheduled time window (e.g. 2pm-4pm):'
                        );
                        if (!scheduled_time_window) return;
                        const note = prompt('Optional note or message:') || '';

                        try {
                          const res = await fetch(`${API_BASE}/api/admin/quotes`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              request_id: r.request_id,
                              quoted_price,
                              scheduled_time_window,
                              note,
                            }),
                          });

                          const data = await res.json();
                          if (!res.ok) {
                            alert(data.message || 'Failed to create quote');
                          } else {
                            alert('Quote created successfully');
                            fetchAdminPending();
                          }
                        } catch (err) {
                          console.error(err);
                          alert('Error sending quote');
                        }
                      }}
                    >
                      <button
                        type="submit"
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.3rem',
                          cursor: 'pointer',
                        }}
                      >
                        Create Quote
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Orders */}
          <div style={{ marginTop: '2rem' }}>
            <div style={cardStyle}>
              <h2>Admin: Orders</h2>
              {adminOrders.length === 0 && <p>No orders yet.</p>}
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {adminOrders.map((o) => (
                  <li
                    key={o.order_id}
                    style={{
                      marginBottom: '0.7rem',
                      borderBottom: '1px solid #444',
                      paddingBottom: '0.5rem',
                    }}
                  >
                    <div>
                      <strong>Order ID:</strong> {o.order_id} |{' '}
                      <strong>Status:</strong> {o.status}
                    </div>
                    <div>
                      <strong>Client:</strong>{' '}
                      {o.first_name} {o.last_name} ({o.username})
                    </div>
                    <div><strong>Service Address:</strong> {o.service_address}</div>
                    <div><strong>Rooms:</strong> {o.number_of_rooms}</div>
                    <div>
                      <strong>Service Date:</strong>{' '}
                      {new Date(o.service_datetime).toLocaleString()}
                    </div>
                    <div>
                      <strong>Created:</strong>{' '}
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                    {o.status === 'scheduled' && (
                      <button
                        type="button"
                        style={{
                          ...buttonStyle,
                          padding: '0.2rem 0.5rem',
                          marginTop: '0.3rem',
                        }}
                        onClick={() => handleAdminCompleteAndBill(o.order_id)}
                      >
                        Complete & Create Bill
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Dashboard */}
          <div style={{ marginTop: '2rem' }}>
            <div style={cardStyle}>
              <h2>Admin Dashboard</h2>
              <button
                type="button"
                style={buttonStyle}
                onClick={fetchDashboard}
              >
                Refresh Dashboard
              </button>

              <div style={{ marginTop: '1rem' }}>
                <h3>3. Frequent Clients (by completed orders)</h3>
                {freqClients.length === 0 && <p>None.</p>}
                <ul>
                  {freqClients.map((c) => (
                    <li key={c.client_id}>
                      {c.first_name} {c.last_name} ({c.username}) –{' '}
                      {c.completed_orders} completed orders
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>4. Uncommitted Clients (3+ requests, 0 completed orders)</h3>
                {uncommittedClients.length === 0 && <p>None.</p>}
                <ul>
                  {uncommittedClients.map((c) => (
                    <li key={c.client_id}>
                      {c.first_name} {c.last_name} ({c.username}) –{' '}
                      {c.requests_count} requests
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>5. This Month&apos;s Accepted Quotes</h3>
                {acceptedQuotes.length === 0 && <p>None.</p>}
                <ul>
                  {acceptedQuotes.map((q) => (
                    <li key={q.quote_id}>
                      Quote #{q.quote_id} – Client {q.username} – Price $
                      {Number(q.quoted_price).toFixed(2)} – Accepted:{' '}
                      {new Date(q.accepted_time).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>6. Prospective Clients (no requests)</h3>
                {prospectiveClients.length === 0 && <p>None.</p>}
                <ul>
                  {prospectiveClients.map((c) => (
                    <li key={c.client_id}>
                      {c.first_name} {c.last_name} ({c.username}) – {c.email}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>7. Largest Job (by rooms, completed)</h3>
                {largestJobs.length === 0 && <p>None.</p>}
                <ul>
                  {largestJobs.map((r) => (
                    <li key={r.request_id}>
                      {r.first_name} {r.last_name} ({r.username}) –{' '}
                      {r.number_of_rooms} rooms at {r.service_address}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>8. Overdue Bills (unpaid &gt; 7 days)</h3>
                {overdueBills.length === 0 && <p>None.</p>}
                <ul>
                  {overdueBills.map((b) => (
                    <li key={b.bill_id}>
                      Bill #{b.bill_id} – {b.first_name} {b.last_name} ({b.username}) – $
                      {Number(b.amount).toFixed(2)} – Created:{' '}
                      {new Date(b.created_at).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>9. Bad Clients (have overdue bills)</h3>
                {badClients.length === 0 && <p>None.</p>}
                <ul>
                  {badClients.map((c) => (
                    <li key={c.client_id}>
                      {c.first_name} {c.last_name} ({c.username})
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>10. Good Clients (always paid within 24 hours)</h3>
                {goodClients.length === 0 && <p>None.</p>}
                <ul>
                  {goodClients.map((c) => (
                    <li key={c.client_id}>
                      {c.first_name} {c.last_name} ({c.username})
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h4>Bill Tools</h4>
                <button
                  type="button"
                  style={buttonStyle}
                  onClick={handleAdminReviseBill}
                >
                  Revise a Bill (by ID)
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;